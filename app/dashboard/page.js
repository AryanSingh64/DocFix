'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext' //gets user from auth
import { useRouter } from 'next/navigation' //for redirecting 
import { supabase } from '@/lib/supabase' //for fetching data
import Navbar from '@/components/Navbar'
export default function Dashboard() {
  //for checking user is signed in
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()

  // State to store user's data
  const [subscription, setSubscription] = useState(null)
  const [usageHistory, setUsageHistory] = useState([])
  const [usageCount, setUsageCount] = useState(0)
  //for loading the data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Redirect to login if not authenticated
  // aka protected route
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     //using router to push to /auth if not logged in
  //     router.push('/auth')
  //   }
  //   //this check if any of them changes
  //   //like user auth the user and authloading changes so we check that 
  // }, [user, authLoading, router])


  // Fetch user's data when component loads from db
  useEffect(() => {
    //on fetch if user is logged in
    if (user) {
      fetchUserData()
    }

    //if user changed then we check that if it is logged in
  }, [user])

  const fetchUserData = async () => {
    console.log('fetchUserData called')
    if (!user) return

    console.log('User ID:', user.id)
    try {
      setLoading(true)

      //fetching
      // 1. Get or create subscription
      //fetching from db and renaming it
      let { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        //.eq = equals select all where uid == 'abc'
        .eq('user_id', user.id)
        .limit(1)  // Get just one even if there are duplicates
        .maybeSingle()  // Use maybeSingle instead of single to handle 0 or 1 rows

      // If no subscription exists, create one
      //PGRST116 - supabase err code(no rows found)
      //it means if no sub found create one (free plan)
      if (subError && subError.code === 'PGRST116') {
        const { data: newSub, error: createError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            plan_type: 'free',
            status: 'active'
          })
          .select()
          .single()

        console.log(subData);
        console.log(subError);



        if (createError) throw createError
        subData = newSub
      } else if (subError) {
        throw subError
      }

      setSubscription(subData)

      // 2. Get usage history (last 10 compressions)
      const { data: usageData, error: usageError } = await supabase
        .from('compression_usage')
        .select('*')
        .eq('user_id', user.id)
        //maintails order 
        .order('compressed_at', { ascending: false })
        .limit(10)

      console.log('Usage data:', usageData)
      console.log('Usage error:', usageError)
      if (usageError) throw usageError
      setUsageHistory(usageData || [])

      // 3. Get today's usage count (simplified - just count all for today)
      const { count: todayCount, error: countError } = await supabase
        .from('compression_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      console.log('Today usage count:', todayCount)
      if (countError) {
        console.error('Count error:', countError)
        throw countError
      }

      // For now, use total count as today's count
      // TODO: Fix with proper date filtering using Postgres date functions
      setUsageCount(todayCount || 0)

    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false) //spinner
    }
  }

  // Refetch on focus
  useEffect(() => {
    const onFocus = () => {
      console.log('Window focused, refreshing data...');
      fetchUserData();
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  });

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth') //same logic as above
  }

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show loading while checking auth (spinner show or hide)
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="relative w-16 h-20 mx-auto mb-4">
            {/* PDF Icon shape */}
            <div className="absolute inset-0 bg-red-500 rounded-lg animate-pulse"></div>
            <div className="absolute top-0 right-0 w-4 h-4 bg-red-300 rounded-bl-lg"></div>
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">PDF</span>
          </div>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
          </div>
        </div>
      </div>
    )
  }
  // Don't render anything if no user
  if (!user) {
    return null
  }

  const isPro = subscription?.plan_type === 'pro'
  const freeLimit = 5
  //if pro no limits, else 
  const usagePercent = isPro ? 0 : (usageCount / freeLimit) * 100

  return (
    <div className="p-5 max-w-7xl mx-auto bg-neutral-900 text-white">

      {/* Header */}
      {/* shows name, email, and signout */}
      <div className="flex justify-between items-center mb-8 border-b-2 border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.user_metadata?.full_name || 'User'}! 👋
          </h1>
          <p className="text-gray-400">{user.email}</p>
        </div>
        <button
          //router push
          onClick={handleSignOut}
          className="px-5 py-2.5 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-5">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Plan Card */}
        <div className={`${isPro ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'} border-2 rounded-lg p-5 text-black`}>
          <h3 className="text-sm text-gray-600 mb-2">Current Plan</h3>
          <div className="text-2xl font-bold mb-3">
            {isPro ? '⭐ Pro' : '🆓 Free'}
          </div>
          {!isPro && (
            <button
              onClick={() => router.push('/upgrade')}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
            >
              Upgrade to Pro
            </button>
          )}
        </div>


        {/* Total Compressions Card */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-5">
          <h3 className="text-sm text-gray-600 mb-2">Total Compressions</h3>
          <div className="text-2xl font-bold">{usageHistory.length}</div>
          <p className="text-xs text-gray-600 mt-2">All time</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <button
          onClick={() => router.push('/compress-pdf')}
          className="px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition"
        >
          📄 Compress PDF
        </button>
      </div>

      {/* Recent Compressions */}
      <div className="text-black" >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-white font-bold">Recent Compressions</h2>
          <button
            onClick={fetchUserData}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Refresh Data ↻
          </button>
        </div>
        {usageHistory.length === 0 ? (
          <div className="p-10 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-600">
              No compressions yet. Compress your first PDF to get started!
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {usageHistory.map((item, index) => (
              <div
                key={item.id}
                className={`p-4 flex justify-between items-center ${index < usageHistory.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
              >
                <div className="flex-1">
                  <div className="font-bold mb-1">{item.file_name}</div>
                  <div className="text-xs text-gray-600">
                    {formatDate(item.compressed_at)} • Quality: {item.quality}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600 font-bold">
                    Saved {formatBytes(item.original_size - item.compressed_size)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatBytes(item.original_size)} → {formatBytes(item.compressed_size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}