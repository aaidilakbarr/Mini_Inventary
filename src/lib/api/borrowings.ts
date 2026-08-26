import { supabase } from '@/lib/supabase'
import type { BorrowingItem, CreateBorrowingPayload } from '@/types/database'

export async function fetchBorrowings(): Promise<BorrowingItem[]> {
  const { data, error } = await supabase
    .from('borrowings')
    .select(`
      *,
      inventory:inventories(*),
      borrower:profiles(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching borrowings:', error)
    throw error
  }
  return (data as BorrowingItem[]) || []
}

export async function createBorrowing(payload: CreateBorrowingPayload): Promise<BorrowingItem> {
  const { data, error } = await supabase
    .from('borrowings')
    .insert([{
      inventory_id: payload.inventory_id,
      borrower_id: payload.borrower_id,
      due_date: payload.due_date,
      start_date: payload.start_date || new Date().toISOString(),
      status: payload.status || 'Pending Approval',
      notes: payload.notes || null,
    }])
    .select(`
      *,
      inventory:inventories(*),
      borrower:profiles(*)
    `)
    .single()

  if (error) {
    console.error('Error creating borrowing:', error)
    throw error
  }

  // If created directly as 'Borrowed', update inventory status
  if (payload.status === 'Borrowed') {
    await supabase
      .from('inventories')
      .update({ status: 'Borrowed' })
      .eq('id', payload.inventory_id)
  }

  return data as BorrowingItem
}

export async function approveBorrowing(borrowingId: string, inventoryId: string): Promise<void> {
  const { error: borrowError } = await supabase
    .from('borrowings')
    .update({ 
      status: 'Borrowed', 
      start_date: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('id', borrowingId)

  if (borrowError) {
    console.error('Error approving borrowing:', borrowError)
    throw borrowError
  }

  // Update inventory status to 'Borrowed'
  await supabase
    .from('inventories')
    .update({ status: 'Borrowed' })
    .eq('id', inventoryId)
}

export async function rejectBorrowing(borrowingId: string): Promise<void> {
  const { error } = await supabase
    .from('borrowings')
    .update({ 
      status: 'Rejected',
      updated_at: new Date().toISOString() 
    })
    .eq('id', borrowingId)

  if (error) {
    console.error('Error rejecting borrowing:', error)
    throw error
  }
}

export async function returnBorrowing(borrowingId: string, inventoryId: string): Promise<void> {
  const { error: borrowError } = await supabase
    .from('borrowings')
    .update({ 
      status: 'Returned', 
      return_date: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('id', borrowingId)

  if (borrowError) {
    console.error('Error returning borrowing:', borrowError)
    throw borrowError
  }

  // Set inventory status back to 'Available'
  await supabase
    .from('inventories')
    .update({ status: 'Available' })
    .eq('id', inventoryId)
}

export async function deleteBorrowing(borrowingId: string): Promise<void> {
  const { error } = await supabase
    .from('borrowings')
    .delete()
    .eq('id', borrowingId)

  if (error) {
    console.error('Error deleting borrowing:', error)
    throw error
  }
}
