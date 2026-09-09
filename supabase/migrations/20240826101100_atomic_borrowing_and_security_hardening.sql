-- 11. Security Hardening (RLS) and Atomic Borrowing RPC Transactions

-- ====================================================================
-- 1. Security Hardening for Inventories & Subscriptions
-- ====================================================================

-- Restrict DELETE on inventories strictly to Admin
DROP POLICY IF EXISTS "Allow authenticated users to delete inventories" ON public.inventories;
DROP POLICY IF EXISTS "Allow only admin to delete inventories" ON public.inventories;
CREATE POLICY "Allow only admin to delete inventories" ON public.inventories
  FOR DELETE TO authenticated USING (public.is_admin());

-- Restrict DELETE on subscriptions strictly to Admin
DROP POLICY IF EXISTS "Allow authenticated users to delete subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow only admin to delete subscriptions" ON public.subscriptions;
CREATE POLICY "Allow only admin to delete subscriptions" ON public.subscriptions
  FOR DELETE TO authenticated USING (public.is_admin());

-- Restrict INSERT on inventories to Admin
DROP POLICY IF EXISTS "Allow authenticated users to insert inventories" ON public.inventories;
DROP POLICY IF EXISTS "Allow only admin to insert inventories" ON public.inventories;
CREATE POLICY "Allow only admin to insert inventories" ON public.inventories
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Restrict INSERT on subscriptions to Admin
DROP POLICY IF EXISTS "Allow authenticated users to insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Allow only admin to insert subscriptions" ON public.subscriptions;
CREATE POLICY "Allow only admin to insert subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- ====================================================================
-- 2. Security Hardening for Borrowings Policy
-- ====================================================================

DROP POLICY IF EXISTS "Allow authenticated users to update borrowings" ON public.borrowings;
DROP POLICY IF EXISTS "Allow users to update their own pending borrowings" ON public.borrowings;

CREATE POLICY "Allow users to update their own pending borrowings" ON public.borrowings
  FOR UPDATE TO authenticated 
  USING (
    public.is_admin() OR 
    (borrower_id = auth.uid() AND status = 'Pending Approval')
  );

-- ====================================================================
-- 3. Stored Procedure / RPC: Atomic Borrowing Approval
-- ====================================================================

CREATE OR REPLACE FUNCTION public.rpc_approve_borrowing(target_borrowing_id UUID)
RETURNS VOID AS $$
DECLARE
  v_inventory_id UUID;
  v_stock INTEGER;
  v_borrowing_status TEXT;
BEGIN
  -- 1. Verify caller has admin privileges
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Administrator yang berhak menyetujui peminjaman.';
  END IF;

  -- 2. Lock borrowing record
  SELECT inventory_id, status INTO v_inventory_id, v_borrowing_status
  FROM public.borrowings
  WHERE id = target_borrowing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data peminjaman tidak ditemukan.';
  END IF;

  IF v_borrowing_status <> 'Pending Approval' THEN
    RAISE EXCEPTION 'Permohonan peminjaman telah diproses sebelumnya (Status: %).', v_borrowing_status;
  END IF;

  -- 3. Lock inventory record and check stock
  SELECT quantity INTO v_stock
  FROM public.inventories
  WHERE id = v_inventory_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data barang inventaris tidak ditemukan.';
  END IF;

  IF v_stock < 1 THEN
    RAISE EXCEPTION 'Gagal menyetujui peminjaman: Stok fisik barang saat ini telah habis.';
  END IF;

  -- 4. Decrement inventory stock atomically
  UPDATE public.inventories
  SET 
    quantity = v_stock - 1,
    status = CASE WHEN (v_stock - 1) = 0 THEN 'Borrowed' ELSE status END,
    updated_at = NOW()
  WHERE id = v_inventory_id;

  -- 5. Mark borrowing as Borrowed
  UPDATE public.borrowings
  SET 
    status = 'Borrowed',
    start_date = NOW(),
    updated_at = NOW()
  WHERE id = target_borrowing_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 4. Stored Procedure / RPC: Atomic Borrowing Return
-- ====================================================================

CREATE OR REPLACE FUNCTION public.rpc_return_borrowing(
  target_borrowing_id UUID,
  p_return_condition TEXT DEFAULT 'Bagus',
  p_return_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_inventory_id UUID;
  v_borrower_id UUID;
  v_status TEXT;
  v_current_stock INTEGER;
  v_new_condition TEXT;
BEGIN
  -- 1. Lock borrowing record
  SELECT inventory_id, borrower_id, status 
  INTO v_inventory_id, v_borrower_id, v_status
  FROM public.borrowings
  WHERE id = target_borrowing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data peminjaman tidak ditemukan.';
  END IF;

  IF v_status <> 'Borrowed' THEN
    RAISE EXCEPTION 'Aset tidak dapat dikembalikan karena status saat ini adalah "%".', v_status;
  END IF;

  -- 2. Verify caller is borrower or admin
  IF auth.uid() <> v_borrower_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya peminjam bersangkutan atau Administrator yang berhak mengembalikan aset.';
  END IF;

  -- 3. Lock inventory and update stock
  SELECT quantity INTO v_current_stock
  FROM public.inventories
  WHERE id = v_inventory_id
  FOR UPDATE;

  v_new_condition := COALESCE(p_return_condition, 'Bagus');

  UPDATE public.inventories
  SET 
    quantity = v_current_stock + 1,
    status = 'Available',
    condition = CASE WHEN v_new_condition <> 'Bagus' THEN v_new_condition ELSE condition END,
    updated_at = NOW()
  WHERE id = v_inventory_id;

  -- 4. Mark borrowing record as Returned
  UPDATE public.borrowings
  SET 
    status = 'Returned',
    return_date = NOW(),
    return_condition = v_new_condition,
    return_notes = p_return_notes,
    updated_at = NOW()
  WHERE id = target_borrowing_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
