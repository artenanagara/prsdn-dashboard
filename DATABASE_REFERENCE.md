# Quick Reference - Supabase Database

Referensi cepat untuk database PRSDN Dashboard.

## 📊 Database Tables

### 1. members
Menyimpan data profil anggota organisasi.

**Kolom utama:**
- `id` (UUID) - Primary key
- `full_name` (VARCHAR) - Nama lengkap
- `birth_place`, `birth_date` - Tempat & tanggal lahir
- `rt` (ENUM) - RT 01, 02, 03, atau 04
- `phone`, `instagram` - Kontak
- `job` - Pekerjaan
- `education_status`, `education_level` - Status pendidikan

**RLS:** Admin full access, User read all + update own profile

---

### 2. user_accounts
Akun login untuk admin dan user.

**Kolom utama:**
- `id` (UUID) - Primary key
- `member_id` (UUID) - FK ke members (NULL untuk admin)
- `username`, `password` - Credentials
- `role` (ENUM) - 'admin' atau 'user'
- `status` (ENUM) - 'active' atau 'inactive'

**RLS:** Admin full access, User read own account

---

### 3. account_applications
Pendaftaran anggota baru (pending approval).

**Kolom utama:**
- Semua field dari members
- `username`, `password` - Untuk akun
- `status` (ENUM) - 'pending', 'approved', 'rejected'
- `reviewed_at`, `reviewed_by_admin_id` - Audit trail

**RLS:** Public can create, Admin full access, User read own

---

### 4. attendance_records
Rekap kehadiran bulanan.

**Kolom utama:**
- `date` (DATE) - Tanggal pertemuan
- `month_key` (VARCHAR) - Format: YYYY-MM
- `attendee_member_ids` (UUID[]) - Array member IDs yang hadir

**RLS:** Admin full access, User read all

---

### 5. finance_transactions
Transaksi keuangan (pemasukan & pengeluaran).

**Kolom utama:**
- `type` (ENUM) - 'income' atau 'expense'
- `category` (VARCHAR) - Kategori transaksi
- `title` (VARCHAR) - Judul transaksi
- `amount` (DECIMAL) - Jumlah uang
- `date` (DATE) - Tanggal transaksi
- `note` (TEXT) - Catatan opsional

**RLS:** Admin full access, User read all

---

### 6. kas_payments
Iuran kas bulanan per anggota.

**Kolom utama:**
- `month_key` (VARCHAR) - Format: YYYY-MM
- `year` (INTEGER) - Tahun
- `member_id` (UUID) - FK ke members
- `amount` (DECIMAL) - Jumlah iuran
- `paid_at` (DATE) - Tanggal bayar (NULL jika unpaid)
- `status` (ENUM) - 'paid' atau 'unpaid'

**Unique constraint:** (month_key, member_id)
**RLS:** Admin full access, User read own payments

---

### 7. events
Kalender acara, program, dan ulang tahun.

**Kolom utama:**
- `title` (VARCHAR) - Nama acara
- `date` (DATE) - Tanggal acara
- `type` (ENUM) - 'event', 'program', 'birthday'
- `description` (TEXT) - Deskripsi opsional

**RLS:** Admin full access, User read all

---

### 8. attendance_events
Event absensi dengan token 30-detik.

**Kolom utama:**
- `title`, `description` - Info event
- `date`, `start_time`, `end_time` - Waktu event
- `is_active` (BOOLEAN) - Status aktif
- `token` (VARCHAR) - Token 6 karakter
- `token_expires_at` (BIGINT) - Expiry timestamp (ms)
- `created_by_admin_id` (UUID) - FK ke user_accounts

**RLS:** Admin full access, User read all

---

### 9. attendance_checkins
Data check-in ke attendance events.

**Kolom utama:**
- `event_id` (UUID) - FK ke attendance_events
- `member_id` (UUID) - FK ke members
- `checked_in_at` (BIGINT) - Timestamp check-in (ms)
- `token_used` (VARCHAR) - Token yang digunakan

