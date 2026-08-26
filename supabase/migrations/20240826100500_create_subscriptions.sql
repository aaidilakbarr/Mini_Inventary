-- 05. Subscriptions Entity
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle') THEN
    CREATE TYPE billing_cycle AS ENUM ('Monthly', 'Quarterly', 'Semi-Annually', 'Yearly', 'Custom');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('Active', 'Cancelled', 'Expired', 'Past Due');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  provider TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  billing_cycle billing_cycle NOT NULL DEFAULT 'Monthly',
  start_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ NOT NULL,
  payment_method TEXT,
  status subscription_status NOT NULL DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS & Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read subscriptions" ON public.subscriptions;
CREATE POLICY "Allow authenticated users to read subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert subscriptions" ON public.subscriptions;
CREATE POLICY "Allow authenticated users to insert subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update subscriptions" ON public.subscriptions;
CREATE POLICY "Allow authenticated users to update subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete subscriptions" ON public.subscriptions;
CREATE POLICY "Allow authenticated users to delete subscriptions" ON public.subscriptions
  FOR DELETE TO authenticated USING (true);
