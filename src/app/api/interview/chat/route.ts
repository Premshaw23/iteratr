import { NextRequest, NextResponse } from 'next/server'
import { generateInterviewResponse, generateSilentGraderFeedback } from '@/lib/gemini'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { problem, history, userCode, style } = body

    if (!problem || !history) {
      return NextResponse.json({ error: 'Missing information' }, { status: 400 })
    }

    // --- ENHANCEMENT: Cross-Domain Memory (Phase 3) ---
    // Fetch user's historical performance to inform the interviewer
    const session = await getServerSession(authOptions)
    let memoryContextString = ''
    if (session?.user?.email) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single()
      
      if (user) {
        const { data: stats } = await supabaseAdmin
          .from('topic_stats')
          .select('topic, subtopic, fail_count, solved_count, is_weak_zone')
          .eq('user_id', user.id)
          .eq('is_weak_zone', true)
          .limit(5)
      
        if (stats && stats.length > 0) {
          memoryContextString = `CANDIDATE HISTORICAL CONTEXT (Weak zones detected): \n${stats.map(s => `- ${s.subtopic} (${s.fail_count} failures)`).join('\n')}\nUse this cautiously to test their growth in related areas.`
        }
      }
    }

    // 1. Call Interviewer and Silent Grader in parallel
    const [interviewerResponse, silentGraderFeedback] = await Promise.all([
      generateInterviewResponse(problem, history, userCode, style, memoryContextString),
      generateSilentGraderFeedback(problem, history, userCode)
    ])

    // 2. Note: for now we just log the grader feedback or could save it to a session log in DB
    console.log('[SILENT GRADER LOG]:', silentGraderFeedback)

    return NextResponse.json({ 
      content: interviewerResponse,
      grader_notes: silentGraderFeedback // Optionally send back to client for hidden logging
    })
  } catch (error: any) {
    console.error('Interview Chat Error:', error)
    return NextResponse.json({ error: 'Failed to get interview response' }, { status: 500 })
  }
}
