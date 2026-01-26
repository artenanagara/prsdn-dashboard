-- =====================================================
-- PRSDN Dashboard - Row Level Security Policies
-- =====================================================
-- This migration creates RLS policies for all tables
-- Admin: Full access to all data
-- User: Read access to most data, write access to own data
-- Public: Can create account applications

-- =====================================================
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_checkins ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper function to get current user's role
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM user_accounts
    WHERE id = auth.uid();
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function to get current user's member_id
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_member_id()
RETURNS UUID AS $$
DECLARE
    user_member_id UUID;
BEGIN
    SELECT member_id INTO user_member_id
    FROM user_accounts
    WHERE id = auth.uid();
    
    RETURN user_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS Policies: members
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin can do everything on members"
    ON members
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- User: Read all members
CREATE POLICY "Users can read all members"
    ON members
    FOR SELECT
    TO authenticated
    USING (get_user_role() = 'user');

-- User: Update own profile
CREATE POLICY "Users can update own member profile"
    ON members
    FOR UPDATE
    TO authenticated
    USING (id = get_user_member_id())
    WITH CHECK (id = get_user_member_id());

-- =====================================================
-- RLS Policies: account_applications
-- =====================================================

-- Public: Can create applications
CREATE POLICY "Anyone can create account applications"
    ON account_applications
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Admin: Full access
CREATE POLICY "Admin can do everything on applications"
    ON account_applications
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- User: Read own application
CREATE POLICY "Users can read own application"
    ON account_applications
    FOR SELECT
    TO authenticated
    USING (username = (SELECT username FROM user_accounts WHERE id = auth.uid()));

-- =====================================================
-- RLS Policies: user_accounts
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin can do everything on user_accounts"
    ON user_accounts
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- User: Read own account
CREATE POLICY "Users can read own account"
    ON user_accounts
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- =====================================================
-- RLS Policies: attendance_records
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin can do everything on attendance_records"
    ON attendance_records
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- User: Read all records
CREATE POLICY "Users can read all attendance_records"
    ON attendance_records
    FOR SELECT
    TO authenticated
    USING (get_user_role() = 'user');

-- =====================================================
-- RLS Policies: finance_transactions
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin can do everything on finance_transactions"
    ON finance_transactions
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- User: Read all transactions
CREATE POLICY "Users can read all finance_transactions"
    ON finance_transactions
    FOR SELECT
    TO authenticated
    USING (get_user_role() = 'user');

-- =====================================================
-- RLS Policies: kas_payments
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin can do everything on kas_payments"
    ON kas_payments
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- User: Read own payments
CREATE POLICY "Users can read own kas_payments"
    ON kas_payments
    FOR SELECT
    TO authenticated
    USING (member_id = get_user_member_id());

-- =====================================================
-- RLS Policies: events
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin can do everything on events"
    ON events
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- User: Read all events
CREATE POLICY "Users can read all events"
    ON events
    FOR SELECT
    TO authenticated
    USING (get_user_role() = 'user');

-- =====================================================
-- RLS Policies: attendance_events
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin can do everything on attendance_events"
    ON attendance_events
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- User: Read all attendance events
CREATE POLICY "Users can read all attendance_events"
    ON attendance_events
    FOR SELECT
    TO authenticated
    USING (get_user_role() = 'user');

-- =====================================================
-- RLS Policies: attendance_checkins
-- =====================================================

-- Admin: Full access
CREATE POLICY "Admin can do everything on attendance_checkins"
    ON attendance_checkins
    FOR ALL
    TO authenticated
    USING (get_user_role() = 'admin')
    WITH CHECK (get_user_role() = 'admin');

-- User: Read all check-ins
CREATE POLICY "Users can read all attendance_checkins"
    ON attendance_checkins
    FOR SELECT
    TO authenticated
    USING (get_user_role() = 'user');

-- User: Create own check-in
CREATE POLICY "Users can create own attendance_checkins"
    ON attendance_checkins
    FOR INSERT
    TO authenticated
    WITH CHECK (member_id = get_user_member_id());
