import React, { createContext, useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { AuthContextType, UserProfile, UserRole } from '@/types/auth'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string, currentUser?: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message)
      }

      if (data) {
        setProfile(data as UserProfile)
      } else if (currentUser) {
        // Fallback profile if row is not yet created
        const metaRole = (currentUser.user_metadata?.role as UserRole) || 'staff'
        const metaName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User'
        
        const fallbackProfile: UserProfile = {
          id: currentUser.id,
          full_name: metaName,
          email: currentUser.email || '',
          role: metaRole,
          avatar_url: currentUser.user_metadata?.avatar_url || null
        }
        setProfile(fallbackProfile)

        // Attempt upsert fallback
        await supabase.from('profiles').upsert([fallbackProfile]).select().maybeSingle()
      }
    } catch (err) {
      console.error('Failed to resolve user profile:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    let isMounted = true

    // Initial session retrieval
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser).finally(() => {
          if (isMounted) setIsLoading(false)
        })
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    }).catch((err) => {
      console.error('Error getting session:', err)
      if (isMounted) {
        setIsLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'staff') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      })
      if (error) throw error
      return { error: null }
    } catch (err: any) {
      return { error: err }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const role: UserRole = profile?.role || (user?.user_metadata?.role as UserRole) || 'staff'
  const isAdmin = role === 'admin'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
