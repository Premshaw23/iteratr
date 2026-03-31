import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const safeUsername = decodeURIComponent(username)

  // 1. Fetch user by ID first
  let { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', safeUsername)
    .maybeSingle()

  // 2. Fallback to Display Name if not found (for friendly URLs)
  if (!user) {
    const { data: userByName } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('display_name', safeUsername)
      .limit(1)
      .maybeSingle()
    user = userByName
  }

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // ── Privacy Check ──
  const session = await getServerSession(authOptions)
  const isOwner = session?.user?.email === user.email

  if (!user.is_public && !isOwner) {
    return NextResponse.json({ 
      error: 'This profile is private',
      user: {
        display_name: user.display_name,
        avatar_url:   user.avatar_url,
        is_private:   true
      }
    }, { status: 403 })
  }

  // 2. Fetch public stats
  const { data: stats } = await supabaseAdmin
    .from('topic_stats')
    .select('*')
    .eq('user_id', user.id)

  // 3. Fetch elo history for the chart
  const { data: history } = await supabaseAdmin
    .from('elo_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  // 4. Compute simple aggregate metrics for the profile view
  const safeStats = stats ?? []
  const totalSolved = safeStats.reduce((acc, s: any) => acc + (s.solved_count ?? 0), 0)
  const totalFails  = safeStats.reduce((acc, s: any) => acc + (s.fail_count ?? 0), 0)
  const totalAttempts = totalSolved + totalFails
  const accuracyPct = totalAttempts === 0 ? 0 : Math.round((totalSolved / totalAttempts) * 100)
  const weakZoneCount = safeStats.filter((s: any) => s.is_weak_zone).length

  return NextResponse.json({
    user: {
      id:           user.id,
      display_name: user.display_name,
      avatar_url:   user.avatar_url,
      elo_rating:   user.elo_rating,
      streak_count: user.streak_count,
      reflection:   user.reflection_text,
    },
    stats:   safeStats,
    history: history ?? [],
    metrics: {
      total_attempts: totalAttempts,
      solved_count: totalSolved,
      fail_count: totalFails,
      accuracy_percent: accuracyPct,
      weak_zone_count: weakZoneCount,
    },
  })
}
