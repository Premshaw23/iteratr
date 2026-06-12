import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import ReplayClient from './replay-client'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ReplayPage(props: PageProps) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/login')

  // Fetch full user data to verify ownership
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', session.user.email)
    .single()

  if (!user) redirect('/login')

  // Fetch the specific session
  const { data: interviewSession } = await supabaseAdmin
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!interviewSession) notFound()

  // Verify ownership
  if (interviewSession.user_id !== user.id) {
    return redirect('/interview')
  }

  // Verify completion status
  if (!interviewSession.completed || !interviewSession.transcript) {
    return redirect('/interview')
  }

  return (
    <ReplayClient
      session={interviewSession}
    />
  )
}
