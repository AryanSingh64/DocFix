'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

//create a box to store data
const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  //swho is logged in?
  const [user, setUser] = useState(null)
  //are we still checking?
  const [loading, setLoading] = useState(true)
//now user = null and loading = true

  //use effect run code at specific time
  useEffect(() => {
    // chk if user is logged in- ask supabase is there any session?
    supabase.auth.getSession().then(({ data: { session } }) => {
      //if session exist get user from it else null
      setUser(session?.user ?? null)
      //its loaded so set laoding == false
      setLoading(false)
    })

    // Listen for auth changes - watch login logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        //runs when 
        /*
        -user logs in
        -user logs out
        -token refreshes
         */
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
    return { data, error }  //return data and error to the one who calls it
  }


  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

const signOut = async () => {
  await supabase.auth.signOut({ scope: 'global' })
  setUser(null)
  
  // Clear all Supabase cookies manually
  document.cookie.split(";").forEach((c) => {
    const key = c.split("=")[0].trim()
    if (key.startsWith('sb-')) {
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  })
}

  return (
    //makes data avail to all child comoponent -- anyone used useAuth() gets this
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)