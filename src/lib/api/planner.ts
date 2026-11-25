import { supabase } from '@/lib/supabase'
import { recordAuditLog } from '@/lib/api/auditLogs'
import type {
  CreatePlannerTaskPayload,
  PlannerSummaryStats,
  PlannerTask,
  PlannerTaskAssignee,
  PlannerTaskComment,
  PlannerTaskPriority,
  PlannerTaskStatus,
  UpdatePlannerTaskPayload,
} from '@/types/database'

export interface FetchPlannerTasksFilters {
  status?: PlannerTaskStatus
  priority?: PlannerTaskPriority
  search?: string
  assigneeId?: string
}

interface RawPlannerTaskRow extends Omit<PlannerTask, 'comments_count'> {
  comments?: { count: number }[] | null
}

const PLANNER_TASK_SELECT = `
  *,
  creator:profiles!planner_tasks_created_by_fkey(id, full_name, email, role, avatar_url),
  assignees:planner_task_assignees(
    task_id,
    profile_id,
    assigned_at,
    profile:profiles(id, full_name, email, role, avatar_url)
  ),
  comments:planner_task_comments(count)
`

function normalizePlannerTask(row: RawPlannerTaskRow): PlannerTask {
  const commentsCount = Array.isArray(row.comments) ? (row.comments[0]?.count ?? 0) : 0
  const { comments: _ignored, ...rest } = row
  return {
    ...rest,
    tags: Array.isArray(rest.tags) ? rest.tags : [],
    assignees: Array.isArray(rest.assignees) ? (rest.assignees as PlannerTaskAssignee[]) : [],
    comments_count: commentsCount,
  }
}

export async function fetchPlannerTasks(
  filters?: FetchPlannerTasksFilters
): Promise<PlannerTask[]> {
  let query = supabase
    .from('planner_tasks')
    .select(PLANNER_TASK_SELECT)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.priority) {
    query = query.eq('priority', filters.priority)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching planner tasks:', error)
    throw error
  }

  let tasks = ((data as RawPlannerTaskRow[]) || []).map(normalizePlannerTask)

  if (filters?.assigneeId) {
    tasks = tasks.filter((task) =>
      task.assignees?.some((assignee) => assignee.profile_id === filters.assigneeId)
    )
  }

  if (filters?.search && filters.search.trim() !== '') {
    const q = filters.search.trim().toLowerCase()
    tasks = tasks.filter((task) => {
      const title = task.title.toLowerCase()
      const subtitle = task.subtitle?.toLowerCase() || ''
      const taskCode = task.task_code.toLowerCase()
      const channel = task.channel?.toLowerCase() || ''
      return (
        title.includes(q) ||
        subtitle.includes(q) ||
        taskCode.includes(q) ||
        channel.includes(q)
      )
    })
  }

  return tasks
}

export async function fetchPlannerTaskById(id: string): Promise<PlannerTask | null> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .select(PLANNER_TASK_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching planner task by id:', error)
    throw error
  }

  if (!data) return null
  return normalizePlannerTask(data as RawPlannerTaskRow)
}

export async function createPlannerTask(
  payload: CreatePlannerTaskPayload
): Promise<PlannerTask> {
  const { data: userData } = await supabase.auth.getUser()
  const createdBy = userData?.user?.id || null

  const insertBody: Record<string, unknown> = {
    title: payload.title,
    subtitle: payload.subtitle ?? null,
    description: payload.description ?? null,
    status: payload.status ?? 'Not Started',
    priority: payload.priority ?? 'Medium',
    position: payload.position ?? 0,
    start_date: payload.start_date ?? null,
    due_date: payload.due_date ?? null,
    channel: payload.channel ?? null,
    tags: payload.tags ?? [],
    created_by: createdBy,
  }

  if (payload.task_code && payload.task_code.trim() !== '') {
    insertBody.task_code = payload.task_code.trim()
  }

  const { data, error } = await supabase
    .from('planner_tasks')
    .insert([insertBody])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating planner task:', error)
    throw error
  }

  const taskId = data.id as string

  if (payload.assignee_ids && payload.assignee_ids.length > 0) {
    const assigneeRows = payload.assignee_ids.map((profileId) => ({
      task_id: taskId,
      profile_id: profileId,
    }))
    const { error: assigneeError } = await supabase
      .from('planner_task_assignees')
      .insert(assigneeRows)

    if (assigneeError) {
      console.error('Error assigning profiles to planner task:', assigneeError)
      throw assigneeError
    }
  }

  const createdTask = await fetchPlannerTaskById(taskId)
  if (!createdTask) {
    throw new Error('Tugas planner berhasil dibuat namun gagal dimuat kembali.')
  }

  await recordAuditLog({
    action: 'CREATE_PLANNER_TASK',
    entity_type: 'planner_task',
    entity_id: taskId,
    details: {
      task_code: createdTask.task_code,
      title: createdTask.title,
      status: createdTask.status,
      priority: createdTask.priority,
    },
  })

  return createdTask
}

