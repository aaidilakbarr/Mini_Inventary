import { supabase } from '@/lib/supabase'
import { recordAuditLog } from '@/lib/api/auditLogs'

export interface OrganizationSettings {
  name: string
  address: string
  email: string
  logo: string
}

export interface BorrowingRulesSettings {
  default_loan_days: number
  max_items_per_user: number
  grace_period_days: number
  require_approval: boolean
}

export interface ReminderThresholdsSettings {
  warranty_lead_days: number
  borrowing_lead_days: number
  subscription_lead_days: number
}

export interface NotificationSettings {
  in_app_active: boolean
  smtp_host: string
  smtp_sender: string
  telegram_token: string
  telegram_chat_id: string
  whatsapp_endpoint: string
}

export interface AllSystemSettings {
  organization: OrganizationSettings
  borrowing_rules: BorrowingRulesSettings
  reminder_thresholds: ReminderThresholdsSettings
  notifications: NotificationSettings
}

export const DEFAULT_SETTINGS: AllSystemSettings = {
  organization: {
    name: 'PT. Sinergi Inovasi Digital',
    address: 'Gedung Cyber 2 Lantai 15, Jl. HR Rasuna Said, Jakarta',
    email: 'admin@sinergidigital.co.id',
    logo: '',
  },
  borrowing_rules: {
    default_loan_days: 7,
    max_items_per_user: 3,
    grace_period_days: 1,
    require_approval: true,
  },
  reminder_thresholds: {
    warranty_lead_days: 30,
    borrowing_lead_days: 3,
    subscription_lead_days: 7,
  },
  notifications: {
    in_app_active: true,
    smtp_host: 'smtp.resend.com',
    smtp_sender: 'system@invhub.internal',
    telegram_token: '',
    telegram_chat_id: '',
    whatsapp_endpoint: '',
  },
}

/**
 * Fetch all system settings from Supabase with localStorage and fallback defaults
 */
export async function fetchSystemSettings(): Promise<AllSystemSettings> {
  const result: AllSystemSettings = {
    organization: {
      name: localStorage.getItem('setting_org_name') || DEFAULT_SETTINGS.organization.name,
      address: localStorage.getItem('setting_org_address') || DEFAULT_SETTINGS.organization.address,
      email: localStorage.getItem('setting_org_email') || DEFAULT_SETTINGS.organization.email,
      logo: localStorage.getItem('setting_org_logo') || DEFAULT_SETTINGS.organization.logo,
    },
    borrowing_rules: {
      default_loan_days: Number(localStorage.getItem('setting_loan_days')) || DEFAULT_SETTINGS.borrowing_rules.default_loan_days,
      max_items_per_user: Number(localStorage.getItem('setting_max_items')) || DEFAULT_SETTINGS.borrowing_rules.max_items_per_user,
      grace_period_days: Number(localStorage.getItem('setting_grace_period')) || DEFAULT_SETTINGS.borrowing_rules.grace_period_days,
      require_approval: localStorage.getItem('setting_require_approval') !== 'false',
    },
    reminder_thresholds: {
      warranty_lead_days: Number(localStorage.getItem('setting_warranty_lead')) || DEFAULT_SETTINGS.reminder_thresholds.warranty_lead_days,
      borrowing_lead_days: Number(localStorage.getItem('setting_borrowing_lead')) || DEFAULT_SETTINGS.reminder_thresholds.borrowing_lead_days,
      subscription_lead_days: Number(localStorage.getItem('setting_subscription_lead')) || DEFAULT_SETTINGS.reminder_thresholds.subscription_lead_days,
    },
    notifications: {
      in_app_active: localStorage.getItem('setting_inapp_active') !== 'false',
      smtp_host: localStorage.getItem('setting_smtp_host') || DEFAULT_SETTINGS.notifications.smtp_host,
      smtp_sender: localStorage.getItem('setting_smtp_sender') || DEFAULT_SETTINGS.notifications.smtp_sender,
      telegram_token: localStorage.getItem('setting_tg_token') || DEFAULT_SETTINGS.notifications.telegram_token,
      telegram_chat_id: localStorage.getItem('setting_tg_chat_id') || DEFAULT_SETTINGS.notifications.telegram_chat_id,
      whatsapp_endpoint: localStorage.getItem('setting_wa_endpoint') || DEFAULT_SETTINGS.notifications.whatsapp_endpoint,
    },
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')

    if (!error && data && data.length > 0) {
      data.forEach((row: { key: string; value: any }) => {
        if (row.key === 'organization' && row.value) {
          result.organization = { ...result.organization, ...row.value }
          // Sync to localStorage
          localStorage.setItem('setting_org_name', result.organization.name)
          localStorage.setItem('setting_org_address', result.organization.address)
          localStorage.setItem('setting_org_email', result.organization.email)
          localStorage.setItem('setting_org_logo', result.organization.logo)
        } else if (row.key === 'borrowing_rules' && row.value) {
          result.borrowing_rules = { ...result.borrowing_rules, ...row.value }
          // Sync to localStorage
          localStorage.setItem('setting_loan_days', String(result.borrowing_rules.default_loan_days))
          localStorage.setItem('setting_max_items', String(result.borrowing_rules.max_items_per_user))
          localStorage.setItem('setting_grace_period', String(result.borrowing_rules.grace_period_days))
          localStorage.setItem('setting_require_approval', String(result.borrowing_rules.require_approval))
        } else if (row.key === 'reminder_thresholds' && row.value) {
          result.reminder_thresholds = { ...result.reminder_thresholds, ...row.value }
          // Sync to localStorage
          localStorage.setItem('setting_warranty_lead', String(result.reminder_thresholds.warranty_lead_days))
          localStorage.setItem('setting_borrowing_lead', String(result.reminder_thresholds.borrowing_lead_days))
          localStorage.setItem('setting_subscription_lead', String(result.reminder_thresholds.subscription_lead_days))
        } else if (row.key === 'notifications' && row.value) {
          result.notifications = { ...result.notifications, ...row.value }
          // Sync to localStorage
          localStorage.setItem('setting_inapp_active', String(result.notifications.in_app_active))
          localStorage.setItem('setting_smtp_host', result.notifications.smtp_host)
          localStorage.setItem('setting_smtp_sender', result.notifications.smtp_sender)
          localStorage.setItem('setting_tg_token', result.notifications.telegram_token)
          localStorage.setItem('setting_tg_chat_id', result.notifications.telegram_chat_id)
          localStorage.setItem('setting_wa_endpoint', result.notifications.whatsapp_endpoint)
        }
      })
    }
  } catch (err) {
    console.warn('Unable to reach system_settings in Supabase, using cached settings:', err)
  }

  return result
}

