import { supabase } from '@/lib/supabase'
import type { BorrowingItem, CreateBorrowingPayload } from '@/types/database'

async function decreaseInventoryStock(inventoryId: string) {
  try {
    const { data: inv, error: fetchErr } = await supabase
      .from('inventories')
      .select('quantity, status')
      .eq('id', inventoryId)
      .single()

    if (!fetchErr && inv) {
      const currentQty = typeof inv.quantity === 'number' ? inv.quantity : 1
      const newQty = Math.max(0, currentQty - 1)
      const newStatus = newQty <= 0 ? 'Borrowed' : 'Available'

      await supabase
        .from('inventories')
        .update({
          quantity: newQty,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryId)
    }
  } catch (err) {
    console.error('Error decreasing inventory stock:', err)
  }
}

async function increaseInventoryStock(inventoryId: string) {
  try {
    const { data: inv, error: fetchErr } = await supabase
      .from('inventories')
      .select('quantity, status')
      .eq('id', inventoryId)
      .single()

    if (!fetchErr && inv) {
      const currentQty = typeof inv.quantity === 'number' ? inv.quantity : 0
      const newQty = currentQty + 1
      const newStatus = inv.status === 'Borrowed' ? 'Available' : inv.status

      await supabase
        .from('inventories')
        .update({
          quantity: newQty,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryId)
    }
  } catch (err) {
    console.error('Error increasing inventory stock:', err)
  }
}

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

  // If created directly as 'Borrowed', reduce inventory stock
  if (payload.status === 'Borrowed') {
    await decreaseInventoryStock(payload.inventory_id)
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

  // Decrease inventory stock
  await decreaseInventoryStock(inventoryId)
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

export async function returnBorrowing(
  borrowingId: string, 
  currentUserId?: string, 
  isAdmin: boolean = false
): Promise<void> {
  // 1. Fetch current borrowing record to ensure exact item and borrower match
  const { data: borrowing, error: fetchError } = await supabase
    .from('borrowings')
    .select('id, inventory_id, borrower_id, status, borrower:profiles(full_name)')
    .eq('id', borrowingId)
    .single()

  if (fetchError || !borrowing) {
    throw new Error('Data peminjaman tidak ditemukan.')
  }

  if (borrowing.status !== 'Borrowed') {
    throw new Error(`Aset tidak dapat dikembalikan karena status saat ini adalah "${borrowing.status}".`)
  }

  // 2. Strict check: only borrower or admin can return
  if (!isAdmin && currentUserId && borrowing.borrower_id !== currentUserId) {
    const borrowerName = (borrowing.borrower as any)?.full_name || 'peminjam bersangkutan'
    throw new Error(`Akses ditolak: Hanya ${borrowerName} atau Administrator yang berhak mengembalikan aset ini.`)
  }

  // 3. Mark as Returned
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

  // 4. Restore inventory stock for the exact inventory_id linked in this record
  if (borrowing.inventory_id) {
    await increaseInventoryStock(borrowing.inventory_id)
  }
}

export async function deleteBorrowing(borrowingId: string): Promise<void> {
  const { data: borrowing } = await supabase
    .from('borrowings')
    .select('id, inventory_id, status')
    .eq('id', borrowingId)
    .single()

  const { error } = await supabase
    .from('borrowings')
    .delete()
    .eq('id', borrowingId)

  if (error) {
    console.error('Error deleting borrowing:', error)
    throw error
  }

  // If was currently borrowed, restore stock
  if (borrowing && borrowing.status === 'Borrowed' && borrowing.inventory_id) {
    await increaseInventoryStock(borrowing.inventory_id)
  }
}
