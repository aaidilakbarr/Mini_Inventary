import { supabase } from '@/lib/supabase'
import { recordAuditLog } from '@/lib/api/auditLogs'
import type { ReminderItem, CreateReminderPayload, UpdateReminderPayload, ReminderStatus } from '@/types/database'

async function handleInventoryRepairRestoration(
  reminderId: string,
  targetStatus: ReminderStatus
) {
  try {
    const { data: reminder, error: fetchErr } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .single()

    if (fetchErr || !reminder) return

    const prevStatus = reminder.status as ReminderStatus
    if (prevStatus === targetStatus) return

    // Hanya proses pengingat yang bersumber dari perbaikan inventaris
    if (reminder.source_type !== 'inventory' || !reminder.source_id) return

    // 1. Selesai Perbaikan -> Kembalikan 1 unit ke stok inventaris aktif
    if (targetStatus === 'Completed' && prevStatus !== 'Completed') {
      const { data: inv, error: invErr } = await supabase
        .from('inventories')
        .select('id, name, code, quantity, status, condition, notes')
        .eq('id', reminder.source_id)
        .single()

      if (!invErr && inv) {
        const currentQty = typeof inv.quantity === 'number' ? inv.quantity : 0
        const newQty = currentQty + 1
        const newStatus = 'Available'
        const newCondition = 'Bagus'
        const noteEntry = `[Perbaikan Selesai ${new Date().toLocaleDateString('id-ID')}]: 1 unit selesai diservis dan dikembalikan ke stok aktif.`
        const updatedNotes = inv.notes ? `${inv.notes}\n${noteEntry}` : noteEntry

        await supabase
          .from('inventories')
          .update({
            quantity: newQty,
            status: newStatus,
            condition: newCondition,
            notes: updatedNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', inv.id)

        await recordAuditLog({
          action: 'REPAIR_COMPLETED',
          entity_type: 'inventory',
          entity_id: inv.id,
          details: {
            reminder_id: reminderId,
            reminder_title: reminder.title,
            inventory_name: inv.name,
            inventory_code: inv.code,
            previous_quantity: currentQty,
            new_quantity: newQty,
            status: newStatus
          }
        })
      }
    }

    // 2. Undo/Batal Selesai -> Kembalikan stok -1 jika sebelumnya sempat ditambah
    if (prevStatus === 'Completed' && targetStatus !== 'Completed') {
      const { data: inv, error: invErr } = await supabase
        .from('inventories')
        .select('id, quantity, status')
        .eq('id', reminder.source_id)
        .single()

      if (!invErr && inv) {
        const currentQty = typeof inv.quantity === 'number' ? inv.quantity : 1
        const newQty = Math.max(0, currentQty - 1)
        const newStatus = newQty === 0 ? 'Maintenance' : inv.status

        await supabase
          .from('inventories')
          .update({
            quantity: newQty,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', inv.id)
      }
    }
  } catch (err) {
    console.error('Error in handleInventoryRepairRestoration:', err)
  }
}

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
  if (payload.status) {
    await handleInventoryRepairRestoration(id, payload.status)
  }

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
  await handleInventoryRepairRestoration(id, status)

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
