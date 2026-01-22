import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request) {
    // Initialize Stripe inside the function (runtime) instead of top-level (build time)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    try {
        // Get current user from session
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    },
                },
            }
        )

        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json(
                { error: 'You must be logged in to upgrade' },
                { status: 401 }
            )
        }

        const { priceId } = await request.json()

        // Create Stripe Checkout session for subscription
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: session.user.email,
            metadata: {
                userId: session.user.id,
            },
            success_url: `${request.headers.get('origin')}/dashboard?payment=success`,
            cancel_url: `${request.headers.get('origin')}/upgrade?payment=cancelled`,
        })

        return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url })
    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
