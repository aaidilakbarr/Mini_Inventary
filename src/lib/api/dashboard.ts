import { supabase } from '@/lib/supabase'
import type { InventoryItem, BorrowingItem, SubscriptionItem, ReminderItem } from '@/types/database'

export interface DashboardData {
  inventories: InventoryItem[]
  borrowings: BorrowingItem[]
  subscriptions: SubscriptionItem[]
  reminders: ReminderItem[]
  stats: {
    totalInventories: number
    availableInventories: number
    activeBorrowings: number
    pendingBorrowings: number
    overdueBorrowings: number
    activeSubscriptions: number
    monthlySubscriptionCost: number
    urgentRemindersCount: number
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [
    { data: invData },
    { data: borrowData },
    { data: subData },
    { data: reminderData },
  ] = await Promise.all([
    supabase.from('inventories').select('*, category:categories(*)').order('created_at', { ascending: false }),
    supabase.from('borrowings').select('*, inventory:inventories(*), borrower:profiles(*)').order('created_at', { ascending: false }).limit(10),
    supabase.from('subscriptions').select('*, category:categories(*)').order('next_billing_date', { ascending: true }),
    supabase.from('reminders').select('*').order('due_date', { ascending: true }),
  ])

  const inventories = (invData as InventoryItem[]) || []
  const borrowings = (borrowData as BorrowingItem[]) || []
  const subscriptions = (subData as SubscriptionItem[]) || []
  const reminders = (reminderData as ReminderItem[]) || []

  // Compute stats
  const totalInventories = inventories.reduce((acc, curr) => acc + (curr.quantity || 1), 0)
  const availableInventories = inventories
    .filter(i => i.status === 'Available')
    .reduce((acc, curr) => acc + (curr.quantity || 1), 0)

  const activeBorrowings = borrowings.filter(b => b.status === 'Borrowed').length
  const pendingBorrowings = borrowings.filter(b => b.status === 'Pending Approval').length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdueBorrowings = borrowings.filter(b => {
    if (b.status !== 'Borrowed') return false
    return new Date(b.due_date) < today
  }).length

  const activeSubscriptionsList = subscriptions.filter(s => s.status === 'Active')
  const monthlySubscriptionCost = activeSubscriptionsList.reduce((acc, curr) => {
    const cost = Number(curr.cost) || 0
    if (curr.billing_cycle === 'Monthly') return acc + cost
    if (curr.billing_cycle === 'Quarterly') return acc + (cost / 3)
    if (curr.billing_cycle === 'Semi-Annually') return acc + (cost / 6)
    if (curr.billing_cycle === 'Yearly') return acc + (cost / 12)
    return acc + cost
  }, 0)

  const urgentRemindersCount = reminders.filter(r => r.status !== 'Completed').length

  return {
    inventories,
    borrowings,
    subscriptions,
    reminders,
    stats: {
      totalInventories,
      availableInventories,
      activeBorrowings,
      pendingBorrowings,
      overdueBorrowings,
      activeSubscriptions: activeSubscriptionsList.length,
      monthlySubscriptionCost,
      urgentRemindersCount,
    }
  }
}
