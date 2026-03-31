import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { runAgainstHiddenTests } from '@/lib/judge0'
import type { CodePayload } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { question_id, user_code } = body as { question_id?: string; user_code?: string }

  if (!question_id || !user_code?.trim()) {
    return NextResponse.json({ error: 'question_id and user_code are required' }, { status: 400 })
  }

  const { data: question } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('id', question_id)
    .single()

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  if (question.type !== 'code') {
    return NextResponse.json({ error: 'Run is only supported for code questions' }, { status: 400 })
  }

  const payload = question.payload as CodePayload
  const results = await runAgainstHiddenTests(user_code, payload.language, payload.hidden_tests || [])

  if (results.length === 0) {
    return NextResponse.json(
      {
        error: 'Judge0 execution failed or returned no results. Check JUDGE0_API_URL (and API key if required by your instance).',
        code: 'JUDGE0_EXECUTION_FAILED',
      },
      { status: 502 }
    )
  }

  const passedCount = results.filter((r) => r.passed).length
  return NextResponse.json({
    results,
    passed_count: passedCount,
    total_count: results.length,
    all_passed: passedCount === results.length,
  })
}

