import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 1. Fetch user ID
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 2. Fetch attempts from exactly 365 days ago
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  oneYearAgo.setHours(0, 0, 0, 0)

  // We group by day in JS for simplicity, as Supabase grouping can be complex with date truncation
  const { data: attempts } = await supabaseAdmin
    .from('attempts')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', oneYearAgo.toISOString())

  if (!attempts) return NextResponse.json([])

  // 3. Count by IST date string (YYYY-MM-DD)
  const { getISTDateString } = require('@/lib/date-utils')
  const activityMap: Record<string, number> = {}
  
  attempts.forEach(a => {
    const dateStr = getISTDateString(new Date(a.created_at))
    activityMap[dateStr] = (activityMap[dateStr] || 0) + 1
  })

  // Format as array for easier consumption
  const result = Object.entries(activityMap).map(([date, count]) => ({
    date,
    count
  }))

  return NextResponse.json(result)
}
