-- 13. Fix Atomic Borrowing Return RPC for Damaged/Good Conditions & Explicit Grants

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
  v_existing_borrowing_notes TEXT;
  v_current_stock INTEGER;
  v_existing_condition TEXT;
  v_existing_inv_notes TEXT;
  v_new_condition TEXT;
  v_trimmed_notes TEXT;
  v_is_damaged BOOLEAN;
  v_return_tag TEXT;
  v_combined_borrowing_notes TEXT;
  v_inv_note_entry TEXT;
  v_updated_inv_notes TEXT;
  v_target_stock INTEGER;
  v_target_status public.inventory_status;
  v_target_condition TEXT;
BEGIN
  -- 1. Lock borrowing record to prevent double-return race conditions
  SELECT inventory_id, borrower_id, status, notes
  INTO v_inventory_id, v_borrower_id, v_status, v_existing_borrowing_notes
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

  -- 3. Lock inventory record and compute deterministic post-return state
  SELECT quantity, condition, notes
  INTO v_current_stock, v_existing_condition, v_existing_inv_notes
  FROM public.inventories
  WHERE id = v_inventory_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data barang inventaris tidak ditemukan.';
  END IF;

  v_current_stock := COALESCE(v_current_stock, 0);
  v_new_condition := COALESCE(NULLIF(BTRIM(p_return_condition), ''), 'Bagus');
  v_trimmed_notes := NULLIF(BTRIM(COALESCE(p_return_notes, '')), '');
  v_is_damaged := v_new_condition IN ('Rusak Ringan', 'Rusak Berat', 'Perlu Perbaikan', 'Rusak');

  IF v_is_damaged THEN
    IF v_current_stock > 0 THEN
      -- Remaining healthy stock stays Available; damaged unit awaits repair via reminder
      v_target_stock := v_current_stock;
      v_target_status := 'Available';
      v_target_condition := COALESCE(v_existing_condition, 'Bagus');
      v_inv_note_entry := FORMAT(
        '[Pengembalian %s]: 1 unit dikembalikan %s%s - dialihkan ke tiket Pengingat Perbaikan.',
        TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY'),
        v_new_condition,
        CASE WHEN v_trimmed_notes IS NOT NULL THEN ' (' || v_trimmed_notes || ')' ELSE '' END
      );
    ELSE
      -- Last/single unit returned damaged -> move to Maintenance
      v_target_stock := 1;
      v_target_status := 'Maintenance';
      v_target_condition := v_new_condition;
      v_inv_note_entry := FORMAT(
        '[Pengembalian %s]: Dikembalikan %s%s - dialihkan ke tiket Pengingat Perbaikan (status Maintenance).',
        TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY'),
        v_new_condition,
        CASE WHEN v_trimmed_notes IS NOT NULL THEN ' (' || v_trimmed_notes || ')' ELSE '' END
      );
    END IF;
  ELSE
    v_target_stock := v_current_stock + 1;
    v_target_status := 'Available';
    v_target_condition := 'Bagus';
    IF v_trimmed_notes IS NOT NULL THEN
      v_inv_note_entry := FORMAT(
        '[Pengembalian %s]: Kondisi Bagus - %s',
        TO_CHAR(NOW() AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY'),
        v_trimmed_notes
      );
    END IF;
  END IF;

  v_updated_inv_notes := CASE
    WHEN v_inv_note_entry IS NULL THEN v_existing_inv_notes
    WHEN COALESCE(v_existing_inv_notes, '') = '' THEN v_inv_note_entry
    ELSE v_existing_inv_notes || E'\n' || v_inv_note_entry
  END;

  UPDATE public.inventories
  SET
    quantity = v_target_stock,
    status = v_target_status,
    condition = v_target_condition,
    notes = v_updated_inv_notes,
    updated_at = NOW()
  WHERE id = v_inventory_id;

  -- 4. Mark borrowing record as Returned atomically
  v_return_tag := FORMAT(
    '[Pengembalian - Kondisi: %s]%s',
    v_new_condition,
    CASE WHEN v_trimmed_notes IS NOT NULL THEN ' Catatan: ' || v_trimmed_notes ELSE '' END
  );

  v_combined_borrowing_notes := CASE
    WHEN COALESCE(v_existing_borrowing_notes, '') = '' THEN v_return_tag
    ELSE v_existing_borrowing_notes || E'\n' || v_return_tag
  END;

  UPDATE public.borrowings
  SET
    status = 'Returned',
    return_date = NOW(),
    return_condition = v_new_condition,
    return_notes = v_trimmed_notes,
    notes = v_combined_borrowing_notes,
    updated_at = NOW()
  WHERE id = target_borrowing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.rpc_approve_borrowing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_return_borrowing(UUID, TEXT, TEXT) TO authenticated;
