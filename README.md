# INV.HUB (Stockly) – Sistem Manajemen Inventaris, Peminjaman & Layanan Terpadu

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-FF4154?style=flat-square&logo=react-query&logoColor=white)

**INV.HUB (Stockly)** adalah aplikasi web modern, terpadu, dan responsif yang dirancang untuk mengelola inventaris aset fisik perusahaan, alur permohonan peminjaman barang, pemantauan biaya langganan software/SaaS, serta penjadwalan agenda operasional berbasis **Role-Based Access Control (RBAC)** dengan keamanan setingkat basis data (*Row Level Security* & *Atomic Transactions*).

---

## 🚀 Fitur Utama

### 1. 📦 Manajemen Inventaris Aset Fisik
- **Katalog Multi-View**: Pilihan tampilan antara **Grid Card (Bento Style)** dan **Tabel Rinci** dengan switch dinamis.
- **Identifikasi Lengkap**: Mendukung pencatatan kode SKU/serial number, nama aset, kategori dinamis, spesifikasi, lokasi penempatan, dan status ketersediaan (*Tersedia*, *Dipinjam*, *Perbaikan*, *Hilang*).
- **Upload Foto Aset**: Terintegrasi langsung dengan Supabase Storage (`inventory-photos`) dengan kompresi dan preview real-time.
- **Pencarian & Penyaringan Instan**: Filter berdasarkan kategori, status stok, serta pengurutan berdasarkan nama dan kuantitas barang.
- **Aksi Cepat**: Tombol *Lihat Detail*, *Edit*, *Hapus*, dan tombol langsung *Pinjam Barang*.

### 2. 🔄 Alur Peminjaman & Pengembalian Aset (Borrowing Workflow)
- **Pengajuan Mandiri (Self-Service)**: Pengguna dapat mengajukan peminjaman langsung dari katalog aset dengan form otomatis terisi (*pre-selected item*).
- **Transaksi Atomik (Anti-Race Condition)**: Persetujuan peminjaman menggunakan Stored Procedure / RPC PostgreSQL (`rpc_approve_borrowing`) dengan baris terkunci (`FOR UPDATE`) untuk menjamin stok fisik tidak mengalami inkonsistensi saat banyak permohonan masuk bersamaan.
- **Verifikasi Pengembalian**: Pencatatan tanggal kembali riil, pengecekan kondisi barang pasca-pakai, dan pemulihan stok unit secara otomatis.
- **Peringatan Keterlambatan (Overdue Alerts)**: Deteksi otomatis peminjaman yang melewati batas tempo pengembalian.

### 3. 💳 Pelacakan Langganan & Lisensi (SaaS Subscriptions)
- **Sentralisasi Biaya Operasional**: Pemantauan seluruh tagihan perangkat lunak, hosting, cloud, dan lisensi kerja tim.
- **Siklus Pembayaran**: Mendukung siklus bulanan (*Monthly*), tahunan (*Yearly*), dan triwulanan (*Quarterly*).
- **Kalkulasi Otomatis Beban Bulanan**: Perhitungan otomatis estimasi total beban langganan bulanan (*Monthly Burn Rate*).
- **Pengingat Jatuh Tempo**: Pemantauan tanggal perpanjangan berikutnya (*Next billing date*) untuk mencegah terputusnya layanan.

### 4. ⏰ Agenda & Pengingat Operasional (Reminders)
- **Jadwal Pemeliharaan & Audit**: Pembuatan agenda inspeksi barang, perpanjangan garansi, atau tugas inventaris berkala.
- **Level Prioritas**: Kategorisasi tingkat urgensi (*Tinggi*, *Sedang*, *Rendah*) dengan penanda warna visual.
- **Filter Status**: Pengelompokan pengingat aktif, jatuh tempo segera, maupun yang telah selesai dituntaskan.

### 5. 📊 Dashboard Cerdas & Responsif
- **Kartu Metrik KPI Ringkas**: Tampilan metrik kunci (Total Aset, Peminjaman Aktif, Beban Langganan, Pengingat) yang kompak dalam grid 2x2 di ponsel dan 4 kolom di desktop.
- **Banner Peringatan Darurat**: Peringatan instan jika ada peminjaman jatuh tempo atau permohonan baru yang membutuhkan tindakan segera.
- **Log Terkini**: Ringkasan riwayat peminjaman terbaru dan agenda penting mendatang.

### 6. 🛡️ Role-Based Access Control (RBAC) & Keamanan
- **Tingkat Akses Terpisah**:
  - **Admin**: Akses menyeluruh ke Dashboard, Manajemen Inventaris, Persetujuan Peminjaman, Pengaturan Sistem, Pengelolaan Kategori, dan Audit Logs.
  - **Staff / User**: Antarmuka fokus khusus katalog inventaris, riwayat peminjaman mandiri, dan profil akun.
- **Tata Letak Adaptif**:
  - `BaseLayout`: Desain navigasi bento modern khusus Administrator.
  - `UserLayout`: Desain navigasi minimalis, bersih, dan intuitif untuk Pengguna.
- **Row Level Security (RLS)**: Validasi hak baca/tulis/hapus langsung ditegakkan pada tingkat basis data Supabase.
- **Pengaturan Sistem Terpusat (`system_settings`)**: Kebijakan durasi peminjaman, ambang batas pengingat, dan identitas instansi disimpan di cloud database.

### 7. 📱 Optimalisasi Mobile-First
- Dirancang khusus agar nyaman digunakan pada layar smartphone (360px – 480px).
- Penataan aksi simetris, penghindaran *overflow horizontal*, tombol berukuran *touch-friendly*, serta dialog modal dengan footer yang mudah dijangkau ibu jari (*thumb-friendly*).

