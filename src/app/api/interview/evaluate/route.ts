import { NextRequest, NextResponse } from 'next/server'
import { evaluateInterview } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { problem, history, userCode } = await req.json()

    if (!problem || !history) {
      return NextResponse.json({ error: 'Missing information' }, { status: 400 })
    }

    const scorecard = await evaluateInterview(problem, history, userCode)

    return NextResponse.json(scorecard)
  } catch (error: any) {
    console.error('Interview Evaluation Error:', error)
    return NextResponse.json({ error: 'Failed to evaluate interview' }, { status: 500 })
  }
}
