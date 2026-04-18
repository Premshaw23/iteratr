import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { runAgainstHiddenTests } from '@/lib/judge0'
import { evaluateCode } from '@/lib/gemini'
import { checkCodeExecutionLimit } from '@/lib/ratelimit'
import type { CodePayload } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user to check Pro status and enforce rate limits
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, is_pro')
    .eq('email', session.user.email)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check code execution rate limit (50/day for free, 500/day for pro)
  const withinLimit = await checkCodeExecutionLimit(user.id, user.is_pro)
  if (!withinLimit) {
    return NextResponse.json(
      { error: 'Daily code execution limit exceeded. Upgrade to Pro for more runs.' },
      { status: 429 }
    )
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
  
  // 1. Run against real tests on Judge0
  const testsToRun = payload.hidden_tests && payload.hidden_tests.length > 0
    ? payload.hidden_tests
    : [{ input: '', expected_output: '', description: 'Standard Execution (No hidden tests defined)' }]

  let codeToRun = user_code
  let isDriverGenerated = false
  const hasCppMain = payload.language === 'cpp' && user_code.includes('int main')
  const hasPyMain = payload.language === 'python' && (user_code.includes('if __name__') || user_code.includes('print('))
  const hasJsMain = payload.language === 'javascript' && user_code.includes('console.log')

  if (!hasCppMain && !hasPyMain && !hasJsMain && testsToRun.length > 0 && testsToRun[0].input) {
    const { generateIoDriver } = await import('@/lib/gemini')
    const ioDriver = await generateIoDriver(user_code, payload.language, testsToRun[0])
    codeToRun = `${user_code}\n\n${ioDriver}`
    isDriverGenerated = true
  }

  const results = await runAgainstHiddenTests(codeToRun, payload.language, testsToRun)

  // 2. Fallback to AI if Judge0 results are inconclusive (no output or network issues)
  // We call evaluateCode from gemini.ts which handles this logic
  const evaluation = await evaluateCode(
    question.problem_statement,
    user_code,
    payload.language,
    results,
    isDriverGenerated
  )

  const passedCount = results.filter((r) => r.passed).length
  
  // If AI says it's correct but Judge0 passed 0 tests (likely due to "no output"),
  // we treat it as "AI Verified"
  const aiVerified = evaluation.isCorrect && (passedCount === 0 || results.some(r => r.status === 'Network Error / Timeout'))

  return NextResponse.json({
    results,
    passed_count: aiVerified ? results.length : passedCount,
    total_count: results.length,
    all_passed: aiVerified || (passedCount === results.length),
    ai_feedback: evaluation.feedback,
    is_ai_verified: aiVerified
  })
}

