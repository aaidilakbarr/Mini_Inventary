import { supabase } from '@/lib/supabase'
import type { InventoryItem, BorrowingItem, SubscriptionItem, ReminderItem, Category, AuditLog } from '@/types/database'
import { fetchAuditLogs } from '@/lib/api/auditLogs'

export interface AgendaItem {
  id: string
  type: 'borrowing' | 'subscription' | 'reminder'
  title: string
  subtitle: string
  dueDate: string
  priority: 'Tinggi' | 'Sedang' | 'Rendah'
  isOverdue: boolean
  link: string
}

export interface ActionableBreakdown {
  overdueBorrowings: number
  pendingBorrowings: number
  damagedInventories: number
  maintenanceInventories: number
  lowStockInventories: number
  upcomingRenewals: number
  urgentReminders: number
}

export interface DashboardStats {
  totalInventories: number
  availableInventories: number
  borrowedInventories: number
  damagedInventories: number
  maintenanceInventories: number
  lowStockInventories: number
  activeBorrowings: number
  pendingBorrowings: number
  overdueBorrowings: number
  activeSubscriptions: number
  monthlySubscriptionCost: number
  urgentRemindersCount: number
  upcomingRenewalsCount: number
  actionableCount: number
  actionableBreakdown: ActionableBreakdown
  actionableSummary: string
}

export interface DashboardData {
  inventories: InventoryItem[]
  borrowings: BorrowingItem[]
  subscriptions: SubscriptionItem[]
  reminders: ReminderItem[]
  categories: Category[]
  recentActivity: AuditLog[]
  upcomingAgenda: AgendaItem[]
  stats: DashboardStats
  lastUpdated: string
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [
    { data: invData },
    { data: borrowData },
    { data: subData },
    { data: reminderData },
    { data: catData },
    auditLogsData,
  ] = await Promise.all([
    supabase.from('inventories').select('*, category:categories(*)').order('created_at', { ascending: false }),
    supabase.from('borrowings').select('*, inventory:inventories(*), borrower:profiles(*)').order('created_at', { ascending: false }).limit(20),
    supabase.from('subscriptions').select('*, category:categories(*)').order('next_billing_date', { ascending: true }),
    supabase.from('reminders').select('*').order('due_date', { ascending: true }),
    supabase.from('categories').select('*').order('name', { ascending: true }),
    fetchAuditLogs({ limit: 10 }),
  ])

  const inventories = (invData as InventoryItem[]) || []
  const borrowings = (borrowData as BorrowingItem[]) || []
  const subscriptions = (subData as SubscriptionItem[]) || []
  const reminders = (reminderData as ReminderItem[]) || []
  const categories = (catData as Category[]) || []
  const recentActivity = auditLogsData || []

  // Date markers
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Compute inventory breakdown
  const totalInventories = inventories.reduce((acc, curr) => acc + (curr.quantity || 1), 0)
  
  const availableInventories = inventories
    .filter(i => i.status === 'Available')
    .reduce((acc, curr) => acc + (curr.quantity || 1), 0)

  const borrowedInventories = inventories
    .filter(i => i.status === 'Borrowed')
    .reduce((acc, curr) => acc + (curr.quantity || 1), 0)

  const maintenanceInventories = inventories
    .filter(i => i.status === 'Maintenance')
    .reduce((acc, curr) => acc + (curr.quantity || 1), 0)

  const damagedInventories = inventories
    .filter(i => {
      const cond = (i.condition || '').toLowerCase()
      return i.status === 'Lost' || i.status === 'Retired' || cond.includes('rusak')
    })
    .reduce((acc, curr) => acc + (curr.quantity || 1), 0)

  const lowStockInventories = inventories.filter(i => (i.quantity || 0) <= 2 && i.status === 'Available').length

  // Borrowings
  const activeBorrowings = borrowings.filter(b => b.status === 'Borrowed').length
  const pendingBorrowings = borrowings.filter(b => b.status === 'Pending Approval').length
  const overdueBorrowings = borrowings.filter(b => {
    if (b.status !== 'Borrowed') return false
    return new Date(b.due_date) < today
  }).length

  // Subscriptions
  const activeSubscriptionsList = subscriptions.filter(s => s.status === 'Active')
  const monthlySubscriptionCost = activeSubscriptionsList.reduce((acc, curr) => {
    const cost = Number(curr.cost) || 0
    if (curr.billing_cycle === 'Monthly') return acc + cost
    if (curr.billing_cycle === 'Quarterly') return acc + (cost / 3)
    if (curr.billing_cycle === 'Semi-Annually') return acc + (cost / 6)
    if (curr.billing_cycle === 'Yearly') return acc + (cost / 12)
    return acc + cost
  }, 0)

