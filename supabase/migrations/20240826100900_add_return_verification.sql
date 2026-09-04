-- 09. Add return verification fields to borrowings
ALTER TABLE public.borrowings 
ADD COLUMN IF NOT EXISTS return_condition TEXT DEFAULT 'Bagus',
ADD COLUMN IF NOT EXISTS return_notes TEXT;
