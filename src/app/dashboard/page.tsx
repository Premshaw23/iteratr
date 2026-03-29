import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import type { UserRow } from '@/types/database'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  // Server-side auth check — redirect if not logged in
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Fetch full user data from DB
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', session.user.email!)
    .single()

  if (!userData) redirect('/login')
  const user = userData as UserRow

  // Fetch topic stats
  const { data: topicStats } = await supabaseAdmin
    .from('topic_stats')
    .select('*')
    .eq('user_id', user.id)
    .order('fail_count', { ascending: false })

  // Fetch last 20 Elo changes
  const { data: eloHistory } = await supabaseAdmin
    .from('elo_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch interview session count
  const { count: interviewCount } = await supabaseAdmin
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('session_type', 'interview')

  return (
    <DashboardClient
      user={user}
      topicStats={topicStats ?? []}
      eloHistory={eloHistory ?? []}
      interviewCount={interviewCount || 0}
    />
  )
}
