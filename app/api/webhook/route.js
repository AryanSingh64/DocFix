import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
    // Initialize clients inside the function (runtime) instead of top-level (build time)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )


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
            const userId = session.metadata?.userId
            const subscriptionId = session.subscription

            console.log('=== CHECKOUT SESSION COMPLETED ===')
            console.log('Session ID:', session.id)
            console.log('User ID from metadata:', userId)
            console.log('Subscription ID:', subscriptionId)
            console.log('Full metadata:', JSON.stringify(session.metadata))

            if (!userId) {
                console.error('ERROR: No userId in session metadata!')
                break
            }

            console.log('Attempting to update subscription for user:', userId)

            // Update plan_type to 'pro' in subscriptions table
            const { data: updateData, error } = await supabaseAdmin
                .from('subscriptions')
                .update({
                    plan_type: 'pro',
                    stripe_subscription_id: subscriptionId,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .select()

            console.log('Update result:', { data: updateData, error })

            if (error) {
                console.error('Error updating subscription:', error)

                // If no row exists, try inserting
                console.log('Trying to insert new subscription row...')
                const { data: insertData, error: insertError } = await supabaseAdmin
                    .from('subscriptions')
                    .insert({
                        user_id: userId,
                        plan_type: 'pro',
                        stripe_subscription_id: subscriptionId
                    })
                    .select()

                console.log('Insert result:', { data: insertData, error: insertError })

                if (insertError) {
                    console.error('Error inserting subscription:', insertError)
                } else {
                    console.log('Successfully INSERTED user as pro!')
                }
            } else if (!updateData || updateData.length === 0) {
                console.log('No rows updated, trying insert...')
                const { data: insertData, error: insertError } = await supabaseAdmin
                    .from('subscriptions')
                    .insert({
                        user_id: userId,
                        plan_type: 'pro',
                        stripe_subscription_id: subscriptionId
                    })
                    .select()

                console.log('Insert result:', { data: insertData, error: insertError })
            } else {
                console.log('Successfully UPDATED user to pro!')
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