  const upcomingRenewals = activeSubscriptionsList.filter(s => {
    if (!s.next_billing_date) return false
    const billDate = new Date(s.next_billing_date)
    return billDate >= today && billDate <= in7Days
  }).length

  // Reminders
  const urgentRemindersCount = reminders.filter(r => r.status !== 'Completed').length

  // Actionable Calculation (explicit and testable)
  const actionableBreakdown: ActionableBreakdown = {
    overdueBorrowings,
    pendingBorrowings,
    damagedInventories,
    maintenanceInventories,
    lowStockInventories,
    upcomingRenewals,
    urgentReminders: urgentRemindersCount,
  }

  const actionableCount =
    overdueBorrowings +
    pendingBorrowings +
    damagedInventories +
    maintenanceInventories +
    lowStockInventories +
    upcomingRenewals

  // Construct short readable summary for operational strip
  const reasonParts: string[] = []
  if (overdueBorrowings > 0) reasonParts.push(`${overdueBorrowings} terlambat`)
  if (pendingBorrowings > 0) reasonParts.push(`${pendingBorrowings} menunggu persetujuan`)
  if (damagedInventories > 0) reasonParts.push(`${damagedInventories} aset rusak`)
  if (maintenanceInventories > 0) reasonParts.push(`${maintenanceInventories} pemeliharaan`)
  if (lowStockInventories > 0) reasonParts.push(`${lowStockInventories} stok menipis`)
  if (upcomingRenewals > 0) reasonParts.push(`${upcomingRenewals} tagihan mendekat`)

  const actionableSummary = reasonParts.length > 0
    ? reasonParts.slice(0, 2).join(', ')
    : 'Semua sistem operasional dalam kondisi optimal'

  // Build Unified Upcoming Agenda list
  const agendaItems: AgendaItem[] = []

  // 1. Borrowings due soon or overdue
  borrowings
    .filter(b => b.status === 'Borrowed' && b.due_date)
    .forEach(b => {
      const dueDate = new Date(b.due_date)
      const isOverdue = dueDate < today
      agendaItems.push({
        id: `borrow-${b.id}`,
        type: 'borrowing',
        title: `Jatuh Tempo: ${b.inventory?.name || 'Aset'}`,
        subtitle: `Dipinjam oleh ${b.borrower?.full_name || 'Pengguna'}`,
        dueDate: b.due_date,
        priority: isOverdue ? 'Tinggi' : 'Sedang',
        isOverdue,
        link: '/borrowing',
      })
    })

  // 2. Subscriptions renewal in next 30 days
  subscriptions
    .filter(s => s.status === 'Active' && s.next_billing_date)
    .forEach(s => {
      const billDate = new Date(s.next_billing_date)
      const diffDays = Math.ceil((billDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 30) {
        agendaItems.push({
          id: `sub-${s.id}`,
          type: 'subscription',
          title: `Perpanjangan: ${s.service_name}`,
          subtitle: `Siklus ${s.billing_cycle || 'Langganan'}`,
          dueDate: s.next_billing_date,
          priority: diffDays <= 7 ? 'Tinggi' : 'Sedang',
          isOverdue: diffDays < 0,
          link: '/subscriptions',
        })
      }
    })

  // 3. Reminders not completed
  reminders
    .filter(r => r.status !== 'Completed' && r.due_date)
    .forEach(r => {
      const dueDate = new Date(r.due_date)
      const isOverdue = dueDate < today
      agendaItems.push({
        id: `rem-${r.id}`,
        type: 'reminder',
        title: r.title,
        subtitle: r.description || 'Pengingat operasional',
        dueDate: r.due_date,
        priority: (r.priority as 'Tinggi' | 'Sedang' | 'Rendah') || (isOverdue ? 'Tinggi' : 'Sedang'),
        isOverdue,
        link: '/reminders',
      })
    })

  // Sort agenda chronologically
  agendaItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const lastUpdated = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return {
    inventories,
    borrowings,
    subscriptions,
    reminders,
    categories,
    recentActivity,
    upcomingAgenda: agendaItems.slice(0, 10),
    stats: {
      totalInventories,
      availableInventories,
      borrowedInventories,
      damagedInventories,
      maintenanceInventories,
      lowStockInventories,
      activeBorrowings,
      pendingBorrowings,
      overdueBorrowings,
      activeSubscriptions: activeSubscriptionsList.length,
      monthlySubscriptionCost,
      urgentRemindersCount,
      upcomingRenewalsCount: upcomingRenewals,
      actionableCount,
      actionableBreakdown,
      actionableSummary,
    },
    lastUpdated,
  }
}
