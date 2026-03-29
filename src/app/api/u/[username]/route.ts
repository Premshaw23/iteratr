import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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
    .single()

  // 2. Fallback to Display Name if not found (for friendly URLs)
  if (!user) {
    const { data: userByName } = await supabaseAdmin
      .from('users')
      .select('*')
      .ilike('display_name', safeUsername)
      .limit(1)
      .single()
    user = userByName
  }

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
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

  return NextResponse.json({
    user: {
      id:           user.id,
      display_name: user.display_name,
      avatar_url:   user.avatar_url,
      elo_rating:   user.elo_rating,
      streak_count: user.streak_count,
      reflection:   user.reflection_text,
    },
    stats:   stats ?? [],
    history: history ?? [],
  })
}