/**
 * Save specific system settings to Supabase and cache to localStorage
 */
export async function saveSystemSetting<K extends keyof AllSystemSettings>(
  key: K,
  value: AllSystemSettings[K]
): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id

  // 1. Save to Supabase
  try {
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: userId || null,
      }, { onConflict: 'key' })

    if (error) {
      console.warn(`Failed to update system_settings for key "${key}" in Supabase:`, error.message)
    }
  } catch (err) {
    console.warn(`Supabase upsert error for "${key}":`, err)
  }

  // 2. Sync to localStorage for instant local access
  if (key === 'organization') {
    const org = value as OrganizationSettings
    localStorage.setItem('setting_org_name', org.name)
    localStorage.setItem('setting_org_address', org.address)
    localStorage.setItem('setting_org_email', org.email)
    localStorage.setItem('setting_org_logo', org.logo)
  } else if (key === 'borrowing_rules') {
    const rules = value as BorrowingRulesSettings
    localStorage.setItem('setting_loan_days', String(rules.default_loan_days))
    localStorage.setItem('setting_max_items', String(rules.max_items_per_user))
    localStorage.setItem('setting_grace_period', String(rules.grace_period_days))
    localStorage.setItem('setting_require_approval', String(rules.require_approval))
  } else if (key === 'reminder_thresholds') {
    const thresh = value as ReminderThresholdsSettings
    localStorage.setItem('setting_warranty_lead', String(thresh.warranty_lead_days))
    localStorage.setItem('setting_borrowing_lead', String(thresh.borrowing_lead_days))
    localStorage.setItem('setting_subscription_lead', String(thresh.subscription_lead_days))
  } else if (key === 'notifications') {
    const notif = value as NotificationSettings
    localStorage.setItem('setting_inapp_active', String(notif.in_app_active))
    localStorage.setItem('setting_smtp_host', notif.smtp_host)
    localStorage.setItem('setting_smtp_sender', notif.smtp_sender)
    localStorage.setItem('setting_tg_token', notif.telegram_token)
    localStorage.setItem('setting_tg_chat_id', notif.telegram_chat_id)
    localStorage.setItem('setting_wa_endpoint', notif.whatsapp_endpoint)
  }

  // 3. Record Audit Log
  try {
    await recordAuditLog({
      action: 'UPDATE_SYSTEM_SETTINGS',
      entity_type: 'settings',
      entity_id: key,
      details: {
        section: key,
        updated_values: value,
      },
    })
  } catch (auditErr) {
    console.warn('Failed to record settings audit log:', auditErr)
  }
}
