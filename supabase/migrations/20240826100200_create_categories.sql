-- 02. Categories Entity
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'inventory', 'subscription', 'general'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at 
  BEFORE UPDATE ON public.categories 
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS & Base Policy
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON public.categories;
CREATE POLICY "Allow authenticated users to read categories" ON public.categories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage categories" ON public.categories;
CREATE POLICY "Allow authenticated users to manage categories" ON public.categories
  FOR ALL TO authenticated USING (true);

-- Seed initial standard categories
INSERT INTO public.categories (name, description, type)
VALUES 
  ('Laptop', 'Perangkat komputer jinjing dan workstation', 'inventory'),
  ('Monitor', 'Layar monitor eksternal dan display periferal', 'inventory'),
  ('Jaringan', 'Router, switch, access point, dan kabel jaringan', 'inventory'),
  ('Media', 'Kamera, mic, pencahayaan, dan perlengkapan video', 'inventory'),
  ('Server', 'Perangkat server fisik, NAS, dan rackmount', 'inventory'),
  ('Cloud Hosting', 'Layanan infrastruktur cloud dan VPS hosting', 'subscription'),
  ('Developer Tools', 'Lisensi software pengembang, git, CI/CD, dsb.', 'subscription'),
  ('Software Desain', 'Lisensi figma, adobe, dan aset kreatif', 'subscription'),
  ('Produktivitas', 'Email korporat, office suite, manajemen proyek', 'subscription')
ON CONFLICT DO NOTHING;
