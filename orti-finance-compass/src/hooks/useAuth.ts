import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

export const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session: initialSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('🚨 Error getting initial session:', error)
      } else {
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in:', session?.user?.email)
            break
          case 'SIGNED_OUT':
            console.log('👋 User signed out')
            break
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed for:', session?.user?.email)
            break
          case 'USER_UPDATED':
            console.log('👤 User updated:', session?.user?.email)
            break
          case 'PASSWORD_RECOVERY':
            console.log('🔑 Password recovery initiated')
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('🚨 Error signing out:', error)
        throw error
      }
      console.log('👋 Successfully signed out')
    } catch (error) {
      console.error('🚨 Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    session,
    loading,
    signOut,
  }
}

export default useAuth