# INV.HUB

Sistem manajemen inventaris aset, peminjaman barang, dan pengingat operasional yang modern, cepat, dan responsif.

<p align="left">
  <img src="https://img.shields.io/badge/React-18181b?style=flat&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-18181b?style=flat&logo=typescript&logoColor=3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-18181b?style=flat&logo=vite&logoColor=646CFF" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-18181b?style=flat&logo=tailwindcss&logoColor=38B2AC" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Supabase-18181b?style=flat&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
</p>

---

## ⚡ Fitur Utama

- **📦 Manajemen Aset**: Katalog barang dengan mode grid/tabel, pelacakan stok real-time, dan upload foto aset.
- **🔄 Peminjaman & Pengembalian**: Alur permohonan mandiri, persetujuan admin, dan verifikasi pengembalian dengan transaksi aman.
- **💳 Pelacakan Langganan**: Monitoring tagihan layanan/SaaS dan estimasi beban bulanan (*monthly burn rate*).
- **⏰ Pengingat Operasional**: Penjadwalan pemeliharaan berkala dan agenda penting dengan indikator prioritas.
- **🛡️ Role-Based Access Control**: Hak akses terpisah untuk Admin dan Pengguna, dilindungi Row Level Security (RLS).
- **📱 Responsif & Ringan**: Tampilan optimal untuk perangkat mobile maupun desktop.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Lucide Icons
- **State & Data Fetching**: TanStack Query v5, React Hook Form, Zod
- **Backend & Database**: Supabase (PostgreSQL, Auth, Storage, Stored Procedures, RLS)

---

## 🚀 Memulai Cepat

### 1. Kloning & Install

```bash
git clone https://github.com/aaidilakbarr/Mini_Inventary.git
cd Mini_Inventary
npm install
```

### 2. Konfigurasi Environment

Buat file `.env` di root direktori:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Database

Jalankan skrip migrasi SQL di folder `supabase/migrations/` pada **SQL Editor** Supabase.

### 4. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:5173](http://localhost:5173) di browser.

---

## 📜 Perintah Tersedia

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan local development server |
| `npm run build` | Menjalankan type-check dan build produksi |
| `npm run lint` | Menjalankan linter untuk memeriksa kode |
| `npm run preview` | Meninjau hasil build produksi secara lokal |

---

## 📖 Dokumentasi Terkait

- [Documentation.md](Documentation.md) – Arsitektur lengkap, skema basis data, dan alur sistem.
- [Design.md](Design.md) – Panduan desain UI/UX dan token komponen.
