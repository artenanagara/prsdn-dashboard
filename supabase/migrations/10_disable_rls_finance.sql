-- CRITICAL FIX: Disable RLS for finance_transactions
-- This table was missed in previous RLS disable scripts, preventing data insertion.

ALTER TABLE finance_transactions DISABLE ROW LEVEL SECURITY;

-- Re-apply for others just in case
ALTER TABLE kas_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_checkins DISABLE ROW LEVEL SECURITY;

-- Verify all
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('finance_transactions', 'kas_payments', 'events', 'attendance_events');
