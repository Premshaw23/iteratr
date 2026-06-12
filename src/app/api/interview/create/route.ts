import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateCodeSpace } from '@/lib/gemini'
import { getTargetQuestionElo } from '@/lib/elo'
import { checkRateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Auth check
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { topic = 'arrays', difficulty = 'auto', style = 'neutral', timer = 'none', language = 'cpp', customPrompt } = body

  // Fetch User
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, elo_rating, is_pro')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // ── RATE LIMIT ──────────────────────────────────
  const { allowed } = await checkRateLimit(user.id, user.is_pro)
  if (!allowed) {
    return NextResponse.json({ 
      error: 'Technical Quota Exhausted',
      message: 'Your daily technical evaluation quota is full. Please try again tomorrow or upgrade to Pro.',
      code: 'QUOTA_EXCEEDED',
      is_pro: user.is_pro
    }, { status: 429 })
  }

  // ── GENERATE QUESTION ───────────────────────────
  let question: any = null

  // Fetch IDs of questions the user has already solved
  const { data: attempted } = await supabaseAdmin
    .from('attempts')
    .select('question_id')
    .eq('user_id', user.id)

  const attemptedIds = attempted?.map(a => a.question_id) || []

  // Determine difficulty range
  const targetElo = difficulty === 'hard' ? user.elo_rating + 200 : getTargetQuestionElo(user.elo_rating)
  const eloMin = targetElo - 150
  const eloMax = targetElo + 150

  // 1. Check Cache
  const { data: existing } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('type', 'code')
    .eq('topic', topic)
    .gte('difficulty_elo', eloMin)
    .lte('difficulty_elo', eloMax)
    .not('id', 'in', `(${attemptedIds.length > 0 ? attemptedIds.map(id => `"${id}"`).join(',') : '""'})`)
    .limit(1)

  if (existing && existing.length > 0) {
    const cachedQ = existing[0]
    // Confirm language matches
    if ((cachedQ.payload as any).language === language) {
      question = cachedQ
    }
  }

  // 2. Fallback: Gemini generation
  if (!question) {
    try {
      const generated = await generateCodeSpace(topic, targetElo, language as any, '', customPrompt)
      
      const { data: saved, error: dbError } = await supabaseAdmin
        .from('questions')
        .insert({
          type: generated.type,
          topic: generated.topic as any,
          subtopic: generated.subtopic,
          difficulty_elo: generated.difficulty_elo,
          problem_statement: generated.problem_statement,
          payload: generated.payload,
          hints: generated.hints,
          explanation: generated.explanation,
          tags: generated.tags,
          is_daily_challenge: false,
        })
        .select()
        .single()

      if (dbError) throw dbError
      question = saved
    } catch (err: any) {
      console.error('Failed to generate mock interview question via Gemini:', err)
      return NextResponse.json({ error: 'Failed to generate interview question. Check AI availability.' }, { status: 500 })
    }
  }

  // ── PERSIST INTERVIEW SESSION ───────────────────
  try {
    const { data: savedSession, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: user.id,
        session_type: 'interview',
        config: {
          topics: [topic as any],
          format: 'code',
          difficulty: difficulty as any,
          language: language as any,
          time_pressure: timer as any,
          interviewer_style: style as any,
          custom_prompt: customPrompt || null,
          company_mode: null,
          current_question: question,
        } as any,
        score_code: null,
        score_comms: null,
        score_speed: null,
        completed: false,
        transcript: {
          history: [],
          observerNotes: [],
          scorecard: null
        } as any
      })
      .select('id')
      .single()

    if (sessionError || !savedSession) {
      throw sessionError || new Error('Insert returned no data')
    }

    return NextResponse.json({
      question,
      sessionId: savedSession.id,
    })
  } catch (dbErr: any) {
    console.error('Failed to create mock interview session in DB:', dbErr)
    return NextResponse.json({ error: 'Failed to initialize database interview session' }, { status: 500 })
  }
}
