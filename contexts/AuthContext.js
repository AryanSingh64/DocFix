'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

//create a box to store data
const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  //sores current logged in user (id:123, email:'22@gmail.com')
  const [user, setUser] = useState(null)
  // while loading if user is logged in show loading
  const [loading, setLoading] = useState(true)


  //use effect run code at specific tiem
  useEffect(() => {
    // Check active session => destructuring the response(session)
    supabase.auth.getSession().then(({ data: { session } }) => {
      //if session exist get user from it
      setUser(session?.user ?? null)
      //its loaded so set laoding == false
      setLoading(false)
    })

    // Listen for auth changes - watch login logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )


//     What is this?**
// - When component is removed from screen (unmounted)
// - Stop listening for events
// - Prevents memory leaks
    return () => subscription.unsubscribe()
  }, [])




  //SIGN UP
  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    return { data, error }
  }


  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    //makes data avail to all child comoponent -- anyone used useAuth() gets this
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)