import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/auth'

export async function fetchProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }
  return (data as UserProfile[]) || []
}

export async function updateUserProfileRole(userId: string, newRole: 'admin' | 'staff'): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile role:', error)
    throw error
  }
  return data as UserProfile
}

