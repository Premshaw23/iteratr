import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { evaluateInterview } from '@/lib/gemini'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { problem, history, userCode } = await req.json()

    if (!problem || !history) {
      return NextResponse.json({ error: 'Missing information' }, { status: 400 })
    }

    const scorecard = await evaluateInterview(problem, history, userCode)

    // ── Unlock Badge Logic ──
    if (session?.user?.email && scorecard.overall_score >= 80) {
      // Fetch current badges
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('unlocked_badges')
        .eq('email', session.user.email)
        .single()

      if (user && !user.unlocked_badges.includes('interview_ready')) {
        await supabaseAdmin
          .from('users')
          .update({
            unlocked_badges: [...user.unlocked_badges, 'interview_ready']
          })
          .eq('email', session.user.email)
      }
    }

    return NextResponse.json(scorecard)
  } catch (error: any) {
    console.error('Interview Evaluation Error:', error)
    return NextResponse.json({ error: 'Failed to evaluate interview' }, { status: 500 })
  }
}
