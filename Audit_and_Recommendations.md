# 📋 Laporan Deep Audit & Rekomendasi Roadmap Fitur
**Proyek:** Mini Inventory & Reminder Management System  
**Tanggal Audit:** 3 September 2026  
**Status:** Rekomendasi Arsitektural & Perbaikan Celah Keamanan

---

## 📑 Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Temuan Deep Audit (Celah & Hal yang Terlewat)](#2-temuan-deep-audit-celah--hal-yang-terlewat)
   - [2.1 Skema Basis Data Langganan (Subscriptions)](#21-skema-basis-data-langganan-subscriptions)
   - [2.2 Celah Keamanan Otorisasi (Row Level Security - RLS)](#22-celah-keamanan-otorisasi-row-level-security---rls)
   - [2.3 Race Condition & Mutasi Stok Non-Atomik](#23-race-condition--mutasi-stok-non-atomik)
   - [2.4 Penyimpanan Pengaturan Sistem di LocalStorage](#24-penyimpanan-pengaturan-sistem-di-localstorage)
   - [2.5 Ketiadaan Verifikasi Kondisi Aset Saat Pengembalian](#25-ketiadaan-verifikasi-kondisi-aset-saat-pengembalian)
   - [2.6 Audit Trail Bergantung Penuh pada Frontend](#26-audit-trail-bergantung-penuh-pada-frontend)
   - [2.7 Ambiguitas Aset Unik vs Barang Massal (Consumables)](#27-ambiguitas-aset-unik-vs-barang-massal-consumables)
3. [Rekomendasi Skrip SQL & Solusi Teknis](#3-rekomendasi-skrip-sql--solusi-teknis)
4. [Rekomendasi Fitur untuk Pengembangan Kedepannya](#4-rekomendasi-fitur-untuk-pengembangan-kedepannya)
   - [Pilar 1: Otomasi & Integrasi Notifikasi Multi-Channel](#pilar-1-otomasi--integrasi-notifikasi-multi-channel)
   - [Pilar 2: Barcode & QR Code Scanner Fisik](#pilar-2-barcode--qr-code-scanner-fisik)
   - [Pilar 3: Dokumen Legalitas (BAST PDF) & Ekspor Laporan](#pilar-3-dokumen-legalitas-bast-pdf--ekspor-laporan)
   - [Pilar 4: Siklus Hidup Aset & Depresiasi (Asset Lifecycle)](#pilar-4-siklus-hidup-aset--depresiasi-asset-lifecycle)
   - [Pilar 5: Multi-Currency & Bucket Penyimpanan Invoice](#pilar-5-multi-currency--bucket-penyimpanan-invoice)
   - [Pilar 6: Portal Mandiri Karyawan (Staff Self-Service)](#pilar-6-portal-mandiri-karyawan-staff-self-service)
5. [Matriks Prioritas Pengembangan (Impact vs Effort)](#5-matriks-prioritas-pengembangan-impact-vs-effort)

---

## 1. Ringkasan Eksekutif

Aplikasi telah memiliki fondasi antarmuka yang solid, modular, dan rapi menggunakan **React 19, TypeScript, Tailwind CSS, serta Supabase**. Namun, hasil audit mendalam pada lapisan basis data, logika bisnis, dan integritas data menemukan sejumlah celah fungsional dan keamanan yang dapat berisiko saat sistem digunakan secara bersamaan oleh banyak pengguna (*multi-user concurrent environment*).

Laporan ini menyajikan analisis rinci temuan audit, rancangan solusi skrip SQL perbaikan, serta peta jalan (*roadmap*) pengembangan fitur bernilai tinggi ke depan.

---

## 2. Temuan Deep Audit (Celah & Hal yang Terlewat)

### 2.1 Skema Basis Data Langganan (`subscriptions`)
*File Terkait:* `supabase/migrations/20240826100500_create_subscriptions.sql`

1. **Ketiadaan Informasi Mata Uang (`currency`)**:
   - Kolom `cost DECIMAL(12, 2)` tidak memiliki kode mata uang.
   - Layanan SaaS/Cloud modern (OpenAI, AWS, GitHub, Vercel, Figma) hampir selalu ditagih dalam **USD**.
   - Di frontend saat ini, semua biaya diformat langsung dalam Rupiah (`formatCurrencyID`). Jika user memasukkan angka `20` (maksudnya $20 USD), sistem menampilkannya sebagai `Rp 20`.
2. **Tidak Ada Riwayat Pembayaran (*Billing History*)**:
   - Data hanya berupa 1 baris per layanan. Saat tanggal `next_billing_date` terlewati dan dibayar, tidak ada tabel histori transaksi untuk melacak riwayat pembayaran bulan-bulan sebelumnya.
3. **Ketiadaan Tautan Bukti Pembayaran / Invoice (`invoice_url`)**:
   - Tidak ada kolom untuk melampirkan berkas bukti potong pajak, kuitansi, atau invoice PDF dari penyedia layanan.
4. **Tidak Terhubung Otomatis ke Sistem Reminder**:
   - Meskipun memiliki `next_billing_date`, sistem tidak memiliki trigger otomatis yang menerbitkan pengingat di tabel `reminders`.

---

### 2.2 Celah Keamanan Otorisasi (Row Level Security - RLS)
*File Terkait:* `supabase/migrations/20240826100400_create_borrowings.sql` & `20240826100300_create_inventories.sql`

1. **Bypass Persetujuan Peminjaman oleh Akun Staf**:
   - Pada tabel `borrowings`:
     ```sql
     CREATE POLICY "Allow authenticated users to update borrowings" 
       ON public.borrowings FOR UPDATE TO authenticated USING (true);
     ```
   - **Celah:** Siapa pun pengguna dengan peran `staff` dapat menggunakan Supabase client langsung di console browser untuk meng-update status pengajuan mereka dari `Pending Approval` menjadi `Approved` tanpa persetujuan Admin.
2. **Izin Hapus Terlalu Terbuka (*Insecure Delete Policy*)**:
   - Di tabel `inventories` dan `subscriptions`, policy `DELETE` disetel ke `USING (true)`. Staf biasa dapat menghapus data aset atau data langganan perusahaan.

---

### 2.3 Race Condition & Mutasi Stok Non-Atomik
*File Terkait:* `src/lib/api/borrowings.ts` (baris 106–123 & 140–185)

1. **Operasi Terpisah di Sisi Frontend**:
   - Persetujuan peminjaman menjalankan 2 query terpisah:
     1. Update status di tabel `borrowings` menjadi `Borrowed`.
     2. Membaca `quantity` di tabel `inventories`, mengurangi 1 di memori browser, lalu mengupdate tabel `inventories`.
   - **Risiko:** Jika terjadi kegagalan jaringan atau tab browser ditutup setelah langkah 1, status peminjaman telah disetujui namun stok fisik di tabel `inventories` **tidak berkurang**.
2. **Race Condition Stok Terakhir**:
   - Jika stok tersisa 1 dan dua staf mengajukan barang bersamaan, keduanya dapat membaca stok `1`, menyebabkan stok riil menjadi inkonsisten (*lost update*).

---

### 2.4 Penyimpanan Pengaturan Sistem di LocalStorage
*File Terkait:* `src/pages/Settings.tsx` (baris 41–60)

1. Konfigurasi organisasi (Nama Lembaga, Alamat Kantor, Email Resmi, Aturan Batas Pinjam, Masa Toleransi, Ambang Batas Hari Pengingat) disimpan di `localStorage` peramban.
2. **Akibat:** Perubahan yang disimpan oleh seorang Admin di komputernya tidak tersimpan di server Supabase, sehingga tidak akan terbaca oleh Admin atau Staf lain di perangkat berbeda.

---

### 2.5 Ketiadaan Verifikasi Kondisi Aset Saat Pengembalian
*File Terkait:* `src/components/modals/ReturnConfirmDialog.tsx` & `src/lib/api/borrowings.ts`

1. Dialog pengembalian hanya menyediakan satu tombol konfirmasi.
2. Tidak ada input untuk mencatat:
   - Kondisi fisik barang saat kembali (apakah masih `Bagus`, atau berubah menjadi `Rusak Ringan` / `Rusak Berat`).
   - Catatan pengembalian (*return notes*).
3. **Akibat:** Barang yang kembali dalam kondisi rusak tetap akan dikembalikan ke stok `Available` secara otomatis dan berpotensi dipinjamkan kembali ke pengguna lain.

---

### 2.6 Audit Trail Bergantung Penuh pada Frontend
*File Terkait:* `src/lib/api/auditLogs.ts`

1. Pencatatan audit dilakukan secara manual melalui fungsi `recordAuditLog()` dari komponen React.
2. **Kelemahan:**
   - Jika pengembang lupa menyisipkan pemanggilan fungsi ini pada modul baru, perubahan data tidak tercatat.
   - Panggilan dari frontend dapat dimanipulasi atau diblokir oleh ekstensi browser / script pihak ketiga.

---

### 2.7 Ambiguitas Aset Unik vs Barang Massal (Consumables)
*File Terkait:* `src/types/database.ts` & tabel `borrowings`

1. Tabel `borrowings` tidak memiliki kolom kuantitas pinjam (`quantity_borrowed`).
2. Logika pengurangan stok selalu mengurangkan nilai 1 unit. Hal ini cocok untuk aset unik (seperti Laptop atau Kamera), namun tidak dapat memfasilitasi barang massal seperti kabel, adaptor, atau alat tulis di mana staf membutuhkan lebih dari 1 unit dalam sekali permohonan.

---

## 3. Rekomendasi Skrip SQL & Solusi Teknis

Berikut rancangan skrip migrasi SQL perbaikan yang disarankan untuk diterapkan di Supabase:

```sql
-- ====================================================================
-- 1. Perbaikan Tabel Subscriptions (Mata Uang & Lampiran Invoice)
-- ====================================================================
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'IDR',
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN NOT NULL DEFAULT true;

-- ====================================================================
-- 2. Pembuatan Tabel Riwayat Pembayaran Langganan
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  billing_date TIMESTAMPTZ NOT NULL,
  amount_paid DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IDR',
  payment_method TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 3. Pengetatan RLS Kebijakan Peminjaman & Penghapusan
-- ====================================================================
-- Hanya Admin yang berhak menyetujui / menolak peminjaman
DROP POLICY IF EXISTS "Allow authenticated users to update borrowings" ON public.borrowings;

CREATE POLICY "Allow users to update their own pending borrowings" ON public.borrowings
  FOR UPDATE TO authenticated 
  USING (
    public.is_admin() OR 
    (borrower_id = auth.uid() AND status = 'Pending Approval')
  );

-- Larang Staff menghapus data inventaris dan langganan
DROP POLICY IF EXISTS "Allow authenticated users to delete inventories" ON public.inventories;
CREATE POLICY "Allow only admin to delete inventories" ON public.inventories
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow authenticated users to delete subscriptions" ON public.subscriptions;
CREATE POLICY "Allow only admin to delete subscriptions" ON public.subscriptions
  FOR DELETE TO authenticated USING (public.is_admin());

-- ====================================================================
-- 4. Tabel Pengaturan Sistem Terpusat (Menggantikan LocalStorage)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read system settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow only admin to update system settings" ON public.system_settings
  FOR ALL TO authenticated USING (public.is_admin());

-- ====================================================================
-- 5. Stored Function Transaksi Atomik Persetujuan Peminjaman
-- ====================================================================
CREATE OR REPLACE FUNCTION public.rpc_approve_borrowing(target_borrowing_id UUID)
RETURNS VOID AS $$
DECLARE
  v_inventory_id UUID;
  v_stock INTEGER;
BEGIN
  -- Pastikan hanya admin yang dapat menjalankan RPC ini
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Administrator yang berhak menyetujui peminjaman.';
  END IF;

  -- Kunci baris peminjaman untuk mencegah konkurensi
  SELECT inventory_id INTO v_inventory_id 
  FROM public.borrowings 
  WHERE id = target_borrowing_id AND status = 'Pending Approval'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Permohonan peminjaman tidak ditemukan atau telah diproses.';
  END IF;

  -- Kunci dan periksa stok inventaris
  SELECT quantity INTO v_stock
  FROM public.inventories
  WHERE id = v_inventory_id
  FOR UPDATE;

  IF v_stock <= 0 THEN
    RAISE EXCEPTION 'Stok aset tidak mencukupi untuk disetujui.';
  END IF;

  -- Update status peminjaman menjadi Borrowed
  UPDATE public.borrowings
  SET status = 'Borrowed', start_date = NOW(), updated_at = NOW()
  WHERE id = target_borrowing_id;

  -- Kurangi stok inventaris secara atomik
  UPDATE public.inventories
  SET 
    quantity = v_stock - 1,
    status = CASE WHEN (v_stock - 1) <= 0 THEN 'Borrowed'::public.inventory_status ELSE status END,
    updated_at = NOW()
  WHERE id = v_inventory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Rekomendasi Fitur untuk Pengembangan Kedepannya

### Pilar 1: Otomasi & Integrasi Notifikasi Multi-Channel
1. **Pemeriksaan Jadwal Otomatis Harian (*Supabase pg_cron / Edge Functions*)**:
   - Menjalankan rutinitas cron setiap pagi (pukul 08:00 WIB) untuk:
     - Mengubah status reminder dari `Upcoming` menjadi `Due Today` atau `Overdue`.
     - Mendeteksi aset pinjaman yang jatuh tempo dalam H-1 atau terlambat dikembalikan.
     - Mendeteksi tagihan langganan yang akan diperpanjang dalam H-7 dan H-3.
2. **Notifikasi Bot Telegram**:
   - Integrasi webhook Telegram untuk mengirimkan pengingat langsung ke grup staf IT atau pimpinan kantor.
3. **Notifikasi Email Digest (via Resend / SendGrid)**:
   - Pengiriman rekapitulasi mingguan estimasi pengeluaran perpanjangan lisensi bulan berjalan kepada divisi keuangan.

---

### Pilar 2: Barcode & QR Code Scanner Fisik
1. **Generator Label QR Code Siap Cetak**:
   - Setiap aset dapat digenerate label stiker PDF mini yang berisi:
     - Kode QR unik berbasis ID aset.
     - Kode inventaris (misal: `INV-2024-001`).
     - Nama aset dan lokasi penempatan.
2. **In-App Camera Scanner**:
   - Memanfaatkan kamera smartphone atau webcam laptop untuk memindai label fisik.
   - Pindai QR untuk langsung membuka permohonan pinjam cepat (*quick borrow*) atau verifikasi pengembalian (*instant return check*).

---

### Pilar 3: Dokumen Legalitas (BAST PDF) & Ekspor Laporan
1. **Cetak PDF Berita Acara Serah Terima (BAST)**:
   - Untuk aset bernilai tinggi (laptop kerja, kamera, kendaraan operasional), sistem menghasilkan dokumen PDF resmi yang memuat:
     - Spesifikasi aset, nomor seri, dan kelengkapan aksesoris.
     - Identitas dan kontak peminjam.
     - Klausul tanggung jawab dan ganti rugi jika terjadi kerusakan/kehilangan.
     - Tempat tanda tangan fisik maupun digital.
2. **Ekspor Laporan Komprehensif (Excel & PDF)**:
   - Rekap inventarisasi tahunan untuk audit pembukuan.
   - Rekap pengeluaran biaya langganan software per kategori.

---

### Pilar 4: Siklus Hidup Aset & Depresiasi (Asset Lifecycle)
1. **Manajemen Pemeliharaan & Servis (`maintenance_records`)**:
   - Pencatatan aset yang masuk ke status `Maintenance`.
   - Dokumentasi vendor reparasi, tanggal estimasi selesai, rincian suku cadang, dan biaya servis.
2. **Kalkulator Depresiasi Nilai Buku (*Straight-Line Depreciation*)**:
   - Menghitung nilai penyusutan aset secara otomatis berdasarkan harga perolehan (*purchase price*), masa manfaat dalam bulan (*useful life*), dan estimasi nilai sisa (*salvage value*).
   - Memberikan laporan nilai aset bersih saat ini (*Current Book Value*) untuk kebutuhan neraca aset.

---

### Pilar 5: Multi-Currency & Bucket Penyimpanan Invoice
1. **Multi-Currency Support**:
   - Menambahkan pemilihan mata uang (`IDR`, `USD`, `EUR`, `SGD`) pada tagihan langganan.
   - Input kurs konversi manual atau otomatis untuk mendapatkan estimasi total pengeluaran dalam Rupiah secara akurat.
2. **Supabase Storage Bucket untuk Bukti Bayar**:
   - Pembuatan bucket privat `invoices-and-receipts` di Supabase Storage untuk mengunggah dan mengunduh berkas tagihan atau kuitansi pembayaran secara aman.

---

### Pilar 6: Portal Mandiri Karyawan (Staff Self-Service)
1. **Tab "Aset Saya" pada Sisi Staf**:
   - Dashboard ringkas khusus staf untuk melihat barang apa saja yang saat ini sedang mereka bawa beserta hitung mundur masa peminjaman.
2. **Fitur "Ajukan Perpanjangan" (*Request Extension*)**:
   - Staf dapat meminta penambahan waktu peminjaman sebelum jatuh tempo tanpa harus membatalkan atau membuat tiket baru. Admin menerima notifikasi persetujuan perpanjangan.

---

## 5. Matriks Prioritas Pengembangan (Impact vs Effort)

| No | Inisiatif Fitur / Perbaikan | Dampak (*Impact*) | Tingkat Kesulitan (*Effort*) | Rekomendasi Tahap |
| :---: | :--- | :---: | :---: | :---: |
| **1** | **Perbaikan Keamanan RLS & RPC Transaksi Atomik Pinjam** | 🔴 Kritis / Sangat Tinggi | Rendah | **Fase 1 (Segera)** |
| **2** | **Migrasi Pengaturan Sistem ke Database Supabase** | 🔴 Sangat Tinggi | Rendah | **Fase 1 (Segera)** |
| **3** | **Input Kondisi Fisik & Catatan Saat Pengembalian Aset** | 🟠 Tinggi | Rendah | **Fase 1 (Segera)** |
| **4** | **Penambahan Mata Uang & Kolom Invoice pada Langganan** | 🟠 Tinggi | Rendah | **Fase 2** |
| **5** | **Cron Job Otomasi Reminder & Due Date (Edge Functions)** | 🟠 Tinggi | Sedang | **Fase 2** |
| **6** | **Integrasi Notifikasi Bot Telegram** | 🟠 Tinggi | Sedang | **Fase 2** |
| **7** | **Generator Label QR Code & Mobile Camera Scanner** | 🟡 Menengah | Sedang | **Fase 3** |
| **8** | **Ekspor Dokumen Berita Acara (BAST) & Rekap Excel** | 🟡 Menengah | Sedang | **Fase 3** |
| **9** | **Manajemen Perawatan (Maintenance) & Depresiasi Aset** | 🟡 Menengah | Tinggi | **Fase 4** |
| **10** | **Portal Mandiri Staf (Fitur Perpanjangan Pinjaman)** | 🟢 Pelengkap | Rendah | **Fase 4** |
