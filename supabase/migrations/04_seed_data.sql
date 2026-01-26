-- =====================================================
-- PRSDN Dashboard - Seed Data (FIXED)
-- =====================================================
-- Migration ini berisi data sample untuk testing
-- Semua UUID sudah diperbaiki formatnya

-- =====================================================
-- Seed: members (15 sample members)
-- =====================================================
INSERT INTO members (id, full_name, birth_place, birth_date, rt, phone, instagram, job, education_status, education_level, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Ahmad Fauzi', 'Jakarta', '1998-05-12', '01', '081234567890', '@ahmadfauzi', 'Software Engineer', 'not_school', NULL, '2025-01-01T00:00:00Z'),
('22222222-2222-2222-2222-222222222222', 'Siti Nurhaliza', 'Bandung', '2000-03-22', '01', '081234567891', '@sitinur', 'Teacher', 'not_school', NULL, '2025-01-02T00:00:00Z'),
('33333333-3333-3333-3333-333333333333', 'Budi Santoso', 'Surabaya', '1999-07-15', '02', '081234567892', '@budisant', 'Designer', 'not_school', NULL, '2025-01-03T00:00:00Z'),
('44444444-4444-4444-4444-444444444444', 'Dewi Lestari', 'Yogyakarta', '2001-11-08', '02', '081234567893', '@dewilest', 'Student', 'school', 'College', '2025-01-04T00:00:00Z'),
('55555555-5555-5555-5555-555555555555', 'Eko Prasetyo', 'Semarang', '1997-09-20', '02', '081234567894', '@ekopras', 'Entrepreneur', 'not_school', NULL, '2025-01-05T00:00:00Z'),
('66666666-6666-6666-6666-666666666666', 'Fitri Handayani', 'Medan', '2002-02-14', '03', '081234567895', '@fitrihan', 'Marketing', 'not_school', NULL, '2025-01-06T00:00:00Z'),
('77777777-7777-7777-7777-777777777777', 'Gilang Ramadhan', 'Malang', '1998-12-25', '03', '081234567896', '@gilangram', 'Accountant', 'not_school', NULL, '2025-01-07T00:00:00Z'),
('88888888-8888-8888-8888-888888888888', 'Hana Safitri', 'Bogor', '2003-06-30', '03', '081234567897', '@hanasaf', 'Student', 'school', 'SMA/SMK', '2025-01-08T00:00:00Z'),
('99999999-9999-9999-9999-999999999999', 'Irfan Hakim', 'Depok', '1996-04-18', '04', '081234567898', '@irfanhak', 'Doctor', 'not_school', NULL, '2025-01-09T00:00:00Z'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Julia Rahmawati', 'Tangerang', '1999-08-05', '04', '081234567899', '@juliarah', 'Nurse', 'not_school', NULL, '2025-01-10T00:00:00Z'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kurniawan Putra', 'Bekasi', '2000-10-12', '04', '081234567800', '@kurniput', 'Engineer', 'not_school', NULL, '2025-01-11T00:00:00Z'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Linda Wijaya', 'Solo', '1998-01-28', '01', '081234567801', '@lindawij', 'Pharmacist', 'not_school', NULL, '2025-01-12T00:00:00Z'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Muhammad Rizki', 'Palembang', '2001-05-16', '02', '081234567802', '@muhrizki', 'Programmer', 'not_school', NULL, '2025-01-13T00:00:00Z'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Nadia Putri', 'Makassar', '2002-09-09', '03', '081234567803', '@nadiaput', 'Content Creator', 'not_school', NULL, '2025-01-14T00:00:00Z'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Oscar Wijaya', 'Bali', '1997-03-03', '01', '081234567804', '@oscarwij', 'Photographer', 'not_school', NULL, '2025-01-15T00:00:00Z');

-- =====================================================
-- Seed: user_accounts (2 accounts: 1 admin, 1 user)
-- =====================================================
INSERT INTO user_accounts (id, member_id, username, password, role, status, created_at) VALUES
('10000000-0000-0000-0000-000000000001', NULL, 'admin', 'admin123', 'admin', 'active', '2025-01-01T00:00:00Z'),
('20000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'ahmadf', 'password123', 'user', 'active', '2025-01-02T00:00:00Z');

-- =====================================================
-- Seed: account_applications (1 pending)
-- =====================================================
INSERT INTO account_applications (
    id, full_name, birth_place, birth_date, rt, phone, instagram, job,
    education_status, username, password, status, submitted_at
) VALUES (
    '30000000-0000-0000-0000-000000000001',
    'Pending User',
    'Jakarta',
    '2000-01-01',
    '01',
    '081999999999',
    '@pendinguser',
    'Developer',
    'not_school',
    'pendinguser',
    'password123',
    'pending',
    NOW() - INTERVAL '2 days'
);

-- =====================================================
-- Seed: events (6 upcoming events)
-- =====================================================
INSERT INTO events (id, title, date, type, description) VALUES
('40000001-0000-0000-0000-000000000001', 'Rapat Bulanan RT', CURRENT_DATE + INTERVAL '5 days', 'event', 'Rapat koordinasi bulanan RT'),
('40000002-0000-0000-0000-000000000002', 'Ulang Tahun Dewi Lestari', CURRENT_DATE + INTERVAL '12 days', 'birthday', NULL),
('40000003-0000-0000-0000-000000000003', 'Kerja Bakti Lingkungan', CURRENT_DATE + INTERVAL '20 days', 'program', 'Gotong royong membersihkan lingkungan'),
('40000004-0000-0000-0000-000000000004', 'Ulang Tahun Gilang Ramadhan', CURRENT_DATE + INTERVAL '25 days', 'birthday', NULL),
('40000005-0000-0000-0000-000000000005', 'Perayaan 17 Agustus', CURRENT_DATE + INTERVAL '40 days', 'event', 'Lomba dan perayaan kemerdekaan'),
('40000006-0000-0000-0000-000000000006', 'Arisan RT', CURRENT_DATE + INTERVAL '50 days', 'program', NULL);

-- =====================================================
-- Seed: finance_transactions (6 transactions)
-- =====================================================
INSERT INTO finance_transactions (id, type, category, title, amount, date, note) VALUES
('50000001-0000-0000-0000-000000000001', 'income', 'kas', 'Kas Bulan Lalu', 70000, CURRENT_DATE - INTERVAL '60 days', NULL),
('50000002-0000-0000-0000-000000000002', 'income', 'donation', 'Donasi Acara 17 Agustus', 500000, CURRENT_DATE - INTERVAL '50 days', NULL),
('50000003-0000-0000-0000-000000000003', 'expense', 'operational', 'Konsumsi Rapat Bulanan', 150000, CURRENT_DATE - INTERVAL '45 days', 'Snack dan minuman'),
('50000004-0000-0000-0000-000000000004', 'income', 'kas', 'Kas Bulan Ini', 65000, CURRENT_DATE - INTERVAL '30 days', NULL),
('50000005-0000-0000-0000-000000000005', 'expense', 'event', 'Dekorasi Acara Sosial', 300000, CURRENT_DATE - INTERVAL '20 days', NULL),
('50000006-0000-0000-0000-000000000006', 'income', 'event', 'Iuran Acara Sosial', 750000, CURRENT_DATE - INTERVAL '15 days', NULL);

-- =====================================================
-- Seed: attendance_records (6 months)
-- =====================================================
INSERT INTO attendance_records (id, date, month_key, attendee_member_ids) VALUES
('60000001-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '150 days', TO_CHAR(CURRENT_DATE - INTERVAL '5 months', 'YYYY-MM'),
 ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333',
       '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777',
       '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
       'dddddddd-dddd-dddd-dddd-dddddddddddd', 'ffffffff-ffff-ffff-ffff-ffffffffffff']::UUID[]),

('60000002-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '120 days', TO_CHAR(CURRENT_DATE - INTERVAL '4 months', 'YYYY-MM'),
 ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333',
       '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666',
       '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
       'cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff']::UUID[]),

