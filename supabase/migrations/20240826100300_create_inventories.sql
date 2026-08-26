-- 03. Inventories Entity
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_status') THEN
    CREATE TYPE inventory_status AS ENUM ('Available', 'Borrowed', 'Maintenance', 'Lost', 'Retired');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  condition TEXT DEFAULT 'Bagus',
  location TEXT,
  purchase_info JSONB,
  supplier TEXT,
  warranty_info TEXT,
  photo_url TEXT,
  status inventory_status NOT NULL DEFAULT 'Available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_inventories_updated_at ON public.inventories;
CREATE TRIGGER set_inventories_updated_at 
  BEFORE UPDATE ON public.inventories 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS & Policies
ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read inventories" ON public.inventories;
CREATE POLICY "Allow authenticated users to read inventories" ON public.inventories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert inventories" ON public.inventories;
CREATE POLICY "Allow authenticated users to insert inventories" ON public.inventories
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update inventories" ON public.inventories;
CREATE POLICY "Allow authenticated users to update inventories" ON public.inventories
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete inventories" ON public.inventories;
CREATE POLICY "Allow authenticated users to delete inventories" ON public.inventories
  FOR DELETE TO authenticated USING (true);
