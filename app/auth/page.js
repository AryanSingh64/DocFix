'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  //from useAuth that we exported in auth context
  const { signUp, signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault() //page no refesh
    setError('')       //clear prv err msgs
    setLoading(true)   //show loading

    try {
      if (isSignUp) {
        //await - wait for the data =>
        const { error } = await signUp(email, password, fullName)
        if (error) throw error //if err jump to catch block
        alert('Check your email to confirm your account!') //runs if no err
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        //navigate to another page
        router.push('/dashboard')
      }
      //err handling
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>{isSignUp ? 'Sign Up' : 'Sign In'}</h1> 
      {/* if sign up true sign up else sign it */}
      
      {error && (
        <div style={{ background: '#fee', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      {/* we use this so the error shows inside the div */}

      <form onSubmit={handleSubmit}>
        {isSignUp && (
            // if signup then show label full name and email and password
          <div style={{ marginBottom: '15px' }}>
            <label>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </div>
        )}
{/* this always shows */}
        <div style={{ marginBottom: '15px' }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  )
}