('60000003-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '90 days', TO_CHAR(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'),
 ARRAY['11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
       '55555555-5555-5555-5555-555555555555', '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888',
       '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
       'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee']::UUID[]),

('60000004-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '60 days', TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'),
 ARRAY['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444',
       '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777',
       '88888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
       'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
       'ffffffff-ffff-ffff-ffff-ffffffffffff']::UUID[]),

('60000005-0000-0000-0000-000000000005', CURRENT_DATE - INTERVAL '30 days', TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'),
 ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444',
       '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777',
       '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
       'cccccccc-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee']::UUID[]),

('60000006-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '5 days', TO_CHAR(CURRENT_DATE, 'YYYY-MM'),
 ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333',
       '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666',
       '77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999',
       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
       'ffffffff-ffff-ffff-ffff-ffffffffffff']::UUID[]);

-- =====================================================
-- Seed: kas_payments (2 months)
-- =====================================================
-- Month -2
INSERT INTO kas_payments (month_key, year, member_id, amount, paid_at, status) VALUES
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, '11111111-1111-1111-1111-111111111111', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, '22222222-2222-2222-2222-222222222222', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, '33333333-3333-3333-3333-333333333333', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, '44444444-4444-4444-4444-444444444444', 5000, NULL, 'unpaid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, '55555555-5555-5555-5555-555555555555', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, '66666666-6666-6666-6666-666666666666', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, '77777777-7777-7777-7777-777777777777', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, '88888888-8888-8888-8888-888888888888', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, '99999999-9999-9999-9999-999999999999', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5000, CURRENT_DATE - INTERVAL '60 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '2 months')::INTEGER, 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5000, NULL, 'unpaid');

