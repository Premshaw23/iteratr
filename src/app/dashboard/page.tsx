import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  // Server-side auth check — redirect if not logged in
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // Fetch full user data from DB
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', session.user.email!)
    .single()

  if (!user) redirect('/login')

  // Fetch topic stats
  const { data: topicStats } = await supabaseAdmin
    .from('topic_stats')
    .select('*')
    .eq('user_id', user.id)
    .order('fail_count', { ascending: false })

  // Fetch last 5 Elo changes
  const { data: eloHistory } = await supabaseAdmin
    .from('elo_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <DashboardClient
      user={user}
      topicStats={topicStats ?? []}
      eloHistory={eloHistory ?? []}
    />
  )
}
