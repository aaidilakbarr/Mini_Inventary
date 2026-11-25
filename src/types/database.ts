import type { UserProfile } from './auth'

export type InventoryStatus = 'Available' | 'Borrowed' | 'Maintenance' | 'Lost' | 'Retired'
export type BorrowingStatus = 'Pending Approval' | 'Approved' | 'Borrowed' | 'Returned' | 'Rejected'
export type BillingCycle = 'Monthly' | 'Quarterly' | 'Semi-Annually' | 'Yearly' | 'Custom'
export type SubscriptionStatus = 'Active' | 'Cancelled' | 'Expired' | 'Past Due'
export type ReminderStatus = 'Upcoming' | 'Due Today' | 'Overdue' | 'Completed' | 'Dismissed'
export type ReminderPriority = 'Tinggi' | 'Sedang' | 'Rendah'

export interface Category {
  id: string
  name: string
  description?: string | null
  type: 'inventory' | 'subscription' | 'general'
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  code: string
  name: string
  category_id?: string | null
  quantity: number
  condition?: string | null
  location?: string | null
  purchase_info?: Record<string, any> | null
  supplier?: string | null
  warranty_info?: string | null
  photo_url?: string | null
  status: InventoryStatus
  notes?: string | null
  created_at: string
  updated_at: string
  // Joined relation
  category?: Category | null
}

export interface CreateInventoryPayload {
  code: string
  name: string
  category_id?: string | null
  quantity: number
  condition?: string | null
  location?: string | null
  supplier?: string | null
  warranty_info?: string | null
  photo_url?: string | null
  status: InventoryStatus
  notes?: string | null
  purchase_info?: Record<string, any> | null
}

export type UpdateInventoryPayload = Partial<CreateInventoryPayload>

export interface BorrowingItem {
  id: string
  inventory_id: string
  borrower_id: string
  request_date: string
  start_date?: string | null
  due_date: string
  return_date?: string | null
  status: BorrowingStatus
  notes?: string | null
  return_condition?: string | null
  return_notes?: string | null
  created_at: string
  updated_at: string
  // Joined relations
  inventory?: InventoryItem | null
  borrower?: UserProfile | null
}

export interface CreateBorrowingPayload {
  inventory_id: string
  borrower_id: string
  due_date: string
  notes?: string | null
  start_date?: string | null
  status?: BorrowingStatus
}

export interface SubscriptionItem {
  id: string
  service_name: string
  provider?: string | null
  category_id?: string | null
  cost: number
  billing_cycle: BillingCycle
  start_date?: string | null
  next_billing_date: string
  payment_method?: string | null
  status: SubscriptionStatus
  notes?: string | null
  created_at: string
  updated_at: string
  // Joined relation
  category?: Category | null
}

export interface CreateSubscriptionPayload {
  service_name: string
  provider?: string | null
  category_id?: string | null
  cost: number
  billing_cycle: BillingCycle
  start_date?: string | null
  next_billing_date: string
  payment_method?: string | null
  status: SubscriptionStatus
  notes?: string | null
}

export type UpdateSubscriptionPayload = Partial<CreateSubscriptionPayload>

export interface ReminderItem {
  id: string
  title: string
  description?: string | null
  source_type: string
  source_id?: string | null
  due_date: string
  priority: ReminderPriority
  status: ReminderStatus
  created_at: string
  updated_at: string
}

export interface CreateReminderPayload {
  title: string
  description?: string | null
  source_type?: string
  source_id?: string | null
  due_date: string
  priority: ReminderPriority
  status?: ReminderStatus
}

export type UpdateReminderPayload = Partial<CreateReminderPayload>

export interface AuditLog {
  id: string
  user_id?: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  details?: Record<string, any> | null
  created_at: string
  user?: UserProfile | null
}

export type PlannerTaskStatus = 'Not Started' | 'Pending' | 'Under Review' | 'Completed'
export type PlannerTaskPriority = 'Low' | 'Medium' | 'Urgent'

export interface PlannerTaskAssignee {
  task_id: string
  profile_id: string
  assigned_at: string
  profile?: UserProfile | null
}

export interface PlannerTaskComment {
  id: string
  task_id: string
  author_id?: string | null
  content: string
  created_at: string
  updated_at: string
  author?: UserProfile | null
}

export interface PlannerTask {
  id: string
  task_code: string
  title: string
  subtitle?: string | null
  description?: string | null
  status: PlannerTaskStatus
  priority: PlannerTaskPriority
  position: number
  start_date?: string | null
  due_date?: string | null
  channel?: string | null
  tags: string[]
  created_by?: string | null
  created_at: string
  updated_at: string
  // Joined & aggregated fields
  creator?: UserProfile | null
  assignees?: PlannerTaskAssignee[]
  comments_count?: number
}

export interface CreatePlannerTaskPayload {
  task_code?: string
  title: string
  subtitle?: string | null
  description?: string | null
  status?: PlannerTaskStatus
  priority?: PlannerTaskPriority
  position?: number
  start_date?: string | null
  due_date?: string | null
  channel?: string | null
  tags?: string[]
  assignee_ids?: string[]
}

export type UpdatePlannerTaskPayload = Partial<CreatePlannerTaskPayload>

export interface PlannerSummaryStats {
  totalTasks: number
  inProgressTasks: number
  urgentTasks: number
  completedTasks: number
  completionRate: number
  byStatus: Record<PlannerTaskStatus, number>
}
