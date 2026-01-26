-- =====================================================
-- PRSDN Dashboard - Reset Database
-- =====================================================
-- Script ini akan menghapus SEMUA data dan struktur database
-- HATI-HATI: Ini akan menghapus semua tabel, functions, dan data!
-- Gunakan hanya jika ingin reset database ke kondisi awal

-- =====================================================
-- Step 1: Drop all tables (CASCADE akan drop foreign keys juga)
-- =====================================================

DROP TABLE IF EXISTS attendance_checkins CASCADE;
DROP TABLE IF EXISTS attendance_events CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS kas_payments CASCADE;
DROP TABLE IF EXISTS finance_transactions CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS user_accounts CASCADE;
DROP TABLE IF EXISTS account_applications CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- =====================================================
-- Step 2: Drop all functions
-- =====================================================

DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS get_user_member_id() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_token(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_member_stats_by_rt() CASCADE;
DROP FUNCTION IF EXISTS get_finance_summary_by_month(DATE) CASCADE;
DROP FUNCTION IF EXISTS get_kas_summary_by_month(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS initialize_kas_payments_for_month(VARCHAR, DECIMAL) CASCADE;

-- =====================================================
-- Verification
-- =====================================================

-- Check if all tables are dropped
SELECT 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'members', 
        'user_accounts', 
        'account_applications',
        'attendance_records',
        'finance_transactions',
        'kas_payments',
        'events',
        'attendance_events',
        'attendance_checkins'
    );

-- Should return 0 rows if all tables are dropped

-- Check if all functions are dropped
SELECT 
    routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name IN (
        'get_user_role',
        'get_user_member_id',
        'update_updated_at_column',
        'generate_token',
        'get_member_stats_by_rt',
        'get_finance_summary_by_month',
        'get_kas_summary_by_month',
        'initialize_kas_payments_for_month'
    );

-- Should return 0 rows if all functions are dropped

-- =====================================================
-- Next Steps
-- =====================================================
-- Setelah menjalankan script ini, jalankan migrations dalam urutan:
-- 1. 01_create_tables.sql
-- 2. 02_create_rls_policies.sql
-- 3. 03_create_functions.sql
-- 4. 04_seed_data.sql
