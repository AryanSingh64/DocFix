'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Bell, RefreshCw, FileText, ArrowRight, MoreVertical } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import DashboardStats from '@/components/DashboardStats'
import MascotAvatar from '@/components/MascotAvatar'

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [summaries, setSummaries] = useState([]);
  const [subscription, setSubscription] = useState(null)
  const [usageHistory, setUsageHistory] = useState([])
  const [usageCount, setUsageCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mascotId, setMascotId] = useState(1)
  const [totalStorageSaved, setTotalStorageSaved] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [allActivity, setAllActivity] = useState([])

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('docfix_darkmode')
    setIsDarkMode(savedMode !== 'false') // Default to dark
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('docfix_darkmode', newMode.toString())
  }

  // Initialize random mascot on first load
  useEffect(() => {
    const savedMascot = localStorage.getItem('docfix_mascot')
    if (savedMascot) {
      setMascotId(parseInt(savedMascot))
    } else {
      const randomId = Math.floor(Math.random() * 6) + 1
      setMascotId(randomId)
      localStorage.setItem('docfix_mascot', randomId.toString())
    }
  }, [])

  const handleMascotChange = (newId) => {
    setMascotId(newId)
    localStorage.setItem('docfix_mascot', newId.toString())
  }

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    if (!user) return

    try {
      setLoading(true)

      let { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

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

        if (createError) throw createError
        subData = newSub
      } else if (subError) {
        throw subError
      }

      setSubscription(subData)

      const { data: usageData, error: usageError } = await supabase
        .from('compression_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('compressed_at', { ascending: false })
        .limit(10)

      if (usageError) throw usageError
      setUsageHistory(usageData || [])

      // Calculate total storage saved
      const totalSaved = (usageData || []).reduce((acc, item) => {
        return acc + (item.original_size - item.compressed_size)
      }, 0)
      setTotalStorageSaved(totalSaved)

      const { count: todayCount, error: countError } = await supabase
        .from('compression_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) throw countError
      setUsageCount(todayCount || 0)

    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }


  //summaries fetching
  useEffect(() => {
    const fetchSummaries = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSummaries(data || []);
    }
    fetchSummaries();
  }, [user])

  // Combine summaries and compressions into one activity list
  useEffect(() => {
    const combined = [
      ...summaries.map(item => ({
        ...item,
        type: 'summary',
        date: item.created_at,
        displayName: item.file_name,
      })),
      ...usageHistory.map(item => ({
        ...item,
        type: 'compression',
        date: item.compressed_at,
        displayName: item.file_name,
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    setAllActivity(combined);
  }, [summaries, usageHistory]);

  // Color mapping for activity types
  const activityColors = {
    summary: {
      bg: 'bg-cyan-500/20',
      border: 'border-cyan-500/30',
      icon: 'text-cyan-400',
      badge: 'bg-cyan-500/20 text-cyan-400',
      label: '✨ Summary'
    },
    compression: {
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      icon: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-400',
      label: '📦 Compressed'
    }
  };



  useEffect(() => {
    const onFocus = () => fetchUserData()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  })

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth'  
  }

  const formatBytes = (bytes) => {
    if (bytes === null || bytes === undefined || isNaN(bytes) || bytes <= 0) return '0 KB'
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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#13111a]">
        <div className="text-center">
          <div className="relative w-16 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-purple-500 rounded-lg animate-pulse"></div>
            <div className="absolute top-0 right-0 w-4 h-4 bg-purple-300 rounded-bl-lg"></div>
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">PDF</span>
          </div>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isPro = subscription?.plan_type === 'pro'

  return (
    <div className="min-h-screen bg-[#13111a] flex">
      <Sidebar
        onSignOut={handleSignOut}
        userName={user.user_metadata?.full_name}
        userEmail={user.email}
        mascotId={mascotId}
      // isDarkMode={isDarkMode}
      // onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Content */}
      <main className="flex-1 ml-0 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
        {/* Top Header */}
        <div className="flex items-center justify-end">

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchUserData}
              className="w-10 h-10 rounded-xl bg-[#1a1625] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition"
            >
              <RefreshCw size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-[#1a1625] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition relative"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full"></span>
            </motion.button>

            {/* Profile Avatar */}
            <MascotAvatar
              mascotId={mascotId}
              size="sm"
              editable={true}
              onSelect={handleMascotChange}
            />
          </div>
        </div>

        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {user.user_metadata?.full_name || 'User'}!
          </h1>
          <p className="text-gray-400">{user.email}</p>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8">
          <DashboardStats
            totalDocs={usageHistory.length}
            storageSaved={totalStorageSaved}
            isPro={isPro}
            totalCompressions={usageCount}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <motion.button
            onClick={() => router.push('/compress-pdf')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer p-6 bg-gradient-to-br from-purple-600/20 to-pink-900/10 border border-purple-500/20 rounded-2xl text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white mb-1">Compress PDF</p>
                <p className="text-sm text-gray-400">Reduce file size without quality loss</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight size={20} className="text-white" />
              </div>
            </div>
          </motion.button>

          <motion.button
            onClick={() => router.push('/summarise')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer p-6 bg-gradient-to-br from-cyan-600/20 to-blue-600/10 border border-cyan-500/20 rounded-2xl text-left group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white mb-1">Summarize Document</p>
                <p className="text-sm text-gray-400">AI-powered document summarization</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight size={20} className="text-white" />
              </div>
            </div>
          </motion.button>

          {!isPro && (
            <motion.button
              onClick={() => router.push('/upgrade')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cursor-pointer p-6 bg-gradient-to-br from-amber-600/20 to-orange-600/10 border border-amber-500/20 rounded-2xl text-left group md:col-span-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white mb-1">⭐ Upgrade to Pro</p>
                  <p className="text-sm text-gray-400">Unlimited compressions, larger files, priority support</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={20} className="text-white" />
                </div>
              </div>
            </motion.button>
          )}
        </div>


        {/* Unified Recent Activity */}
        <div id="activity">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            <button
              onClick={fetchUserData}
              className="cursor-pointer text-sm text-purple-400 hover:text-purple-300 flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {allActivity.length === 0 ? (
            <div className="p-10 text-center bg-[#1a1625] rounded-2xl border border-white/10">
              <FileText size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allActivity.map((item, index) => {
                const colors = activityColors[item.type];
                return (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                          <FileText size={18} className={colors.icon} />
                        </div>
                        <div>
                          <p className="font-medium text-white">{item.displayName}</p>
                          <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                        </div>
                      </div>

                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${colors.badge}`}>
                        {colors.label}
                      </span>
                    </div>

                    {/* Show preview for summaries */}
                    {item.type === 'summary' && (
                      <div className="mt-2">
                        <p className="text-white/60 text-sm line-clamp-2">{item.summary_text}</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(item.summary_text)}
                          className="mt-2 text-xs bg-white/10 px-3 py-1 rounded hover:bg-white/20 transition"
                        >
                          📋 Copy Summary
                        </button>
                      </div>
                    )}

                    {/* Show size info for compressions */}
                    {item.type === 'compression' && item.original_size && (
                      <p className="text-white/60 text-sm mt-2">
                        {formatBytes(item.original_size)} → {formatBytes(item.compressed_size)}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}