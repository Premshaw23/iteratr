import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { origin } = new URL(req.url)

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pro Subscription',
            },
            unit_amount: 0, // ALPHA PROMO: $0.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        user_email: session.user.email,
      }
    })

    return NextResponse.json({ url: checkoutSession.url })

  } catch (err: any) {
    console.error('Stripe Session Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
