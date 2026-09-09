-- 12. Add Inventory Photo Column and Provision Supabase Storage Bucket

-- 1. Ensure photo_url column exists in inventories table
ALTER TABLE public.inventories 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Create public storage bucket for inventory images (5MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-images',
  'inventory-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

-- 3. Storage Row Level Security (RLS) Policies
DROP POLICY IF EXISTS "Public can view inventory images" ON storage.objects;
CREATE POLICY "Public can view inventory images" ON storage.objects
  FOR SELECT USING (bucket_id = 'inventory-images');

DROP POLICY IF EXISTS "Authenticated users can upload inventory images" ON storage.objects;
CREATE POLICY "Authenticated users can upload inventory images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inventory-images');

DROP POLICY IF EXISTS "Authenticated users can update inventory images" ON storage.objects;
CREATE POLICY "Authenticated users can update inventory images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'inventory-images');

DROP POLICY IF EXISTS "Authenticated users can delete inventory images" ON storage.objects;
CREATE POLICY "Authenticated users can delete inventory images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'inventory-images');
