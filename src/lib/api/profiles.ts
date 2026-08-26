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