export async function updatePlannerTask(
  id: string,
  payload: UpdatePlannerTaskPayload
): Promise<PlannerTask> {
  const { assignee_ids, ...taskFields } = payload

  const hasTaskFieldUpdates = Object.keys(taskFields).length > 0
  if (hasTaskFieldUpdates) {
    const { error } = await supabase
      .from('planner_tasks')
      .update({
        ...taskFields,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating planner task:', error)
      throw error
    }
  }

  if (assignee_ids !== undefined) {
    const { error: deleteError } = await supabase
      .from('planner_task_assignees')
      .delete()
      .eq('task_id', id)

    if (deleteError) {
      console.error('Error clearing planner task assignees:', deleteError)
      throw deleteError
    }

    if (assignee_ids.length > 0) {
      const rows = assignee_ids.map((profileId) => ({
        task_id: id,
        profile_id: profileId,
      }))
      const { error: insertError } = await supabase
        .from('planner_task_assignees')
        .insert(rows)

      if (insertError) {
        console.error('Error inserting planner task assignees:', insertError)
        throw insertError
      }
    }
  }

  const updatedTask = await fetchPlannerTaskById(id)
  if (!updatedTask) {
    throw new Error('Tugas planner tidak ditemukan setelah diperbarui.')
  }

  await recordAuditLog({
    action: 'UPDATE_PLANNER_TASK',
    entity_type: 'planner_task',
    entity_id: id,
    details: {
      task_code: updatedTask.task_code,
      title: updatedTask.title,
      updated_fields: Object.keys(payload),
    },
  })

  return updatedTask
}

export async function movePlannerTask(
  id: string,
  newStatus: PlannerTaskStatus,
  newPosition: number
): Promise<void> {
  const { error } = await supabase.rpc('rpc_move_planner_task', {
    p_task_id: id,
    p_new_status: newStatus,
    p_new_position: newPosition,
  })

  if (error) {
    console.error('Error moving planner task:', error)
    throw error
  }

  await recordAuditLog({
    action: 'MOVE_PLANNER_TASK',
    entity_type: 'planner_task',
    entity_id: id,
    details: {
      status: newStatus,
      position: newPosition,
    },
  })
}

export async function deletePlannerTask(id: string): Promise<void> {
  const { error } = await supabase.from('planner_tasks').delete().eq('id', id)

  if (error) {
    console.error('Error deleting planner task:', error)
    throw error
  }

  await recordAuditLog({
    action: 'DELETE_PLANNER_TASK',
    entity_type: 'planner_task',
    entity_id: id,
  })
}

export async function fetchPlannerComments(
  taskId: string
): Promise<PlannerTaskComment[]> {
  const { data, error } = await supabase
    .from('planner_task_comments')
    .select('*, author:profiles(id, full_name, email, role, avatar_url)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching planner comments:', error)
    throw error
  }

  return (data as PlannerTaskComment[]) || []
}

export async function createPlannerComment(
  taskId: string,
  content: string
): Promise<PlannerTaskComment> {
  const { data: userData } = await supabase.auth.getUser()
  const authorId = userData?.user?.id || null

  const { data, error } = await supabase
    .from('planner_task_comments')
    .insert([
      {
        task_id: taskId,
        author_id: authorId,
        content: content.trim(),
      },
    ])
    .select('*, author:profiles(id, full_name, email, role, avatar_url)')
    .single()

  if (error) {
    console.error('Error creating planner comment:', error)
    throw error
  }

  return data as PlannerTaskComment
}

export async function deletePlannerComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('planner_task_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting planner comment:', error)
    throw error
  }
}

export function computePlannerSummary(tasks: PlannerTask[]): PlannerSummaryStats {
  const byStatus: Record<PlannerTaskStatus, number> = {
    'Not Started': 0,
    Pending: 0,
    'Under Review': 0,
    Completed: 0,
  }

  let urgentTasks = 0

  for (const task of tasks) {
    byStatus[task.status] = (byStatus[task.status] ?? 0) + 1
    if (task.priority === 'Urgent' && task.status !== 'Completed') {
      urgentTasks += 1
    }
  }

  const totalTasks = tasks.length
  const completedTasks = byStatus.Completed
  const inProgressTasks = byStatus.Pending + byStatus['Under Review']
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 10000) / 100 : 0

  return {
    totalTasks,
    inProgressTasks,
    urgentTasks,
    completedTasks,
    completionRate,
    byStatus,
  }
}
