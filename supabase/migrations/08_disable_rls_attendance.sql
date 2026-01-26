-- =====================================================
-- Disable RLS for Attendance Tables
-- =====================================================
-- Run this in Supabase SQL Editor

ALTER TABLE attendance_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_checkins DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('attendance_events', 'attendance_checkins');
