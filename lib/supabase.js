import { createClient } from '@supabase/supabase-js'

// Use fallback empty strings during build time (env vars not available)
// The client will only work at runtime when env vars are present
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
    auth: {
        // This enables cookie-based storage instead of localStorage
        // which allows the middleware to read the session
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: {
            getItem: (key) => {
                if (typeof document === 'undefined') return null
                const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'))
                return match ? decodeURIComponent(match[2]) : null
            },
            setItem: (key, value) => {
                if (typeof document === 'undefined') return
                document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`
            },
            removeItem: (key) => {
                if (typeof document === 'undefined') return
                document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
            }
        }
    }
})