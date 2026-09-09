import { supabase } from '@/lib/supabase'
import { recordAuditLog } from '@/lib/api/auditLogs'
import { createReminder } from '@/lib/api/reminders'
import type { BorrowingItem, CreateBorrowingPayload, InventoryStatus } from '@/types/database'

export interface ReturnBorrowingOptions {
  condition?: string
  notes?: string
  currentUserId?: string
  isAdmin?: boolean
}

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

async function handleReturnInventory(
  inventoryId: string,
  condition: string = 'Bagus',
  returnNotes?: string,
  borrowerName?: string
) {
  try {
    const { data: inv, error: fetchErr } = await supabase
      .from('inventories')
      .select('id, code, name, quantity, status, condition, notes')
      .eq('id', inventoryId)
      .single()

    if (!fetchErr && inv) {
      const currentQty = typeof inv.quantity === 'number' ? inv.quantity : 0
      const isDamaged =
        condition === 'Rusak Ringan' ||
        condition === 'Rusak Berat' ||
        condition === 'Perlu Perbaikan' ||
        condition === 'Rusak'

      let newQty = currentQty
      let newStatus: InventoryStatus = 'Available'
      let newCondition = inv.condition || 'Bagus'
      let updatedInvNotes = inv.notes || ''

      if (isDamaged) {
        // Skenario 1: Masih ada sisa stok bagus di gudang (misal kuantitas sisa 4 dari 5)
        if (currentQty > 0) {
          // JANGAN ubah status sisa barang bagus menjadi Maintenance!
          // Kuantitas tetap sama (1 unit rusak tidak digabung ke stok bagus sebelum diperbaiki)
          newQty = currentQty
          newStatus = 'Available'
          newCondition = inv.condition || 'Bagus'

          const noteEntry = `[Pengembalian ${new Date().toLocaleDateString('id-ID')}]: 1 unit dikembalikan ${condition}${returnNotes?.trim() ? ` (${returnNotes.trim()})` : ''} - dialihkan ke tiket Pengingat Perbaikan.`
          updatedInvNotes = updatedInvNotes ? `${updatedInvNotes}\n${noteEntry}` : noteEntry
        } else {
          // Skenario 2: Tidak ada sisa stok bagus (seluruh unit dipinjam / barang tunggal)
          newQty = 1
          newStatus = 'Maintenance'
          newCondition = condition

          const noteEntry = `[Pengembalian ${new Date().toLocaleDateString('id-ID')}]: Dikembalikan ${condition}${returnNotes?.trim() ? ` (${returnNotes.trim()})` : ''} - dialihkan ke tiket Pengingat Perbaikan (status Maintenance).`
          updatedInvNotes = updatedInvNotes ? `${updatedInvNotes}\n${noteEntry}` : noteEntry
        }

        // Buat tiket pengingat perbaikan otomatis di modul Reminders
        try {
          const repairDueDate = new Date()
          repairDueDate.setDate(repairDueDate.getDate() + 3)

          await createReminder({
            title: `Perbaikan: ${inv.name} (1 unit ${condition})`,
            description: `Aset ${inv.name} (${inv.code || '-'}) dikembalikan dalam kondisi ${condition}.${returnNotes?.trim() ? ` Catatan: ${returnNotes.trim()}` : ''}${borrowerName ? ` | Peminjam: ${borrowerName}` : ''}. Setelah unit selesai diperbaiki, tandai pengingat ini sebagai 'Selesai' untuk mengembalikan 1 unit ke stok inventaris aktif.`,
            source_type: 'inventory',
            source_id: inventoryId,
            due_date: repairDueDate.toISOString(),
            priority: condition === 'Rusak Berat' ? 'Tinggi' : 'Sedang',
            status: 'Upcoming'
          })
        } catch (reminderErr) {
          console.error('Error creating repair reminder:', reminderErr)
        }
      } else {
        // Kondisi Bagus: Tambahkan 1 unit kembali ke stok tersedia
        newQty = currentQty + 1
        newStatus = 'Available'
        newCondition = 'Bagus'

        if (returnNotes && returnNotes.trim()) {
          const noteEntry = `[Pengembalian ${new Date().toLocaleDateString('id-ID')}]: Kondisi Bagus - ${returnNotes.trim()}`
          updatedInvNotes = updatedInvNotes ? `${updatedInvNotes}\n${noteEntry}` : noteEntry
        }
      }

      await supabase
        .from('inventories')
        .update({
          quantity: newQty,
          status: newStatus,
          condition: newCondition,
          notes: updatedInvNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inventoryId)
    }
  } catch (err) {
    console.error('Error handling return inventory stock:', err)
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
  // 1. Attempt Atomic RPC execution first (ensures race condition safety and stock lock)
  try {
    const { error: rpcError } = await supabase.rpc('rpc_approve_borrowing', {
      target_borrowing_id: borrowingId,
    })

    if (!rpcError) {
      return
    }

    // If RPC failed due to business validation (e.g. stock exhausted), throw error immediately
    if (rpcError.message && !rpcError.message.includes('function') && !rpcError.message.includes('not found')) {
      throw new Error(rpcError.message)
    }

    console.warn('RPC rpc_approve_borrowing not registered yet, using fallback:', rpcError.message)
  } catch (err: any) {
    if (err?.message && !err.message.includes('function') && !err.message.includes('not found') && !err.message.includes('schema')) {
      throw err
    }
  }

  // Fallback: 2-step manual client-side update
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
  options?: ReturnBorrowingOptions | string, 
  legacyIsAdmin: boolean = false
): Promise<void> {
  // Normalize options for backwards compatibility
  let condition = 'Bagus'
  let returnNotes = ''
  let currentUserId: string | undefined = undefined
  let isAdmin = false

  if (typeof options === 'string') {
    currentUserId = options
    isAdmin = legacyIsAdmin
  } else if (options && typeof options === 'object') {
    condition = options.condition || 'Bagus'
    returnNotes = options.notes || ''
    currentUserId = options.currentUserId
    isAdmin = options.isAdmin ?? false
  }

  // 1. Fetch current borrowing record to ensure exact item and borrower match
  const { data: borrowing, error: fetchError } = await supabase
    .from('borrowings')
    .select('id, inventory_id, borrower_id, status, notes, borrower:profiles(full_name)')
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

  // 3. Prepare notes with return details
  const returnTag = `[Pengembalian - Kondisi: ${condition}]${returnNotes.trim() ? ` Catatan: ${returnNotes.trim()}` : ''}`
  const combinedNotes = borrowing.notes
    ? `${borrowing.notes}\n${returnTag}`
    : returnTag

  // 4. Mark as Returned and save return condition & notes
  const primaryUpdate: Record<string, any> = { 
    status: 'Returned', 
    return_date: new Date().toISOString(),
    return_condition: condition,
    return_notes: returnNotes.trim() || null,
    notes: combinedNotes,
    updated_at: new Date().toISOString() 
  }

  let { error: borrowError } = await supabase
    .from('borrowings')
    .update(primaryUpdate)
    .eq('id', borrowingId)

  // Fallback if return_condition / return_notes columns do not exist in DB schema yet
  if (borrowError && (borrowError.message?.includes('return_condition') || borrowError.code === 'PGRST204')) {
    const fallbackUpdate = {
      status: 'Returned',
      return_date: new Date().toISOString(),
      notes: combinedNotes,
      updated_at: new Date().toISOString()
    }
    const fallbackRes = await supabase
      .from('borrowings')
      .update(fallbackUpdate)
      .eq('id', borrowingId)
    borrowError = fallbackRes.error
  }

  if (borrowError) {
    console.error('Error returning borrowing:', borrowError)
    throw borrowError
  }

  // 5. Update inventory stock and status based on physical condition
  if (borrowing.inventory_id) {
    const borrowerName = (borrowing.borrower as any)?.full_name || undefined
    await handleReturnInventory(borrowing.inventory_id, condition, returnNotes, borrowerName)
  }

  // 6. Record Audit Log for traceability
  await recordAuditLog({
    action: 'RETURN_ASSET',
    entity_type: 'borrowing',
    entity_id: borrowingId,
    details: {
      inventory_id: borrowing.inventory_id,
      borrower_id: borrowing.borrower_id,
      condition,
      return_notes: returnNotes.trim() || null,
      resulting_status: (condition === 'Rusak Ringan' || condition === 'Rusak Berat') ? 'Maintenance' : 'Available',
    }
  })
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
