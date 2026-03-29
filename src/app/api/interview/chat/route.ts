import { NextRequest, NextResponse } from 'next/server'
import { generateInterviewResponse } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const { problem, history, userCode, style } = await req.json()

    if (!problem || !history) {
      return NextResponse.json({ error: 'Missing information' }, { status: 400 })
    }

    const aiResponse = await generateInterviewResponse(problem, history, userCode, style)

    return NextResponse.json({ content: aiResponse })
  } catch (error: any) {
    console.error('Interview Chat Error:', error)
    return NextResponse.json({ error: 'Failed to get interview response' }, { status: 500 })
  }
}
