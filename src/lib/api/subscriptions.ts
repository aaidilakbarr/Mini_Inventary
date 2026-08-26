import { supabase } from '@/lib/supabase'
import type { SubscriptionItem, CreateSubscriptionPayload, UpdateSubscriptionPayload } from '@/types/database'

export async function fetchSubscriptions(): Promise<SubscriptionItem[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      category:categories(*)
    `)
    .order('next_billing_date', { ascending: true })

  if (error) {
    console.error('Error fetching subscriptions:', error)
    throw error
  }
  return (data as SubscriptionItem[]) || []
}

export async function createSubscription(payload: CreateSubscriptionPayload): Promise<SubscriptionItem> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([payload])
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
  return data as SubscriptionItem
}

export async function updateSubscription(id: string, payload: UpdateSubscriptionPayload): Promise<SubscriptionItem> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
  return data as SubscriptionItem
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting subscription:', error)
    throw error
  }
}
