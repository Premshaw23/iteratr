import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'No session ID' }, { status: 400 })
  }

  try {
    // 1. Fetch the absolute latest status from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status === 'paid') {
      const userEmail = session.metadata?.user_email
      
      if (!userEmail) {
        return NextResponse.json({ error: 'No user email in metadata' }, { status: 400 })
      }

      console.log(`--- [INSTANT VERIFY]: Performance status PAID for ${userEmail} ---`)

      // 2. Perform fulfill locally (redundant with webhook, but faster UX)
      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_pro: true })
        .eq('email', userEmail)

      if (error) {
        console.error('--- [INSTANT VERIFY]: FAILED DB update ---', error)
        return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Pro status active.' })
    }

    return NextResponse.json({ success: false, message: 'Payment processing...' }, { status: 202 })

  } catch (err: any) {
    console.error('Stripe Verify Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
