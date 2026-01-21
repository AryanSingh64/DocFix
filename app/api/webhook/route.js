import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Use service role key to update user data
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        console.error('Webhook signature verification failed:', error)
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        )
    }

    // Handle different event types
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object
            const userId = session.metadata.userId
            const subscriptionId = session.subscription

            console.log('Payment successful for user:', userId)

            // Update plan_type to 'pro' in subscriptions table
            const { error } = await supabaseAdmin
                .from('subscriptions')
                .update({
                    plan_type: 'pro',
                    stripe_subscription_id: subscriptionId,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)

            if (error) {
                console.error('Error updating subscription:', error)

                // If no row exists, try inserting
                const { error: insertError } = await supabaseAdmin
                    .from('subscriptions')
                    .insert({
                        user_id: userId,
                        plan_type: 'pro',
                        stripe_subscription_id: subscriptionId
                    })

                if (insertError) {
                    console.error('Error inserting subscription:', insertError)
                }
            } else {
                console.log('Successfully updated user to pro!')
            }
            break
        }

        case 'customer.subscription.deleted': {
            // Subscription cancelled or expired - downgrade to free
            const subscription = event.data.object

            const { error } = await supabaseAdmin
                .from('subscriptions')
                .update({ plan_type: 'free' })
                .eq('stripe_subscription_id', subscription.id)

            if (error) {
                console.error('Error downgrading subscription:', error)
            }
            break
        }

        case 'invoice.payment_failed': {
            // Payment failed - could notify user or downgrade
            const invoice = event.data.object
            console.log('Payment failed for subscription:', invoice.subscription)
            break
        }
    }

    return NextResponse.json({ received: true })
}