-- Month -1
INSERT INTO kas_payments (month_key, year, member_id, amount, paid_at, status) VALUES
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, '11111111-1111-1111-1111-111111111111', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, '22222222-2222-2222-2222-222222222222', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, '33333333-3333-3333-3333-333333333333', 5000, NULL, 'unpaid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, '44444444-4444-4444-4444-444444444444', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, '55555555-5555-5555-5555-555555555555', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, '66666666-6666-6666-6666-666666666666', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, '77777777-7777-7777-7777-777777777777', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, '88888888-8888-8888-8888-888888888888', 5000, NULL, 'unpaid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, '99999999-9999-9999-9999-999999999999', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5000, NULL, 'unpaid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, 'cccccccc-cccc-cccc-cccc-cccccccccccc', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5000, CURRENT_DATE - INTERVAL '30 days', 'paid'),
(TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')::INTEGER, 'ffffffff-ffff-ffff-ffff-ffffffffffff', 5000, NULL, 'unpaid');

-- =====================================================
-- Seed: attendance_events (4 events)
-- =====================================================
INSERT INTO attendance_events (id, title, description, date, start_time, end_time, is_active, token, token_expires_at, created_by_admin_id, created_at) VALUES
('70000001-0000-0000-0000-000000000001', 'Rapat Koordinasi Januari', 'Rapat koordinasi bulanan RT 01-04', CURRENT_DATE, '19:00', '21:00', true, 'ABC123', EXTRACT(EPOCH FROM (NOW() + INTERVAL '30 seconds')) * 1000, '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour'),
('70000002-0000-0000-0000-000000000002', 'Kerja Bakti Lingkungan', 'Gotong royong membersihkan lingkungan RT', CURRENT_DATE + INTERVAL '7 days', '07:00', '10:00', false, '', 0, '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day'),
('70000003-0000-0000-0000-000000000003', 'Perayaan 17 Agustus', 'Lomba dan perayaan kemerdekaan', CURRENT_DATE - INTERVAL '7 days', '08:00', '16:00', false, '', 0, '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days'),
('70000004-0000-0000-0000-000000000004', 'Arisan RT Desember', 'Arisan bulanan dan makan bersama', CURRENT_DATE - INTERVAL '30 days', '18:00', '21:00', false, '', 0, '10000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days');

-- =====================================================
-- Seed: attendance_checkins (17 check-ins)
-- =====================================================
INSERT INTO attendance_checkins (event_id, member_id, checked_in_at, token_used) VALUES
-- Event 1 (Active - 6 check-ins)
('70000001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 minutes')) * 1000, 'XYZ789'),
('70000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', EXTRACT(EPOCH FROM (NOW() - INTERVAL '25 minutes')) * 1000, 'XYZ789'),
('70000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', EXTRACT(EPOCH FROM (NOW() - INTERVAL '20 minutes')) * 1000, 'XYZ789'),
('70000001-0000-0000-0000-000000000001', '77777777-7777-7777-7777-777777777777', EXTRACT(EPOCH FROM (NOW() - INTERVAL '15 minutes')) * 1000, 'ABC123'),
('70000001-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', EXTRACT(EPOCH FROM (NOW() - INTERVAL '10 minutes')) * 1000, 'ABC123'),
('70000001-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 minutes')) * 1000, 'ABC123'),

-- Event 3 (Past - 10 check-ins)
('70000003-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),
('70000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),
('70000003-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),
('70000003-0000-0000-0000-000000000003', '44444444-4444-4444-4444-444444444444', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),
('70000003-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),
('70000003-0000-0000-0000-000000000003', '66666666-6666-6666-6666-666666666666', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),
('70000003-0000-0000-0000-000000000003', '88888888-8888-8888-8888-888888888888', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),
('70000003-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),
('70000003-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),
('70000003-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000, 'OLD123'),

-- Event 4 (Past - 1 check-in)
('70000004-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days')) * 1000, 'DEC456');