**Unique constraint:** (event_id, member_id)
**RLS:** Admin full access, User read all + create own

---

## 🔧 Database Functions

### 1. get_user_role()
Returns current user's role ('admin' or 'user').
```sql
SELECT get_user_role();
```

### 2. get_user_member_id()
Returns current user's member_id.
```sql
SELECT get_user_member_id();
```

### 3. generate_token(length)
Generate random alphanumeric token.
```sql
SELECT generate_token(6); -- Returns: 'A3X9K2'
```

### 4. get_member_stats_by_rt()
Get member count per RT.
```sql
SELECT * FROM get_member_stats_by_rt();
-- Returns: rt | member_count
```

### 5. get_finance_summary_by_month(target_month)
Get financial summary for a month.
```sql
SELECT * FROM get_finance_summary_by_month('2026-01-01');
-- Returns: total_income | total_expense | balance
```

### 6. get_kas_summary_by_month(target_month_key)
Get kas payment summary for a month.
```sql
SELECT * FROM get_kas_summary_by_month('2026-01');
-- Returns: total_members | paid_count | unpaid_count | total_collected
```

### 7. initialize_kas_payments_for_month(target_month_key, default_amount)
Auto-create kas payments for all members.
```sql
SELECT initialize_kas_payments_for_month('2026-01', 5000);
-- Returns: number of payments created
```

---

## 🔐 RLS Policies Summary

| Table | Admin | User | Public |
|-------|-------|------|--------|
| members | Full | Read all + Update own | - |
| user_accounts | Full | Read own | - |
| account_applications | Full | Read own | Create |
| attendance_records | Full | Read all | - |
| finance_transactions | Full | Read all | - |
| kas_payments | Full | Read own | - |
| events | Full | Read all | - |
| attendance_events | Full | Read all | - |
| attendance_checkins | Full | Read all + Create own | - |

---

## 📝 Common Queries

### Get all members in RT 01
```sql
SELECT * FROM members WHERE rt = '01' ORDER BY full_name;
```

### Get pending applications
```sql
SELECT * FROM account_applications WHERE status = 'pending' ORDER BY submitted_at DESC;
```

### Get current month unpaid kas
```sql
SELECT m.full_name, kp.amount, kp.month_key
FROM kas_payments kp
JOIN members m ON m.id = kp.member_id
WHERE kp.month_key = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
AND kp.status = 'unpaid';
```

### Get active attendance event
```sql
SELECT * FROM attendance_events 
WHERE is_active = true 
AND token_expires_at > EXTRACT(EPOCH FROM NOW()) * 1000
LIMIT 1;
```

### Get finance balance
```sql
SELECT 
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance
FROM finance_transactions;
```

---

## 🚀 Useful Commands

### Check table sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Count records in all tables
```sql
SELECT 'members' as table_name, COUNT(*) as count FROM members
UNION ALL
SELECT 'user_accounts', COUNT(*) FROM user_accounts
UNION ALL
SELECT 'account_applications', COUNT(*) FROM account_applications
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'finance_transactions', COUNT(*) FROM finance_transactions
UNION ALL
SELECT 'kas_payments', COUNT(*) FROM kas_payments
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'attendance_events', COUNT(*) FROM attendance_events
UNION ALL
SELECT 'attendance_checkins', COUNT(*) FROM attendance_checkins;
```

### List all RLS policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🔄 Maintenance

### Vacuum tables (optimize)
```sql
VACUUM ANALYZE;
```

### Reindex all tables
```sql
REINDEX DATABASE postgres;
```

### Check for missing indexes
```sql
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY n_distinct DESC;
```

---

## 📞 Support

Untuk pertanyaan atau masalah:
1. Cek [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) untuk troubleshooting
2. Cek Supabase Logs di Dashboard
3. Review RLS policies jika ada permission errors
4. Cek browser console untuk error details
