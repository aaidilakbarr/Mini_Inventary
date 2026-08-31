import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/database'

export async function fetchCategories(type?: 'inventory' | 'subscription' | 'general'): Promise<Category[]> {
  let query = supabase.from('categories').select('*').order('name', { ascending: true })
  if (type) {
    query = query.eq('type', type)
  }
  const { data, error } = await query
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return (data as Category[]) || []
}

export async function createCategory(name: string, type: 'inventory' | 'subscription' | 'general', description?: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, type, description }])
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    throw error
  }
  return data as Category
}

export async function updateCategory(id: string, name: string, type: 'inventory' | 'subscription' | 'general', description?: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name, type, description, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating category:', error)
    throw error
  }
  return data as Category
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

