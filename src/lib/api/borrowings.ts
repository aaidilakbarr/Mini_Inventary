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

const DAMAGED_CONDITIONS = new Set([
  'Rusak Ringan',
  'Rusak Berat',
  'Perlu Perbaikan',
  'Rusak',
])

function isDamagedCondition(condition: string): boolean {
  return DAMAGED_CONDITIONS.has(condition)
}

function isMissingRpcError(err: any): boolean {
  const code = String(err?.code || '')
  const msg = String(err?.message || '').toLowerCase()
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    msg.includes('could not find the function') ||
    msg.includes('function') && msg.includes('does not exist') ||
    msg.includes('not found') && msg.includes('schema')
  )
}

async function createRepairReminder(params: {
  inventoryId: string
  inventoryName: string
  inventoryCode?: string | null
  condition: string
  returnNotes?: string
  borrowerName?: string
}) {
  try {
    const repairDueDate = new Date()
    repairDueDate.setDate(repairDueDate.getDate() + 3)
    const trimmedNotes = params.returnNotes?.trim()

    await createReminder({
      title: `Perbaikan: ${params.inventoryName} (1 unit ${params.condition})`,
      description: `Aset ${params.inventoryName} (${params.inventoryCode || '-'}) dikembalikan dalam kondisi ${params.condition}.${trimmedNotes ? ` Catatan: ${trimmedNotes}` : ''}${params.borrowerName ? ` | Peminjam: ${params.borrowerName}` : ''}. Setelah unit selesai diperbaiki, tandai pengingat ini sebagai 'Selesai' untuk mengembalikan 1 unit ke stok inventaris aktif.`,
      source_type: 'inventory',
      source_id: params.inventoryId,
      due_date: repairDueDate.toISOString(),
      priority: params.condition === 'Rusak Berat' ? 'Tinggi' : 'Sedang',
      status: 'Upcoming',
    })
  } catch (reminderErr) {
    console.error('Error creating repair reminder:', reminderErr)
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
      const isDamaged = isDamagedCondition(condition)

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

        await createRepairReminder({
          inventoryId,
          inventoryName: inv.name,
          inventoryCode: inv.code,
          condition,
          returnNotes,
          borrowerName,
        })
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
    if (!isMissingRpcError(rpcError)) {
      throw new Error(rpcError.message || 'Gagal menyetujui peminjaman.')
    }

    console.warn('RPC rpc_approve_borrowing not registered yet, using fallback:', rpcError.message)
  } catch (err: any) {
    if (!isMissingRpcError(err)) {
      throw err
    }
  }

  // Fallback: 2-step manual client-side update with strict row verification
  const { data: updatedRows, error: borrowError } = await supabase
    .from('borrowings')
    .update({ 
      status: 'Borrowed', 
      start_date: new Date().toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('id', borrowingId)
    .eq('status', 'Pending Approval')
    .select('id')

  if (borrowError) {
    console.error('Error approving borrowing:', borrowError)
    throw borrowError
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error('Gagal menyetujui peminjaman. Permohonan mungkin sudah diproses atau akses ditolak.')
  }

  // Decrease inventory stock only after borrowing update is confirmed
  await decreaseInventoryStock(inventoryId)
}

export async function rejectBorrowing(borrowingId: string): Promise<void> {
  const { data: updatedRows, error } = await supabase
    .from('borrowings')
    .update({ 
      status: 'Rejected',
      updated_at: new Date().toISOString() 
    })
    .eq('id', borrowingId)
    .eq('status', 'Pending Approval')
    .select('id')

  if (error) {
    console.error('Error rejecting borrowing:', error)
    throw error
  }

  if (!updatedRows || updatedRows.length === 0) {
    throw new Error('Gagal menolak permohonan. Status mungkin sudah berubah atau akses ditolak.')
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

  // 1. Fetch current borrowing & inventory record to validate status, ownership, and baseline stock
  const { data: borrowing, error: fetchError } = await supabase
    .from('borrowings')
    .select('id, inventory_id, borrower_id, status, notes, borrower:profiles(full_name), inventory:inventories(id, code, name, quantity, status, condition, notes)')
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

  const trimmedNotes = returnNotes.trim()
  const isDamaged = isDamagedCondition(condition)
  const borrowerName = (borrowing.borrower as any)?.full_name || undefined
  const invSnapshot = Array.isArray(borrowing.inventory) ? borrowing.inventory[0] : borrowing.inventory
  const prevQty = typeof invSnapshot?.quantity === 'number' ? invSnapshot.quantity : 0

  // 3. Attempt Atomic SECURITY DEFINER RPC first (bypasses restrictive borrowings UPDATE RLS for staff borrowers)
  let rpcSucceeded = false
  try {
    const { error: rpcError } = await supabase.rpc('rpc_return_borrowing', {
      target_borrowing_id: borrowingId,
      p_return_condition: condition,
      p_return_notes: trimmedNotes || null,
    })

    if (!rpcError) {
      rpcSucceeded = true
    } else if (!isMissingRpcError(rpcError)) {
      throw new Error(rpcError.message || 'Gagal memproses pengembalian aset.')
    } else {
      console.warn('RPC rpc_return_borrowing not registered yet, using fallback:', rpcError.message)
    }
  } catch (err: any) {
    if (!isMissingRpcError(err)) {
      throw err
    }
  }

  if (rpcSucceeded) {
    // RPC atomically set borrowings.status = 'Returned' and updated inventory stock.
    // Reconcile damaged-item status/reminder & optional notes without ever double-incrementing stock.
    if (borrowing.inventory_id && invSnapshot) {
      if (isDamaged) {
        const targetQty = prevQty > 0 ? prevQty : 1
        const targetStatus: InventoryStatus = prevQty > 0 ? 'Available' : 'Maintenance'
        const targetCondition = prevQty > 0 ? (invSnapshot.condition || 'Bagus') : condition

        try {
          const { data: currentInv } = await supabase
            .from('inventories')
            .select('quantity, status, condition, notes')
            .eq('id', borrowing.inventory_id)
            .single()

          if (currentInv) {
            const needsReconcile =
              currentInv.quantity !== targetQty ||
              currentInv.status !== targetStatus ||
              currentInv.condition !== targetCondition

            const noteEntry = prevQty > 0
              ? `[Pengembalian ${new Date().toLocaleDateString('id-ID')}]: 1 unit dikembalikan ${condition}${trimmedNotes ? ` (${trimmedNotes})` : ''} - dialihkan ke tiket Pengingat Perbaikan.`
              : `[Pengembalian ${new Date().toLocaleDateString('id-ID')}]: Dikembalikan ${condition}${trimmedNotes ? ` (${trimmedNotes})` : ''} - dialihkan ke tiket Pengingat Perbaikan (status Maintenance).`

            const existingNotes = currentInv.notes || ''
            const hasNoteAlready = existingNotes.includes('dialihkan ke tiket Pengingat Perbaikan') && existingNotes.includes(condition)
            const updatedInvNotes = hasNoteAlready
              ? existingNotes
              : (existingNotes ? `${existingNotes}\n${noteEntry}` : noteEntry)

            if (needsReconcile || !hasNoteAlready) {
              await supabase
                .from('inventories')
                .update({
                  quantity: targetQty,
                  status: targetStatus,
                  condition: targetCondition,
                  notes: updatedInvNotes,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', borrowing.inventory_id)
            }
          }
        } catch (reconcileErr) {
          console.error('Error reconciling damaged inventory after RPC return:', reconcileErr)
        }

        await createRepairReminder({
          inventoryId: borrowing.inventory_id,
          inventoryName: invSnapshot.name,
          inventoryCode: invSnapshot.code,
          condition,
          returnNotes: trimmedNotes,
          borrowerName,
        })
      } else if (trimmedNotes) {
        try {
          const { data: currentInv } = await supabase
            .from('inventories')
            .select('notes')
            .eq('id', borrowing.inventory_id)
            .single()

          const existingNotes = currentInv?.notes || ''
          const noteEntry = `[Pengembalian ${new Date().toLocaleDateString('id-ID')}]: Kondisi Bagus - ${trimmedNotes}`
          if (!existingNotes.includes(trimmedNotes)) {
            await supabase
              .from('inventories')
              .update({
                notes: existingNotes ? `${existingNotes}\n${noteEntry}` : noteEntry,
                updated_at: new Date().toISOString(),
              })
              .eq('id', borrowing.inventory_id)
          }
        } catch (noteErr) {
          console.error('Error appending return note after RPC return:', noteErr)
        }
      }
    }
  } else {
    // Fallback ONLY when rpc_return_borrowing is unavailable in the database
    const returnTag = `[Pengembalian - Kondisi: ${condition}]${trimmedNotes ? ` Catatan: ${trimmedNotes}` : ''}`
    const combinedNotes = borrowing.notes
      ? `${borrowing.notes}\n${returnTag}`
      : returnTag

    const primaryUpdate: Record<string, any> = { 
      status: 'Returned', 
      return_date: new Date().toISOString(),
      return_condition: condition,
      return_notes: trimmedNotes || null,
      notes: combinedNotes,
      updated_at: new Date().toISOString() 
    }

    let { data: updatedRows, error: borrowError } = await supabase
      .from('borrowings')
      .update(primaryUpdate)
      .eq('id', borrowingId)
      .eq('status', 'Borrowed')
      .select('id, status')

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
        .eq('status', 'Borrowed')
        .select('id, status')
      updatedRows = fallbackRes.data
      borrowError = fallbackRes.error
    }

    if (borrowError) {
      console.error('Error returning borrowing:', borrowError)
      throw borrowError
    }

    // Critical guard: NEVER modify inventory stock if the borrowing row was not actually updated
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Gagal mengubah status pengembalian. Peminjaman tidak dapat diperbarui karena izin akses (RLS) atau sudah dikembalikan sebelumnya.')
    }

    // Update inventory stock and status only after borrowing update is verified
    if (borrowing.inventory_id) {
      await handleReturnInventory(borrowing.inventory_id, condition, trimmedNotes, borrowerName)
    }
  }

  // Record Audit Log for traceability
  await recordAuditLog({
    action: 'RETURN_ASSET',
    entity_type: 'borrowing',
    entity_id: borrowingId,
    details: {
      inventory_id: borrowing.inventory_id,
      borrower_id: borrowing.borrower_id,
      condition,
      return_notes: trimmedNotes || null,
      resulting_status: isDamaged && prevQty === 0 ? 'Maintenance' : 'Available',
    }
  })
}

export async function deleteBorrowing(borrowingId: string): Promise<void> {
  const { data: borrowing } = await supabase
    .from('borrowings')
    .select('id, inventory_id, status')
    .eq('id', borrowingId)
    .single()

  const { data: deletedRows, error } = await supabase
    .from('borrowings')
    .delete()
    .eq('id', borrowingId)
    .select('id')

  if (error) {
    console.error('Error deleting borrowing:', error)
    throw error
  }

  if (!deletedRows || deletedRows.length === 0) {
    throw new Error('Gagal menghapus catatan peminjaman. Periksa izin akses Anda.')
  }

  // If was currently borrowed, restore stock only after delete is confirmed
  if (borrowing && borrowing.status === 'Borrowed' && borrowing.inventory_id) {
    await increaseInventoryStock(borrowing.inventory_id)
  }
}
