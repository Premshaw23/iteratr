import { NextRequest, NextResponse } from 'next/server'
import { generateInterviewResponse, generateSilentGraderFeedback } from '@/lib/gemini'
import { searchKnowledge } from '@/lib/vector'
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
        .select('id, reflection_text')
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
          memoryContextString = `CANDIDATE HISTORICAL CONTEXT:
- WEAK ZONES:
${stats.map(s => `  • ${s.subtopic} (${s.fail_count} failures)`).join('\n')}
${user.reflection_text ? `- REFLECTION SUMMARY:\n  "${user.reflection_text}"\n` : ''}
Use this cautiously to test their growth in related areas.`
        }
      }
    }

    // --- ENHANCEMENT: RAG Context (pgvector) ---
    // Pull a few relevant KB chunks for the current problem + latest message.
    const latest = Array.isArray(history) && history.length > 0 ? history[history.length - 1]?.content : ''
    const ragHits = await searchKnowledge(`${problem}\n${latest}`, 0.45, 3)
    const ragContext =
      ragHits.length > 0
        ? `\n\n[RELEVANT KNOWLEDGE BASE CONTEXT]:\n${ragHits.map((h: any) => h.content).join('\n---\n')}`
        : ''

    // 1. Call Interviewer and Silent Grader in parallel
    const [interviewerResponse, silentGraderFeedback] = await Promise.all([
      generateInterviewResponse(problem, history, userCode, style, memoryContextString + ragContext),
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
