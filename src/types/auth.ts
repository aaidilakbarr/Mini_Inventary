import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'staff' | 'user'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

export interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  role: UserRole
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}
