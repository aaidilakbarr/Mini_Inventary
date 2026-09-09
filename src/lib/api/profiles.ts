import { supabase } from '@/lib/supabase'
import type { UserProfile, UserRole } from '@/types/auth'
import { recordAuditLog } from '@/lib/api/auditLogs'

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

export async function updateUserProfileRole(userId: string, newRole: UserRole): Promise<UserProfile | null> {
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

export async function updateMyProfile(
  userId: string,
  fullName: string,
  oldFullName?: string
): Promise<UserProfile> {
  const trimmedName = fullName.trim()

  // 1. Update profiles table
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: trimmedName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }

  // 2. Sync user metadata in Supabase Auth
  try {
    await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    })
  } catch (authErr) {
    console.warn('Failed to sync auth user metadata:', authErr)
  }

  // 3. Record Audit Log
  try {
    await recordAuditLog({
      action: 'UPDATE_PROFILE',
      entity_type: 'profile',
      entity_id: userId,
      details: {
        old_name: oldFullName || null,
        new_name: trimmedName,
      },
    })
  } catch (auditErr) {
    console.warn('Failed to record profile audit log:', auditErr)
  }

  return data as UserProfile
}

