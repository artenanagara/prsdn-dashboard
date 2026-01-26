-- =====================================================
-- QUICK FIX: Check and Fix RLS Policies
-- =====================================================
-- Run this entire script in Supabase SQL Editor

-- Step 1: Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'account_applications';

-- Step 2: Drop ALL existing policies on account_applications
DROP POLICY IF EXISTS "Anyone can create account applications" ON account_applications;
DROP POLICY IF EXISTS "Admin can do everything on applications" ON account_applications;
DROP POLICY IF EXISTS "Users can read own application" ON account_applications;
DROP POLICY IF EXISTS "Public can create account applications" ON account_applications;
DROP POLICY IF EXISTS "Authenticated can create account applications" ON account_applications;
DROP POLICY IF EXISTS "Admin can read all applications" ON account_applications;
DROP POLICY IF EXISTS "Admin can update applications" ON account_applications;
DROP POLICY IF EXISTS "Admin can delete applications" ON account_applications;

-- Step 3: Create new policies with proper permissions
-- Allow ANYONE (including non-authenticated) to INSERT
CREATE POLICY "allow_public_insert_applications"
    ON account_applications
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow admin to do everything
CREATE POLICY "allow_admin_all_applications"
    ON account_applications
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_accounts 
            WHERE user_accounts.id = auth.uid() 
            AND user_accounts.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_accounts 
            WHERE user_accounts.id = auth.uid() 
            AND user_accounts.role = 'admin'
        )
    );

-- Step 4: Verify new policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'account_applications';
