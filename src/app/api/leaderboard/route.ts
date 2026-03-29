import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: topUsers, error } = await supabaseAdmin
      .from('users')
      .select('id, display_name, avatar_url, elo_rating, streak_count')
      .order('elo_rating', { ascending: false })
      .limit(12)

    if (error) throw error

    return NextResponse.json(topUsers)
  } catch (error) {
    console.error('Leaderboard Error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
