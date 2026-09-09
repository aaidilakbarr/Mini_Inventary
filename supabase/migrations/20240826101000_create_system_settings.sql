-- 10. Centralized System Settings Entity (Replaces LocalStorage)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Reading allowed for all authenticated users (so Staff & Users can read loan days, etc.)
DROP POLICY IF EXISTS "Allow authenticated users to read system settings" ON public.system_settings;
CREATE POLICY "Allow authenticated users to read system settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

-- Only Admin can insert/update/delete settings
DROP POLICY IF EXISTS "Allow only admin to update system settings" ON public.system_settings;
CREATE POLICY "Allow only admin to update system settings" ON public.system_settings
  FOR ALL TO authenticated USING (public.is_admin());

-- Seed Initial Default Settings Rows (Idempotent)
INSERT INTO public.system_settings (key, value, description)
VALUES 
  (
    'organization',
    jsonb_build_object(
      'name', 'PT. Sinergi Inovasi Digital',
      'address', 'Gedung Cyber 2 Lantai 15, Jl. HR Rasuna Said, Jakarta',
      'email', 'admin@sinergidigital.co.id',
      'logo', ''
    ),
    'Identitas & profil instansi/perusahaan pada kop laporan dan notifikasi'
  ),
  (
    'borrowing_rules',
    jsonb_build_object(
      'default_loan_days', 7,
      'max_items_per_user', 3,
      'grace_period_days', 1,
      'require_approval', true
    ),
    'Parameter kebijakan masa peminjaman dan kuota per user'
  ),
  (
    'reminder_thresholds',
    jsonb_build_object(
      'warranty_lead_days', 30,
      'borrowing_lead_days', 3,
      'subscription_lead_days', 7
    ),
    'Ambang batas lead time hari pengingat (due soon) otomatis'
  ),
  (
    'notifications',
    jsonb_build_object(
      'in_app_active', true,
      'smtp_host', 'smtp.resend.com',
      'smtp_sender', 'system@invhub.internal',
      'telegram_token', '',
      'telegram_chat_id', '',
      'whatsapp_endpoint', ''
    ),
    'Integrasi gateway notifikasi email, telegram, dan whatsapp'
  )
ON CONFLICT (key) DO NOTHING;
