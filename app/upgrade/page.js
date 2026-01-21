'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function UpgradePage() {
    const { user } = useAuth()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleUpgrade = async () => {
        if (!user) {
            router.push('/auth')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // You'll create this price in Stripe Dashboard
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
                }),
            })

            const data = await response.json()

            if (data.error) {
                throw new Error(data.error)
            }

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            padding: '40px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div style={{
                maxWidth: '450px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '48px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
            }}>
                {/* Badge */}
                <div style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    padding: '6px 16px',
                    borderRadius: '50px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                }}>
                    Premium
                </div>

                <h1 style={{
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: '700',
                    marginBottom: '8px',
                }}>
                    Upgrade to Premium
                </h1>

                <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '32px',
                    fontSize: '16px',
                }}>
                    Unlock all features and remove limits
                </p>

                {/* Price */}
                <div style={{ marginBottom: '32px' }}>
                    <span style={{
                        color: 'white',
                        fontSize: '56px',
                        fontWeight: '700',
                    }}>
                        ₹125
                    </span>
                    <span style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '18px',
                    }}>
                        /month
                    </span>
                </div>

                {/* Features */}
                <div style={{
                    textAlign: 'left',
                    marginBottom: '32px',
                }}>
                    {[
                        'Unlimited file size',
                        'Screen quality compression (72 DPI)',
                        'Priority processing',
                        'No watermarks',
                        'Premium support',
                    ].map((feature, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 0',
                            borderBottom: index < 4 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        }}>
                            <span style={{
                                color: '#10b981',
                                fontSize: '20px',
                            }}>✓</span>
                            <span style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '15px',
                            }}>{feature}</span>
                        </div>
                    ))}
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        color: '#fca5a5',
                        fontSize: '14px',
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleUpgrade}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px 32px',
                        background: loading
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: loading ? 'none' : '0 8px 32px rgba(99, 102, 241, 0.3)',
                    }}
                >
                    {loading ? 'Processing...' : 'Upgrade Now'}
                </button>

                <p style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '12px',
                    marginTop: '16px',
                }}>
                    Cancel anytime. No questions asked.
                </p>
            </div>
        </div>
    )
}
