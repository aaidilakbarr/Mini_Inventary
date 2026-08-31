import { supabase } from '@/lib/supabase'
import type { AuditLog } from '@/types/database'

export interface FetchAuditLogsParams {
  action?: string
  entityType?: string
  search?: string
  limit?: number
}

export async function fetchAuditLogs(params?: FetchAuditLogsParams): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*, user:profiles(id, full_name, email, role, avatar_url)')
      .order('created_at', { ascending: false })

    if (params?.limit) {
      query = query.limit(params.limit)
    } else {
      query = query.limit(100)
    }

    if (params?.entityType && params.entityType !== 'all') {
      query = query.eq('entity_type', params.entityType)
    }

    if (params?.action && params.action !== 'all') {
      query = query.eq('action', params.action)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }

    let logs = (data as AuditLog[]) || []

    // Client-side search filtering for actor name/email and detail contents
    if (params?.search && params.search.trim() !== '') {
      const q = params.search.toLowerCase()
      logs = logs.filter((log) => {
        const userName = log.user?.full_name?.toLowerCase() || ''
        const userEmail = log.user?.email?.toLowerCase() || ''
        const action = log.action?.toLowerCase() || ''
        const entityType = log.entity_type?.toLowerCase() || ''
        const entityId = log.entity_id?.toLowerCase() || ''
        const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : ''

        return (
          userName.includes(q) ||
          userEmail.includes(q) ||
          action.includes(q) ||
          entityType.includes(q) ||
          entityId.includes(q) ||
          detailsStr.includes(q)
        )
      })
    }

    return logs
  } catch (err) {
    console.error('Unexpected error fetching audit logs:', err)
    return []
  }
}

export interface RecordAuditLogPayload {
  action: string
  entity_type: string
  entity_id?: string | null
  details?: Record<string, any> | null
}

export async function recordAuditLog(payload: RecordAuditLogPayload): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id || null

    const { error } = await supabase.from('audit_logs').insert([
      {
        user_id: userId,
        action: payload.action,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id || null,
        details: payload.details || {},
      },
    ])

    if (error) {
      console.error('Failed to record audit log:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Unexpected error recording audit log:', err)
    return false
  }
}
