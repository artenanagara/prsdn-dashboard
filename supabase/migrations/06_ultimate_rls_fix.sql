-- =====================================================
-- ULTIMATE FIX: Disable RLS or Create Simple Policy
-- =====================================================
-- Choose ONE of these approaches:

-- ========== APPROACH 1: Temporarily Disable RLS (for testing) ==========
-- This will allow all operations without RLS checks
-- WARNING: Only use this for testing/development!

ALTER TABLE account_applications DISABLE ROW LEVEL SECURITY;

-- ========== APPROACH 2: Keep RLS but allow public INSERT ==========
-- Uncomment this if you want to keep RLS enabled:

/*
-- First, re-enable RLS if you disabled it
ALTER TABLE account_applications ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can create account applications" ON account_applications;
DROP POLICY IF EXISTS "Admin can do everything on applications" ON account_applications;
DROP POLICY IF EXISTS "Users can read own application" ON account_applications;
DROP POLICY IF EXISTS "Public can create account applications" ON account_applications;
DROP POLICY IF EXISTS "Authenticated can create account applications" ON account_applications;
DROP POLICY IF EXISTS "Admin can read all applications" ON account_applications;
DROP POLICY IF EXISTS "Admin can update applications" ON account_applications;
DROP POLICY IF EXISTS "Admin can delete applications" ON account_applications;
DROP POLICY IF EXISTS "allow_public_insert_applications" ON account_applications;
DROP POLICY IF EXISTS "allow_admin_all_applications" ON account_applications;

-- Simple policies that WILL work
CREATE POLICY "enable_insert_for_all"
    ON account_applications
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "enable_read_for_authenticated"
    ON account_applications
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "enable_update_for_authenticated"
    ON account_applications
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "enable_delete_for_authenticated"
    ON account_applications
    FOR DELETE
    TO authenticated
    USING (true);
*/

-- ========== VERIFICATION ==========
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'account_applications';

-- Check current policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'account_applications';
