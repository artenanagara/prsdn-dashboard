-- Enable Realtime untuk semua tabel
-- This allows Supabase Realtime subscriptions to work

-- Enable REPLICA IDENTITY FULL for all tables to track all changes
ALTER TABLE attendance_events REPLICA IDENTITY FULL;
ALTER TABLE attendance_checkins REPLICA IDENTITY FULL;
ALTER TABLE kas_payments REPLICA IDENTITY FULL;
ALTER TABLE finance_transactions REPLICA IDENTITY FULL;
ALTER TABLE members REPLICA IDENTITY FULL;

-- Tambahkan ke Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_events;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE kas_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE finance_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE members;
