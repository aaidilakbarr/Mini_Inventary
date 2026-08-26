import { supabase } from '@/lib/supabase'
import type { ReminderItem, CreateReminderPayload, UpdateReminderPayload, ReminderStatus } from '@/types/database'

export async function fetchReminders(): Promise<ReminderItem[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching reminders:', error)
    throw error
  }
  return (data as ReminderItem[]) || []
}

export async function createReminder(payload: CreateReminderPayload): Promise<ReminderItem> {
  const { data, error } = await supabase
    .from('reminders')
    .insert([{
      title: payload.title,
      description: payload.description || null,
      source_type: payload.source_type || 'manual',
      source_id: payload.source_id || null,
      due_date: payload.due_date,
      priority: payload.priority || 'Sedang',
      status: payload.status || 'Upcoming'
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating reminder:', error)
    throw error
  }
  return data as ReminderItem
}

export async function updateReminder(id: string, payload: UpdateReminderPayload): Promise<ReminderItem> {
  const { data, error } = await supabase
    .from('reminders')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating reminder:', error)
    throw error
  }
  return data as ReminderItem
}

export async function updateReminderStatus(id: string, status: ReminderStatus): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating reminder status:', error)
    throw error
  }
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting reminder:', error)
    throw error
  }
}
