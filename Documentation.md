# 📦 Dokumentasi Proyek: Mini Inventory & Reminder Management System

Aplikasi modern berbasis web untuk mengelola **inventaris aset fisik, peminjaman barang, langganan layanan berulang (subscriptions), sistem pengingat terpusat (reminders), dan audit log aktivitas** dalam satu platform terpadu dan aman.

---

## 📑 Daftar Isi

1. [Ringkasan Proyek & Tujuan](#1-ringkasan-proyek--tujuan)
2. [Tech Stack & Teknologi](#2-tech-stack--teknologi)
3. [Arsitektur Sistem & Alur Kerja](#3-arsitektur-sistem--alur-kerja)
4. [Peran Pengguna & Hak Akses (RBAC)](#4-peran-pengguna--hak-akses-rbac)
5. [Modul & Fitur Utama](#5-modul--fitur-utama)
   - [5.1 Dashboard Eksekutif](#51-dashboard-eksekutif)
   - [5.2 Manajemen Inventaris (Inventories)](#52-manajemen-inventaris-inventories)
   - [5.3 Manajemen Peminjaman (Borrowings)](#53-manajemen-peminjaman-borrowings)
   - [5.4 Manajemen Langganan (Subscriptions)](#54-manajemen-langganan-subscriptions)
   - [5.5 Sistem Pengingat Cerdas (Reminders)](#55-sistem-pengingat-cerdas-reminders)
   - [5.6 Audit Log & Jejak Aktivitas (Audit Logs)](#56-audit-log--jejak-aktivitas-audit-logs)
   - [5.7 Pengaturan Sistem (Settings)](#57-pengaturan-sistem-settings)
6. [Struktur Direktori Proyek](#6-struktur-direktori-proyek)
7. [Skema Basis Data & Keamanan (Supabase PostgreSQL)](#7-skema-basis-data--keamanan-supabase-postgresql)
   - [Tabel & Relasi](#tabel--relasi)
   - [Enum Types](#enum-types)
   - [Database Triggers & Functions](#database-triggers--functions)
   - [Row Level Security (RLS)](#row-level-security-rls)
8. [Panduan Instalasi & Menjalankan Aplikasi](#8-panduan-instalasi--menjalankan-aplikasi)
   - [Prasyarat](#prasyarat)
   - [Setup Environment](#setup-environment)
   - [Menjalankan Migrasi Database](#menjalankan-migrasi-database)
   - [Menjalankan Server Lokal](#menjalankan-server-lokal)
   - [Build Produksi](#build-produksi)
9. [Roadmap & Pengembangan Mendatang](#9-roadmap--pengembangan-mendatang)

---

## 1. Ringkasan Proyek & Tujuan

Sebelumnya, manajemen aset operasional, peminjaman barang kantor, langganan software/domain berulang, serta jadwal perawatan sering kali dicatat terpisah melalui lembar kerja (spreadsheet), pesan instan, atau catatan tempel. Hal ini menimbulkan risiko kehilangan aset, keterlambatan pengembalian, perpanjangan lisensi yang terlewat, dan tidak adanya akuntabilitas.

**Mini Inventory & Reminder Hub** hadir sebagai solusi terpusat yang:
- **Mengontrol Stok & Status Aset**: Mengetahui dengan pasti lokasi, kondisi, jumlah, dan siapa yang sedang meminjam suatu aset.
- **Otomasi Siklus Peminjaman**: Menyediakan workflow pengajuan, persetujuan admin, pengembalian aset, serta penyesuaian stok otomatis.
- **Transparansi Pengeluaran Berulang**: Mencatat biaya dan siklus jatuh tempo langganan SaaS, hosting, cloud server, dan lisensi kerja.
- **Pusat Pengingat Proaktif**: Pengingat otomatis untuk masa garansi habis, jatuh tempo pinjaman, dan perpanjangan tagihan.
- **Keamanan & Akuntabilitas Penuh**: Didukung autentikasi Supabase, Role-Based Access Control (RBAC), Row Level Security (RLS), dan pencatatan audit log otomatis.

---

## 2. Tech Stack & Teknologi

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- **Bahasa**: [TypeScript 6](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v3.4](https://tailwindcss.com/) + [tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)
- **Komponen UI**: Base UI / shadcn-style component primitives, [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **State & Data Fetching**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Form & Validasi**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Format Tanggal & Angka**: `date-fns`, format mata uang Rupiah (`formatCurrencyID`), format tanggal lokal Indonesia (`formatDateID`)
- **Linter & Code Quality**: [Oxlint](https://oxc.rs/)

### Backend & Database (BaaS)
- **Platform**: [Supabase](https://supabase.com/)
- **Database Engine**: PostgreSQL 15+
- **Autentikasi**: Supabase Auth (Email & Password, JWT, Session Persistence)
- **Otorisasi**: PostgreSQL Row Level Security (RLS) & Stored Functions (`SECURITY DEFINER`)
- **Triggers**: Otomasi pembuatan profil baru (`handle_new_user`) dan auto-update timestamp (`set_updated_at`)

---

## 3. Arsitektur Sistem & Alur Kerja

Aplikasi dibangun dengan arsitektur SPA (*Single Page Application*) yang berkomunikasi langsung ke Supabase Client melalui layer API khusus di `@/lib/api/*`.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          REACT 19 FRONTEND                             │
│                                                                        │
│   ┌───────────────┐     ┌───────────────┐     ┌────────────────────┐   │
│   │  Auth Context │ ──> │ ProtectedRoute│ ──> │    Base Layout     │   │
│   └───────────────┘     └───────────────┘     └─────────┬──────────┘   │
│                                                         │              │
│       ┌───────────────┬────────────────┬────────────────┼──────────┐   │
│       ▼               ▼                ▼                ▼          ▼   │
│  [Dashboard]    [Inventory]      [Borrowing]     [Subscriptions] [Reminders]
│       │               │                │                │          │   │
│       └───────────────┴────────┬───────┴────────────────┴──────────┘   │
│                                ▼                                       │
│                       [API Layer @/lib/api]                            │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │ HTTPS / WebSockets
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE BACKEND                             │
│                                                                        │
│   ┌────────────────────┐   ┌───────────────────────────────────────┐   │
│   │   Supabase Auth    │   │         PostgreSQL Database           │   │
│   │  (auth.users JWT)  │   │                                       │   │
│   └─────────┬──────────┘   │  • profiles        • categories       │   │
│             │              │  • inventories     • borrowings       │   │
│             │ (Trigger)    │  • subscriptions   • reminders        │   │
│             ▼              │  • audit_logs                         │   │
│       handle_new_user()──> │                                       │   │
│                            │  Row Level Security (RLS) + Policies  │   │
│                            └───────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

### Alur Siklus Peminjaman (Borrowing Lifecycle)
```text
Staff / Admin Ajukan Pinjaman
             ↓
Status: [ Pending Approval ]
             ↓
Admin Menyetujui (Approve) ─────────> (Stok Inventaris berkurang 1, 
             ↓                         Status aset jadi 'Borrowed' jika stok 0)
Status: [ Borrowed ]
             ↓
Peminjam / Admin Mengembalikan Aset
             ↓
Konfirmasi Kondisi Fisik ───────────> (Stok Inventaris bertambah 1,
             ↓                         Status aset kembali 'Available')
Status: [ Returned ]
```

---

## 4. Peran Pengguna & Hak Akses (RBAC)

Sistem menetapkan 2 peran pengguna utama:

1. **Admin**:
   - Memiliki kontrol menyeluruh terhadap operasional sistem.
   - Menyetujui (`approve`) atau menolak (`reject`) permohonan peminjaman.
   - Membaca dan menganalisis **Audit Logs** secara lengkap.
   - Mengelola pengguna dan mengubah peran anggota (Admin ↔ Staff) di halaman Pengaturan.
   - Mengonfigurasi parameter sistem (nama organisasi, kebijakan batas peminjaman, ambang batas hari pengingat).
2. **Staff**:
   - Menjalankan aktivitas harian: melihat inventaris, mengelola aset umum, mengajukan peminjaman aset.
   - Mengelola langganan dan pengingat pribadi/umum.
   - Mengembalikan aset yang dipinjam oleh akun bersangkutan.
   - **Dibatasi**: Tidak dapat menyetujui peminjaman orang lain, tidak dapat mengakses Audit Log, dan tidak dapat mengubah hak akses pengguna.

### Matriks Akses Fitur

| Fitur / Modul | Admin | Staff | Keterangan |
| :--- | :---: | :---: | :--- |
| **Akses Dashboard** | ✅ | ✅ | Staff melihat metrik umum; Admin melihat indikator audit & approval |
| **Melihat & Mencari Inventaris** | ✅ | ✅ | Semua user terautentikasi dapat melihat katalog aset |
| **Tambah, Ubah, Hapus Inventaris** | ✅ | ✅ | Staff & Admin dapat mengelola inventaris |
| **Mengajukan Peminjaman** | ✅ | ✅ | Staff mengajukan pinjaman atas nama sendiri |
| **Approval / Reject Peminjaman** | ✅ | ❌ | **Khusus Admin** |
| **Mengembalikan Aset (Return)** | ✅ | ✅* | Staff hanya bisa mengembalikan barang miliknya; Admin bisa mengembalikan barang siapa saja |
| **Kelola Data Langganan** | ✅ | ✅ | Tambah, ubah, dan hapus tagihan langganan |
| **Kelola Pengingat (Reminders)** | ✅ | ✅ | Tambah pengingat manual, mark as completed / dismissed |
| **Melihat Audit Log** | ✅ | ❌ | **Khusus Admin** (Dibatasi di level database RLS) |
| **Manajemen Pengguna & Ganti Role** | ✅ | ❌ | **Khusus Admin** di halaman Settings |
| **Pengaturan Aturan Peminjaman & Sistem** | ✅ | ❌ | **Khusus Admin** |

---

## 5. Modul & Fitur Utama

### 5.1 Dashboard Eksekutif
- **Statistik Utama**:
  - Total Inventaris & Total Nilai Barang
  - Aset Tersedia vs Sedang Dipinjam
  - Jumlah Peminjaman yang Terlambat (*Overdue*)
  - Total Pengeluaran Langganan Bulanan (Rupiah)
  - Pengingat yang Mendekati Jatuh Tempo (*Upcoming & Due Today*)
- **Quick Action Buttons**: Akses cepat 1-klik untuk Tambah Inventaris, Ajukan Pinjaman, Catat Langganan, dan Buat Pengingat.
- **Recent Activities**: Menampilkan 5 riwayat aktivitas audit terakhir secara langsung.

### 5.2 Manajemen Inventaris (Inventories)
- **Kode Aset Unik**: Pengkodean otomatis atau manual (contoh: `INV-2024-001`).
- **Kategori Terstruktur**: Terhubung ke relasi `categories` (`Laptop`, `Monitor`, `Jaringan`, `Server`, dll.).
- **Pelacakan Stok & Lokasi**: Jumlah kuantitas fisik, kondisi barang (`Bagus`, `Rusak Ringan`, `Rusak Berat`), lokasi ruangan/rak penyimpanan, informasi supplier, serta status garansi.
- **Visualisasi Gambar**: Dukungan preview gambar aset melalui URL foto.
- **Pencarian & Filter**: Pencarian multi-kolom (nama, kode, lokasi, supplier) dan filter kategori serta status (`Available`, `Borrowed`, `Maintenance`, `Lost`, `Retired`).

### 5.3 Manajemen Peminjaman (Borrowings)
- **Form Pengajuan Modal**: Memilih aset yang berstatus tersedia, memilih tanggal jatuh tempo pengembalian (*due date*), serta catatan keperluan pinjam.
- **Penyesuaian Stok Otomatis**:
  - Saat disetujui (`status = Borrowed`), kuantitas aset dikurangi 1. Jika stok habis, status aset otomatis berubah menjadi `Borrowed`.
  - Saat dikembalikan (`status = Returned`), kuantitas aset ditambah kembali 1 dan status kembali ke `Available`.
- **Indikator Keterlambatan**: Badge visual jika tanggal sekarang telah melewati `due_date` namun belum dikembalikan.
- **Dialog Pengembalian (`ReturnConfirmDialog`)**: Memastikan pencatatan tanggal kembali riil dan verifikasi kondisi fisik akhir aset.
- **Proteksi Otorisasi**: Proteksi ganda pada frontend & backend sehingga staf biasa tidak bisa memanipulasi pengembalian aset milik staf lain.

### 5.4 Manajemen Langganan (Subscriptions)
- **Monitoring Beban Operasional**: Pelacakan software berbayar, SaaS, domain, server VPS, lisensi tools desainer, dan koneksi internet.
- **Siklus Pembayaran Fleksibel**: Mendukung siklus `Monthly`, `Quarterly`, `Semi-Annually`, `Yearly`, hingga `Custom`.
- **Perhitungan Estimasi Biaya**: Menghitung konversi pengeluaran per bulan secara otomatis dalam mata uang IDR.
- **Pelacakan Jatuh Tempo**: Kolom `next_billing_date` untuk menghindari pemutusan layanan mendadak.

### 5.5 Sistem Pengingat Cerdas (Reminders)
- **Multi-Source Reminders**:
  - Pengingat manual umum.
  - Pengingat garansi inventaris.
  - Pengingat pengembalian aset peminjaman.
  - Pengingat perpanjangan tagihan langganan.
- **Tingkat Prioritas**: `Tinggi` (Merah), `Sedang` (Kuning), `Rendah` (Hijau).
- **Status Siklus**: `Upcoming` ➔ `Due Today` ➔ `Overdue` ➔ `Completed` / `Dismissed`.
- **Quick Action Status**: Pengguna dapat mengubah status menjadi Selesai atau Abaikan dengan 1 klik dari tabel.

### 5.6 Audit Log & Jejak Aktivitas (Audit Logs)
- **Otomatis & Komprehensif**: Setiap mutasi data (CREATE, UPDATE, DELETE, APPROVE, RETURN) dicatat melalui `recordAuditLog()`.
- **Informasi yang Ditangkap**:
  - Pengguna pelaku (ID, Nama Lengkap, Email, Avatar).
  - Aksi (`CREATE_INVENTORY`, `APPROVE_BORROWING`, `RETURN_ASSET`, `DELETE_ITEM`, dll.).
  - Tipe Entitas (`inventory`, `borrowing`, `subscription`, `category`, `user_role`).
  - Metadata payload JSON (perubahan nilai sebelum dan sesudah).
  - Waktu persis kejadian (timestamp UTC/WIB).
- **Modal Detail JSON Viewer**: Dialog interaktif untuk menelaah payload JSON secara terstruktur dan rapi.

### 5.7 Pengaturan Sistem (Settings)
- **Profil Perusahaan / Organisasi**: Pengaturan nama institusi, alamat kantor, email resmi, dan tautan logo instansi.
- **Aturan Peminjaman**: Konfigurasi batas maksimal peminjaman per user, durasi standar hari pinjam, masa toleransi (*grace period*), dan opsi persetujuan manual wajib.
- **Ambang Batas Pengingat**: Penentuan jarak hari (*lead time days*) untuk peringatan sebelum garansi habis, sebelum peminjaman jatuh tempo, dan sebelum perpanjangan langganan.
- **Saluran Notifikasi**: Konfigurasi integrasi notifikasi In-App, template SMTP Email, dan webhook bot pesan instan.
- **Manajemen Kategori**: CRUD kategori aset & layanan secara terpusat.
- **Manajemen Pengguna (Admin Only)**: Meninjau daftar akun terdaftar dan menaikkan/menurunkan peran antara `Admin` dan `Staff`.

---

## 6. Struktur Direktori Proyek

```text
Reminder/
├── .env.example                 # Contoh variabel lingkungan Supabase
├── components.json              # Konfigurasi instalasi komponen UI
├── index.html                   # HTML Entry point aplikasi
├── package.json                 # Daftar dependensi dan script npm
├── postcss.config.js            # Konfigurasi PostCSS
├── tailwind.config.js           # Konfigurasi tema dan warna Tailwind CSS
├── tsconfig.json                # Konfigurasi TypeScript root
├── vite.config.ts               # Konfigurasi Vite bundler & path alias (@/*)
│
├── public/                      # File statis publik (favicon, svg assets)
│
├── supabase/                    # Konfigurasi & Migrasi Supabase
│   └── migrations/
│       ├── 20240826100100_create_profiles.sql        # Tabel profiles & trigger updated_at
│       ├── 20240826100200_create_categories.sql      # Tabel categories & initial seed
│       ├── 20240826100300_create_inventories.sql     # Tabel inventories & RLS
│       ├── 20240826100400_create_borrowings.sql      # Tabel borrowings & RLS
│       ├── 20240826100500_create_subscriptions.sql   # Tabel subscriptions & RLS
│       ├── 20240826100600_create_reminders.sql       # Tabel reminders & RLS
│       ├── 20240826100700_create_audit_logs.sql      # Tabel audit_logs & RLS
│       └── 20240826100800_auth_rbac_triggers.sql     # Auth triggers & is_admin() function
│
└── src/                         # Kode Sumber Aplikasi
    ├── App.tsx                  # Routing utama & Provider Setup
    ├── main.tsx                 # Inisialisasi React DOM
    ├── index.css                # Global styles & variabel tema
    │
    ├── components/              # Komponen UI Reusable
    │   ├── auth/                # Guard rute (ProtectedRoute.tsx)
    │   ├── layout/              # Layout shell utama (BaseLayout.tsx - Sidebar & Header)
    │   ├── modals/              # Dialog Modal Interaktif
    │   │   ├── AuditDetailModal.tsx
    │   │   ├── BorrowingModal.tsx
    │   │   ├── CategoryModal.tsx
    │   │   ├── DeleteConfirmDialog.tsx
    │   │   ├── InventoryModal.tsx
    │   │   ├── ReminderModal.tsx
    │   │   ├── ReturnConfirmDialog.tsx
    │   │   └── SubscriptionModal.tsx
    │   └── ui/                  # Atomik UI (Button, Card, Input, Table, Badge, dll.)
    │
    ├── context/                 # State Context Global
    │   └── AuthContext.tsx      # Auth State, Login, Register, Logout, Profile Fetcher
    │
    ├── hooks/                   # Custom React Hooks
    │   └── useAuth.ts           # Hook konsumsi sesi autentikasi
    │
    ├── lib/                     # Utilitas & Integrasi Layanan
    │   ├── formatters.ts        # Formatter tanggal Indonesia & Rupiah
    │   ├── supabase.ts          # Inisialisasi client Supabase
    │   ├── utils.ts             # Helper cn() merge classnames
    │   └── api/                 # Data Access Object (DAO) ke Supabase
    │       ├── auditLogs.ts     # Query log audit & pencatatan aktivitas
    │       ├── borrowings.ts    # Siklus pinjam, approve, return, koreksi stok
    │       ├── categories.ts    # CRUD data kategori
    │       ├── dashboard.ts     # Agregasi metrik & ringkasan dashboard
    │       ├── inventories.ts   # CRUD aset fisik & validasi
    │       ├── profiles.ts      # Fetch profile & perubahan role user
    │       ├── reminders.ts     # CRUD pengingat & update status
    │       └── subscriptions.ts # CRUD langganan & perpanjangan
    │
    ├── pages/                   # Halaman Tampilan (Views)
    │   ├── AuditLogs.tsx        # Halaman jejak audit aktivitas (Admin only)
    │   ├── Borrowing.tsx        # Halaman pelacakan peminjaman barang
    │   ├── Dashboard.tsx        # Halaman ringkasan eksekutif
    │   ├── Inventory.tsx        # Halaman daftar & katalog aset
    │   ├── Login.tsx            # Halaman masuk sistem
    │   ├── Register.tsx         # Halaman pendaftaran pengguna baru
    │   ├── Reminders.tsx        # Halaman pengelolaan pengingat jadwal
    │   ├── Settings.tsx         # Halaman konfigurasi sistem & manajemen user
    │   └── Subscriptions.tsx    # Halaman manajemen biaya langganan
    │
    └── types/                   # Definisi Type & Interface TypeScript
        ├── auth.ts              # Interface UserProfile, UserRole, AuthContext
        └── database.ts          # Interface Tabel, Payload DTO, dan Enums
```

---

## 7. Skema Basis Data & Keamanan (Supabase PostgreSQL)

### Tabel & Relasi

```sql
-- 1. PROFILES (Extends auth.users)
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES
categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'inventory' | 'subscription' | 'general'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INVENTORIES
inventories (
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

-- 4. BORROWINGS
borrowings (
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

-- 5. SUBSCRIPTIONS
subscriptions (
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

-- 6. REMINDERS
reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual', -- 'inventory' | 'borrowing' | 'subscription' | 'maintenance' | 'manual'
  source_id UUID,
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Sedang', -- 'Tinggi' | 'Sedang' | 'Rendah'
  status reminder_status NOT NULL DEFAULT 'Upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. AUDIT_LOGS
audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Enum Types

| Tipe Enum | Nilai yang Didukung |
| :--- | :--- |
| `user_role` | `'admin'`, `'staff'` |
| `inventory_status` | `'Available'`, `'Borrowed'`, `'Maintenance'`, `'Lost'`, `'Retired'` |
| `borrowing_status` | `'Pending Approval'`, `'Approved'`, `'Borrowed'`, `'Returned'`, `'Rejected'` |
| `billing_cycle` | `'Monthly'`, `'Quarterly'`, `'Semi-Annually'`, `'Yearly'`, `'Custom'` |
| `subscription_status`| `'Active'`, `'Cancelled'`, `'Expired'`, `'Past Due'` |
| `reminder_status` | `'Upcoming'`, `'Due Today'`, `'Overdue'`, `'Completed'`, `'Dismissed'` |

### Database Triggers & Functions

1. **Auto Timestamp Trigger (`set_updated_at`)**:
   Fungsi trigger yang secara otomatis menyetel `updated_at = NOW()` setiap kali ada baris data yang mengalami update di tabel mana pun.
2. **Sinkronisasi Pengguna (`handle_new_user`)**:
   Trigger `on_auth_user_created` yang dieksekusi setelah baris baru masuk ke `auth.users`. Fungsi ini membuat baris baru di `public.profiles` dengan nama, email, dan peran awal (`staff` secara default atau sesuai metadata registrasi).
3. **Pemeriksaan Hak Admin (`is_admin`)**:
   Fungsi pembantu `SECURITY DEFINER` yang mengembalikan nilai boolean apakah user yang sedang login (`auth.uid()`) memiliki role `admin`.

### Row Level Security (RLS)
- **Tabel Profiles**: Semua user yang terautentikasi dapat melihat daftar profil. User hanya dapat memperbarui profilnya sendiri, sedangkan Admin memiliki hak untuk memperbarui semua profil (termasuk mengganti role).
- **Tabel Audit Logs**: Hanya pengguna dengan peran `admin` (`public.is_admin() = true`) yang diizinkan melakukan query `SELECT` pada tabel ini.
- **Tabel Inventories, Borrowings, Subscriptions, Reminders**: Dilindungi agar hanya request dengan JWT terautentikasi (`authenticated`) yang dapat melakukan operasi data.

---

## 8. Panduan Instalasi & Menjalankan Aplikasi

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru)
- npm (versi 9 atau lebih baru)
- Proyek [Supabase](https://supabase.com/) aktif

### Setup Environment
1. Kloning repositori proyek atau buka folder direktori proyek:
   ```bash
   cd Reminder
   ```
2. Pasang semua dependensi proyek:
   ```bash
   npm install
   ```
3. Salin file environment contoh:
   ```bash
   cp .env.example .env
   ```
4. Buka file `.env` dan masukkan kredensial proyek Supabase Anda:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

### Menjalankan Migrasi Database
Jalankan file SQL yang terdapat di folder `supabase/migrations/` secara berurutan pada menu **SQL Editor** di dashboard Supabase Anda:
1. `20240826100100_create_profiles.sql`
2. `20240826100200_create_categories.sql`
3. `20240826100300_create_inventories.sql`
4. `20240826100400_create_borrowings.sql`
5. `20240826100500_create_subscriptions.sql`
6. `20240826100600_create_reminders.sql`
7. `20240826100700_create_audit_logs.sql`
8. `20240826100800_auth_rbac_triggers.sql`

*(Atau gunakan Supabase CLI jika telah terpasang: `supabase db push`)*

### Menjalankan Server Lokal
Jalankan dev server menggunakan Vite:
```bash
npm run dev
```
Aplikasi secara default dapat diakses melalui browser pada alamat:
`http://localhost:5173` (atau port yang ditunjuk terminal).

### Build Produksi
Untuk memeriksa tipe data dan membuat bundle produksi teroptimasi:
```bash
npm run build
```
Untuk menguji hasil build secara lokal sebelum deployment:
```bash
npm run preview
```

Untuk linting kode menggunakan Oxlint:
```bash
npm run lint
```

---

## 9. Roadmap & Pengembangan Mendatang

Aplikasi ini dirancang modular sehingga mudah diperluas di masa mendatang:

- [x] **Fondasi & Autentikasi RBAC**: Supabase Auth, 2 Peran (`admin` & `staff`), Protected Routes.
- [x] **Manajemen Inventaris**: CRUD Aset, kategori, kondisi, lokasi, foto, status ketersediaan.
- [x] **Manajemen Peminjaman**: Permohonan peminjaman, approval admin, pengembalian barang, otomatisasi penambahan/pengurangan stok.
- [x] **Manajemen Langganan**: Monitoring tagihan SaaS/Cloud, siklus pembayaran, estimasi biaya bulanan.
- [x] **Sistem Pengingat**: Multi-source reminders, prioritas, status pengingat interaktif.
- [x] **Dashboard Analitik**: Metrik kartu utama, ringkasan aktivitas, tombol pintas cepat.
- [x] **Audit Trail**: Pencatatan aktivitas ke tabel `audit_logs` dan inspeksi detail JSON.
- [x] **Pengaturan Terpusat**: Aturan peminjaman, profil organisasi, manajemen peran user, lead-time pengingat.
- [ ] **Notifikasi Eksternal**: Integrasi pengiriman notifikasi otomatis ke Bot Telegram & Email via Supabase Edge Functions / Resend.
- [ ] **Laporan & Ekspor Data**: Fitur ekspor laporan aset dan peminjaman ke format PDF dan Excel (.xlsx).
- [ ] **Barcode & QR Code Scanner**: Pembuatan label QR Code otomatis untuk setiap aset dan pemindaian cepat menggunakan kamera perangkat.
