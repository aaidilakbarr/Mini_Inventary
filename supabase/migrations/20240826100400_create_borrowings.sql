-- 04. Borrowings Entity
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'borrowing_status') THEN
    CREATE TYPE borrowing_status AS ENUM ('Pending Approval', 'Approved', 'Borrowed', 'Returned', 'Rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.borrowings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES public.inventories(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  status borrowing_status NOT NULL DEFAULT 'Pending Approval',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_borrowings_updated_at ON public.borrowings;
CREATE TRIGGER set_borrowings_updated_at 
  BEFORE UPDATE ON public.borrowings 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS & Policies
ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read borrowings" ON public.borrowings;
CREATE POLICY "Allow authenticated users to read borrowings" ON public.borrowings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert borrowings" ON public.borrowings;
CREATE POLICY "Allow authenticated users to insert borrowings" ON public.borrowings
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update borrowings" ON public.borrowings;
CREATE POLICY "Allow authenticated users to update borrowings" ON public.borrowings
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete borrowings" ON public.borrowings;
CREATE POLICY "Allow authenticated users to delete borrowings" ON public.borrowings
  FOR DELETE TO authenticated USING (true);
