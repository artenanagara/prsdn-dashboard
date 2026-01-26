-- Disable RLS for new tables used in migration
ALTER TABLE kas_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Confirm status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('kas_payments', 'events');
