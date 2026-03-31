import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ reflection_text: null })
    .eq('email', session.user.email)

  if (error) {
    return NextResponse.json({ error: 'Failed to reset reflection' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
