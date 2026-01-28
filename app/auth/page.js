'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import AuthForm from '@/components/AuthForm'
import AuthGraphics from '@/components/AuthGraphics'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUp, signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (formData) => {
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, formData.fullName)
        if (error) throw error
        alert('Check your email to confirm your account!')
      } else {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#e8ecf4]">
      {/* Left Side - Form Section */}
      <div className="w-full lg:w-[55%] flex flex-col bg-white">
        {/* Mobile Header - Wavy Gradient (Hidden on desktop) */}
        <div className="lg:hidden">
          <div className="relative h-40 bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400 overflow-hidden">
            {/* Animated wavy lines */}
            <svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 400 160"
            >
              <motion.path
                d="M0,80 Q100,40 200,80 T400,80"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              <motion.path
                d="M0,100 Q100,60 200,100 T400,100"
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
              />
              <motion.path
                d="M0,120 Q100,80 200,120 T400,120"
                fill="none"
                stroke="rgba(0,255,255,0.2)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.6, ease: "easeInOut" }}
              />
            </svg>

            {/* Brand name */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold tracking-wide"
              >
                DOCFIX
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-white/80 tracking-widest mt-1"
              >
                Fix • Optimize • Secure
              </motion.p>
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-[#ecffec] flex-1 flex flex-col px-8 md:px-16 lg:px-20 py-8 lg:py-12">
          {/* Header Navigation */}
          <div className="flex justify-between items-center mb-8 lg:mb-12">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </motion.button>

            <p className="text-gray-600 text-sm">
              {isSignUp ? 'Already a member?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 font-semibold hover:underline transition"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>

          {/* Form Component */}
          <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto lg:mx-0">
            <AuthForm
              isSignUp={isSignUp}
              onSubmit={handleSubmit}
              loading={loading}
              error={error}
            />
          </div>

          {/* Language Selector (Mobile only) */}
          <div className="lg:hidden flex items-center gap-2 text-gray-500 text-sm mt-8">
            <span className="text-lg">🇬🇧</span>
            <span>ENG</span>
            <span className="text-xs">∧</span>
          </div>
        </div>
      </div>

      {/* Right Side - Graphics Section (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-[45%]">
        <AuthGraphics />
      </div>
    </div>
  )
}