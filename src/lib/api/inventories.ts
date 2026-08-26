import { supabase } from '@/lib/supabase'
import type { InventoryItem, CreateInventoryPayload, UpdateInventoryPayload } from '@/types/database'

export async function fetchInventories(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventories')
    .select(`
      *,
      category:categories(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching inventories:', error)
    throw error
  }
  return (data as InventoryItem[]) || []
}

export async function createInventory(payload: CreateInventoryPayload): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventories')
    .insert([payload])
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) {
    console.error('Error creating inventory:', error)
    throw error
  }
  return data as InventoryItem
}

export async function updateInventory(id: string, payload: UpdateInventoryPayload): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventories')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      category:categories(*)
    `)
    .single()

  if (error) {
    console.error('Error updating inventory:', error)
    throw error
  }
  return data as InventoryItem
}

export async function deleteInventory(id: string): Promise<void> {
  const { error } = await supabase
    .from('inventories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting inventory:', error)
    throw error
  }
}
