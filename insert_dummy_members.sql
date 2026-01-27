-- Insert 10 dummy members for testing
-- Run this in Supabase SQL Editor

INSERT INTO members (full_name, birth_place, birth_date, rt, phone, instagram, job, education_status, education_level) VALUES
('Budi Santoso', 'Jakarta', '1995-03-15', '01', '081234567801', '@budisantoso', 'Guru', 'not_school', NULL),
('Siti Nurhaliza', 'Bandung', '1998-07-22', '01', '081234567802', '@sitinur', 'Mahasiswa', 'school', 'College'),
('Ahmad Fauzi', 'Surabaya', '2005-11-08', '02', '081234567803', '@ahmadfauzi', 'Pelajar', 'school', 'SMA/SMK'),
('Dewi Lestari', 'Medan', '1992-01-30', '02', '081234567804', '@dewilestari', 'Wiraswasta', 'not_school', NULL),
('Eko Prasetyo', 'Semarang', '2008-05-12', '03', '081234567805', '@ekopras', 'Pelajar', 'school', 'SMP'),
('Fitri Handayani', 'Yogyakarta', '1990-09-25', '03', '081234567806', '@fitrihanda', 'Dokter', 'not_school', NULL),
('Hendra Wijaya', 'Malang', '2010-02-14', '04', '081234567807', '@hendrawijaya', 'Pelajar', 'school', 'SD'),
('Indah Permata', 'Bogor', '1997-12-03', '04', '081234567808', '@indahpermata', 'Karyawan Swasta', 'not_school', NULL),
('Joko Susilo', 'Tangerang', '1988-06-18', '01', '081234567809', '@jokosusilo', 'PNS', 'not_school', NULL),
('Kartika Sari', 'Bekasi', '2003-10-29', '02', '081234567810', '@kartikasari', 'Mahasiswa', 'school', 'College');

-- Verify insertion
SELECT COUNT(*) as total_members FROM members;
SELECT full_name, rt FROM members ORDER BY created_at DESC LIMIT 10;
