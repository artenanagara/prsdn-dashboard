# Supabase Setup Guide

Panduan lengkap untuk setup database Supabase untuk PRSDN Dashboard.

## 📋 Prasyarat

- Akun Supabase (gratis di [supabase.com](https://supabase.com))
- Node.js dan npm terinstall
- Git (opsional)

## 🚀 Langkah 1: Buat Project Supabase

1. **Buka [Supabase Dashboard](https://app.supabase.com)**
2. **Klik "New Project"**
3. **Isi detail project:**
   - Name: `prsdn-dashboard` (atau nama lain)
   - Database Password: Buat password yang kuat (simpan dengan aman!)
   - Region: Pilih yang terdekat (Singapore untuk Indonesia)
4. **Klik "Create new project"**
5. **Tunggu beberapa menit** sampai project selesai dibuat

## 🔑 Langkah 2: Dapatkan Credentials

1. **Di Supabase Dashboard, buka project Anda**
2. **Klik Settings (⚙️) di sidebar**
3. **Klik "API" di menu Settings**
4. **Copy credentials berikut:**
   - **Project URL** (contoh: `https://xxxxx.supabase.co`)
   - **anon/public key** (key yang panjang, bukan service_role key!)

## 📝 Langkah 3: Setup Environment Variables

1. **Copy file `.env.example` menjadi `.env`:**
   ```bash
   cp .env.example .env
   ```

2. **Edit file `.env` dan isi dengan credentials Anda:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Simpan file `.env`**

> **⚠️ PENTING:** Jangan commit file `.env` ke Git! File ini sudah ada di `.gitignore`.

## 🗄️ Langkah 4: Jalankan Database Migrations

Ada 2 cara untuk menjalankan migrations:

### Cara 1: Menggunakan Supabase Dashboard (Recommended)

1. **Buka Supabase Dashboard → SQL Editor**
2. **Jalankan migrations satu per satu dalam urutan:**

   **Migration 1: Create Tables**
   - Copy seluruh isi file `supabase/migrations/01_create_tables.sql`
   - Paste di SQL Editor
   - Klik "Run"
   - Tunggu sampai selesai (✓ Success)

   **Migration 2: Create RLS Policies**
   - Copy seluruh isi file `supabase/migrations/02_create_rls_policies.sql`
   - Paste di SQL Editor
   - Klik "Run"
   - Tunggu sampai selesai (✓ Success)

   **Migration 3: Create Functions**
   - Copy seluruh isi file `supabase/migrations/03_create_functions.sql`
   - Paste di SQL Editor
   - Klik "Run"
   - Tunggu sampai selesai (✓ Success)

   **Migration 4: Seed Data**
   - Copy seluruh isi file `supabase/migrations/04_seed_data.sql`
   - Paste di SQL Editor
   - Klik "Run"
   - Tunggu sampai selesai (✓ Success)

3. **Verifikasi:**
   - Buka "Table Editor" di sidebar
   - Anda harus melihat 9 tabel: `members`, `user_accounts`, `account_applications`, dll.
   - Klik tabel `members` → harus ada 15 data member

### Cara 2: Menggunakan Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login ke Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## ✅ Langkah 5: Verifikasi Setup

1. **Cek Tables:**
   - Buka Supabase Dashboard → Table Editor
   - Pastikan 9 tabel sudah dibuat
   - Cek ada data di tabel `members` (15 members)

2. **Cek RLS Policies:**
   - Buka tabel manapun → klik "..." → "View Policies"
   - Pastikan ada policies untuk Admin dan User

3. **Test Connection:**
   ```bash
   npm run dev
   ```
   - Buka browser ke `http://localhost:5173`
   - Cek browser console, tidak boleh ada error Supabase
   - Coba login dengan:
     - Username: `admin`
     - Password: `admin123`

## 🔐 Akun Demo

Setelah seed data dijalankan, Anda bisa login dengan:

### Admin Account
- **Username:** `admin`
- **Password:** `admin123`

### User Account
- **Username:** `ahmadf`
- **Password:** `password123`

> **⚠️ PENTING:** Untuk production, ganti password admin dan hapus/ubah seed data!

## 📊 Struktur Database

Database terdiri dari 9 tabel utama:

1. **members** - Data profil anggota
2. **user_accounts** - Akun login (admin & user)
3. **account_applications** - Pendaftaran anggota baru
4. **attendance_records** - Rekap kehadiran bulanan
5. **finance_transactions** - Transaksi keuangan (pemasukan & pengeluaran)
6. **kas_payments** - Iuran kas bulanan
7. **events** - Kalender acara & ulang tahun
8. **attendance_events** - Event absensi dengan token
9. **attendance_checkins** - Data check-in ke event

## 🔒 Row Level Security (RLS)

Semua tabel dilindungi dengan RLS policies:

- **Admin:** Full access ke semua data
- **User:** Read access ke sebagian besar data, write access ke data sendiri
- **Public:** Hanya bisa create account applications

## 🛠️ Troubleshooting

### Error: "Missing Supabase environment variables"
- Pastikan file `.env` sudah dibuat
- Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sudah diisi
- Restart dev server: `npm run dev`

### Error: "Invalid API key"
- Pastikan menggunakan `anon` key, bukan `service_role` key
- Copy ulang key dari Supabase Dashboard → Settings → API

### Error: "relation does not exist"
- Migrations belum dijalankan
- Jalankan ulang migrations di SQL Editor

### Tidak bisa login
- Pastikan seed data sudah dijalankan
- Cek tabel `user_accounts` ada data admin
- Cek browser console untuk error detail

### RLS Policy Error
- Pastikan migration 02 (RLS policies) sudah dijalankan
- Cek di Table Editor → View Policies

## 📚 Dokumentasi Tambahan

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🔄 Reset Database

Jika ingin reset database ke kondisi awal:

1. **Buka Supabase Dashboard → SQL Editor**
2. **Jalankan query berikut:**
   ```sql
   -- Drop all tables (hati-hati!)
   DROP TABLE IF EXISTS attendance_checkins CASCADE;
   DROP TABLE IF EXISTS attendance_events CASCADE;
   DROP TABLE IF EXISTS events CASCADE;
   DROP TABLE IF EXISTS kas_payments CASCADE;
   DROP TABLE IF EXISTS finance_transactions CASCADE;
   DROP TABLE IF EXISTS attendance_records CASCADE;
   DROP TABLE IF EXISTS user_accounts CASCADE;
   DROP TABLE IF EXISTS account_applications CASCADE;
   DROP TABLE IF EXISTS members CASCADE;
   
   -- Drop functions
   DROP FUNCTION IF EXISTS get_user_role CASCADE;
   DROP FUNCTION IF EXISTS get_user_member_id CASCADE;
   DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
   DROP FUNCTION IF EXISTS generate_token CASCADE;
   DROP FUNCTION IF EXISTS get_member_stats_by_rt CASCADE;
   DROP FUNCTION IF EXISTS get_finance_summary_by_month CASCADE;
   DROP FUNCTION IF EXISTS get_kas_summary_by_month CASCADE;
   DROP FUNCTION IF EXISTS initialize_kas_payments_for_month CASCADE;
   ```

3. **Jalankan ulang semua migrations dari awal**

## 🚀 Next Steps

Setelah setup selesai:

1. ✅ Update stores untuk menggunakan Supabase (lihat implementation plan)
2. ✅ Test semua fitur aplikasi
3. ✅ Deploy aplikasi ke production
4. ✅ Ganti password admin
5. ✅ Setup backup database

---

**Butuh bantuan?** Buka issue di repository atau hubungi tim development.
