-- 06. Reminders Entity
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
    CREATE TYPE reminder_status AS ENUM ('Upcoming', 'Due Today', 'Overdue', 'Completed', 'Dismissed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual', -- 'inventory', 'borrowing', 'subscription', 'maintenance', 'manual'
  source_id UUID,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Sedang', -- 'Tinggi', 'Sedang', 'Rendah'
  status reminder_status NOT NULL DEFAULT 'Upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_reminders_updated_at ON public.reminders;
CREATE TRIGGER set_reminders_updated_at 
  BEFORE UPDATE ON public.reminders 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS & Policies
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read reminders" ON public.reminders;
CREATE POLICY "Allow authenticated users to read reminders" ON public.reminders
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert reminders" ON public.reminders;
CREATE POLICY "Allow authenticated users to insert reminders" ON public.reminders
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update reminders" ON public.reminders;
CREATE POLICY "Allow authenticated users to update reminders" ON public.reminders
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete reminders" ON public.reminders;
CREATE POLICY "Allow authenticated users to delete reminders" ON public.reminders
  FOR DELETE TO authenticated USING (true);
