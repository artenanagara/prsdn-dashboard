-- =====================================================
-- FIX ALL RLS ISSUES - Disable RLS for Development
-- =====================================================
-- This will disable RLS on all tables that need it
-- Run this in Supabase SQL Editor

-- Disable RLS on tables that admin needs to modify
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE account_applications DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('members', 'user_accounts', 'account_applications');

-- Expected result: rowsecurity should be 'f' (false) for all three tables
