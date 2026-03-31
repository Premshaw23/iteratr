import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateEloChange } from '@/lib/elo'
import { generateMCQFeedback, evaluateCode, evaluateFillAnswers, generateUserReflection } from '@/lib/gemini'
import type { MCQPayload, CodePayload } from '@/types/database'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    question_id,
    submitted_answer, // for MCQ: "0" | "1" | "2" | "3" (chosen index as string)
    hints_used = 0,
    time_taken_seconds = 0,
    session_id,
  } = body

  if (!question_id || submitted_answer === undefined) {
    return NextResponse.json({ error: 'question_id and submitted_answer are required' }, { status: 400 })
  }

  // Fetch user
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, elo_rating, streak_count, updated_at')
    .eq('email', session.user.email)
    .single()

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Fetch question
  const { data: question } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('id', question_id)
    .single()

  if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  try {
    // ── Evaluate MCQ answer ──────────────────────────────────────
    let isCorrect = false
    let feedbackMessage = ''

    if (question.type === 'mcq') {
      const payload = question.payload as MCQPayload
      const chosenIndex   = parseInt(submitted_answer)
      const correctIndex  = payload.correct_index

      isCorrect = chosenIndex === correctIndex

      // Generate AI feedback explaining why right or wrong
      feedbackMessage = await generateMCQFeedback(
        question.problem_statement,
        payload.options,
        correctIndex,
        chosenIndex,
        payload.distractor_reasons
      ).catch(() => "Feedback generation failed. Check your answer above.") // Fallback
    } else if (question.type === 'fill') {
      const payload = question.payload as any
      const submittedAnswers = JSON.parse(submitted_answer) as string[]
      const correctAnswers = payload.blanks.map((b: any) => b.answer)

      // Use AI for semantic matching (handles '0' vs 'zero' etc)
      const result = await evaluateFillAnswers(
        question.problem_statement,
        submittedAnswers,
        correctAnswers
      ).catch(() => ({ 
        isCorrect: submittedAnswers.map((ans, i) => ans.trim().toLowerCase() === correctAnswers[i]?.trim().toLowerCase()),
        generalFeedback: "Matches found"
      }))

      isCorrect = result.isCorrect.every(v => v === true)

      if (isCorrect) {
        feedbackMessage = result.generalFeedback || "Perfect! You've filled all the blanks correctly."
      } else {
        // Use the first incorrect blank's specific hint if available, otherwise general feedback
        const firstErrorIdx = result.isCorrect.findIndex(v => v === false)
        const specificHint = payload.blanks[firstErrorIdx]?.hint_if_wrong
        
        feedbackMessage = specificHint 
          ? `Not quite. ${specificHint}`
          : (result.generalFeedback || "Check your reasoning for the blanks — some don't seem right.")
      }
    } else if (question.type === 'code') {
      const payload = question.payload as CodePayload
      
      // AI-based verification for now (fallback for Judge0)
      const result = await evaluateCode(
        question.problem_statement,
        submitted_answer, // user_code is stored in submitted_answer for code type
        payload.language,
        payload.hidden_tests
      )
      
      isCorrect = result.isCorrect
      feedbackMessage = result.feedback
    } else if (question.type === 'order') {
      const payload = question.payload as any
      const submittedOrder = JSON.parse(submitted_answer) as string[]
      const correctOrder = payload.steps
      
      // Check if the submitted array exactly matches the correct sequence
      isCorrect = JSON.stringify(submittedOrder) === JSON.stringify(correctOrder)
      
      if (isCorrect) {
        feedbackMessage = "Correct sequence! You've mastered the order of these steps."
      } else {
        // Find the first misplaced item for a more helpful hint
        const firstErrorIdx = submittedOrder.findIndex((val, i) => val !== correctOrder[i])
        feedbackMessage = `Wait, step ${firstErrorIdx + 1} looks out of place. Re-examine the process.`
      }
    }

    // ── Calculate Elo change ──────────────────────────────────────
    const eloResult = calculateEloChange({
      userElo:     user.elo_rating,
      questionElo: question.difficulty_elo,
      isCorrect,
      hintsUsed:   hints_used,
      timeTaken:   time_taken_seconds,
      timeLimit:   0, // no time limit for now
      streakCount: user.streak_count || 0,
    })

    // ── Save attempt ──────────────────────────────────────────────
    const { data: attempt } = await supabaseAdmin
      .from('attempts')
      .insert({
        user_id:           user.id,
        question_id,
        submitted_answer:  String(submitted_answer),
        is_correct:        isCorrect,
        hints_used,
        time_taken_seconds,
        elo_before:        user.elo_rating,
        elo_after:         eloResult.newElo,
        elo_change:        eloResult.change,
      })
      .select()
      .single()

    // ── Update user Elo & Streak (IST TIME) ───────────────────────
    const { getISTDateString, getYesterdayISTDateString } = require('@/lib/date-utils')
    
    const lastDate = getISTDateString(new Date(user.updated_at))
    const todayDate = getISTDateString()
    const yesterdayDate = getYesterdayISTDateString()

    let newStreak = user.streak_count || 0
    if (lastDate === yesterdayDate) {
      newStreak += 1
    } else if (lastDate !== todayDate) {
      newStreak = 1
    } else if (newStreak === 0) {
      newStreak = 1
    }

    await supabaseAdmin
      .from('users')
      .update({ 
        elo_rating:   eloResult.newElo, 
        streak_count: newStreak,
        updated_at:   new Date().toISOString() 
      })
      .eq('id', user.id)

    // ── Save Elo history ──────────────────────────────────────────
    await supabaseAdmin.from('elo_history').insert({
      user_id:     user.id,
      elo_before:  user.elo_rating,
      elo_after:   eloResult.newElo,
      elo_change:  eloResult.change,
      reason:      eloResult.reason,
      question_id,
    })

    // ── Update topic stats ────────────────────────────────────────
    const { data: existingStat } = await supabaseAdmin
      .from('topic_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('subtopic', question.subtopic)
      .single()

    if (existingStat) {
      // ── UPDATE EXISTING STATS ───────────────────────────────────
      // On success: decrement fail_count (reward progress) and increase streak
      // On failure: increment fail_count and reset streak
      const newFails   = isCorrect 
        ? Math.max(0, existingStat.fail_count - 1) 
        : existingStat.fail_count + 1
      
      const newSolved  = isCorrect ? existingStat.solved_count + 1 : existingStat.solved_count
      const newConsec  = isCorrect ? existingStat.consecutive_correct + 1 : 0
      
      // Escape weak zone if: fails drop below threshold OR user hits a 2-solve streak
      const isWeakZone = newFails >= 3 && newConsec < 2

      await supabaseAdmin
        .from('topic_stats')
        .update({
          fail_count:           newFails,
          solved_count:         newSolved,
          consecutive_correct:  newConsec,
          is_weak_zone:         isWeakZone,
          updated_at:           new Date().toISOString(),
        })
        .eq('id', existingStat.id)
    } else {
      // ── CREATE NEW TOPIC STAT ────────────────────────────────────
      await supabaseAdmin
        .from('topic_stats')
        .insert({
          user_id:              user.id,
          topic:                question.topic,
          subtopic:             question.subtopic,
          fail_count:           isCorrect ? 0 : 1,
          solved_count:         isCorrect ? 1 : 0,
          consecutive_correct:  isCorrect ? 1 : 0,
          is_weak_zone:         false,
        })
    }

    // ── Update Reflection (Long-term memory) every 5 attempts ──────────
    const { count: attemptCount } = await supabaseAdmin
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (attemptCount && attemptCount % 5 === 0) {
      const { data: recentAttempts } = await supabaseAdmin
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      const { data: stats } = await supabaseAdmin
        .from('topic_stats')
        .select('*')
        .eq('user_id', user.id)

      const reflection = await generateUserReflection(session.user?.name || 'User', stats || [], recentAttempts || [])
      
      await supabaseAdmin
        .from('users')
        .update({ reflection_text: reflection })
        .eq('id', user.id)
    }

    return NextResponse.json({
      is_correct:      isCorrect,
      feedback:        feedbackMessage,
      elo_before:      user.elo_rating,
      elo_after:       eloResult.newElo,
      elo_change:      eloResult.change,
      elo_reason:      eloResult.reason,
      explanation:     isCorrect ? question.explanation : null,
      attempt_id:      attempt?.id,
    })
  } catch (error: any) {
    console.error('Error processing attempt:', error)
    return NextResponse.json({ 
      error: 'Failed to process attempt', 
      message: error.message || 'An unexpected error occurred' 
    }, { status: 500 })
  }
}
