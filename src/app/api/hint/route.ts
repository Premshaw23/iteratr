import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateHint } from '@/lib/gemini'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    question_id,
    user_code    = '',
    error_output = '',
    failed_test  = '',
    hint_level,       // 1 | 2 | 3 | 4
    hints_so_far = [],
  } = body

  if (!question_id || !hint_level) {
    return NextResponse.json({ error: 'question_id and hint_level required' }, { status: 400 })
  }

  // Fetch question
  const { data: question } = await supabaseAdmin
    .from('questions')
    .select('problem_statement, hints, type')
    .eq('id', question_id)
    .single()

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  // For MCQ and Fill — use the pre-written hints from DB (faster, no API call needed)
  if (question.type === 'mcq' || question.type === 'fill') {
    const hintIndex = Math.min(hint_level - 1, question.hints.length - 1)
    const hint = question.hints[hintIndex]
    return NextResponse.json({ hint, source: 'stored' })
  }

  // For Code questions — use the ReAct agent via Gemini
  try {
    const { hint, reasoning } = await generateHint({
      problem_statement: question.problem_statement,
      user_code,
      error_output,
      failed_test,
      hint_level: hint_level as 1 | 2 | 3 | 4,
      hints_so_far,
    })

    console.log('[AGENT REASONING]:', reasoning)

    return NextResponse.json({ hint, source: 'generated' })

  } catch (err) {
    console.error('Hint generation error:', err)

    // Fallback to stored hint if AI fails
    const hintIndex = Math.min(hint_level - 1, question.hints.length - 1)
    return NextResponse.json({
      hint: question.hints[hintIndex] ?? 'Think carefully about the edge cases.',
      source: 'fallback',
    })
  }
}