---

## 🛠️ Tech Stack

| Lapisan | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | Arsitektur komponen reaktif dengan pengetikan ketat |
| **Build Tool** | Vite 8 | Development server super cepat & optimized production bundling |
| **Styling** | Tailwind CSS v3 + CSS Variables | Desain modern berstandar Stockly dengan dukungan Dark/Light mode |
| **UI Components** | shadcn/ui + Base UI | Komponen aksesibel, modular, dan terstandardisasi |
| **Icons** | Lucide React | Ikon modern, konsisten, dan ringan |
| **Data Fetching** | TanStack Query v5 (React Query) | Cache manajemen, background refetching, dan sync data otomatis |
| **Form & Validasi** | React Hook Form + Zod | Validasi skema tipe-aman pada formulir modal |
| **Backend & DB** | Supabase (PostgreSQL) | Database relasional, Auth, Storage, Stored Procedures & RLS |

---

## 📁 Struktur Direktori

```text
Reminder/
├── public/                     # Aset statis & favicon
├── src/
│   ├── components/
│   │   ├── auth/               # Komponen proteksi rute & redirect RBAC
│   │   ├── inventory/          # Kartu aset, filter bar, badge status
│   │   ├── layout/             # AppLayout, BaseLayout (Admin), UserLayout (User)
│   │   ├── modals/             # Modal Peminjaman, Inventaris, Pengingat, Langganan
│   │   └── ui/                 # Primitif UI (Button, Card, Badge, Dialog, Form, dll)
│   ├── context/
│   │   └── AuthContext.tsx     # Context state sesi autentikasi & profile role
│   ├── hooks/
│   │   ├── useAuth.ts          # Hook akses status user & role
│   │   └── useDebounce.ts      # Utility debounce pencarian
│   ├── lib/
│   │   ├── api/                # Layanan query database Supabase per modul
│   │   │   ├── borrowings.ts   # Logika peminjaman & panggilan RPC atomik
│   │   │   ├── dashboard.ts    # Agregasi data ringkasan KPI
│   │   │   ├── inventories.ts  # CRUD inventaris & upload foto aset
│   │   │   ├── reminders.ts    # CRUD pengingat
│   │   │   ├── settings.ts     # Pengaturan sistem terpusat
│   │   │   └── subscriptions.ts# CRUD langganan software
│   │   ├── formatters.ts       # Formatter mata uang Rupiah & format tanggal Indonesia
│   │   ├── supabase.ts         # Inisialisasi client Supabase
│   │   └── utils.ts            # Utility Tailwind merge (cn)
│   ├── pages/                  # Halaman utama aplikasi (Dashboard, Inventory, dll)
│   ├── App.tsx                 # Konfigurasi router aplikasi
│   ├── main.tsx                # Entry point utama aplikasi
│   └── index.css               # Desain tokens, tema warna, & animasi
├── supabase/
│   └── migrations/             # Skrip SQL DDL, RLS, Storage Bucket, & Triggers
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ⚡ Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
- [Node.js](https://nodejs.org/) versi 18 ke atas.
- Akun proyek [Supabase](https://supabase.com/).

### 2. Kloning Repositori
```bash
git clone https://github.com/aaidilakbarr/Mini_Inventary.git
cd Mini_Inventary
```

### 3. Konfigurasi Environment Variable
Buat file `.env` di direktori utama proyek:
```env
VITE_SUPABASE_URL=https://proyek-anda.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Setup Basis Data Supabase
Jalankan skrip migrasi SQL yang berada di direktori `supabase/migrations/` secara berurutan melalui **SQL Editor** pada Supabase Dashboard Anda:
1. `20240826100100_create_profiles.sql` *(Tabel profil & peran)*
2. `20240826100200_create_categories.sql` *(Kategori inventaris)*
3. `20240826100300_create_inventories.sql` *(Tabel aset inventaris)*
4. `20240826100400_create_borrowings.sql` *(Tabel permohonan peminjaman)*
5. `20240826100500_create_subscriptions.sql` *(Tabel langganan layanan)*
6. `20240826100600_create_reminders.sql` *(Tabel pengingat)*
7. `20240826100700_create_audit_logs.sql` *(Tabel audit trail)*
8. `20240826100800_auth_rbac_triggers.sql` *(Trigger pembuatan akun & RBAC)*
9. `20240826100900_add_return_verification.sql` *(Verifikasi pengembalian)*
10. `20240826101000_create_system_settings.sql` *(Pengaturan sistem terpusat)*
11. `20240826101100_atomic_borrowing_and_security_hardening.sql` *(RPC Transaksi atomik & pengetatan RLS)*
12. `20240826101200_add_inventory_photo_and_storage.sql` *(Storage bucket untuk foto aset)*

### 5. Instal Dependensi & Jalankan Development Server
```bash
# Instal seluruh paket dependensi
npm install

# Jalankan development server lokal
npm run dev
```
Aplikasi akan aktif dan dapat diakses melalui peramban di `http://localhost:5173`.

---

## 🧪 Validasi & Build Produksi

```bash
# Pengecekan tipe data TypeScript tanpa emit file
npx tsc --noEmit

# Linting kode
npm run lint

# Kompilasi paket rilis produksi
npm run build
```

---

## 📄 Lisensi
Proyek ini dikembangkan secara internal untuk keperluan pemantauan dan pengelolaan operasional inventaris, peminjaman barang, dan langganan perusahaan.
