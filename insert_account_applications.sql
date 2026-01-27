-- Insert 5 pending account applications for testing
-- Run this in Supabase SQL Editor

INSERT INTO account_applications (
  full_name, 
  birth_place, 
  birth_date, 
  rt, 
  phone, 
  instagram, 
  job, 
  education_status, 
  education_level,
  username,
  password,
  status
) VALUES
(
  'Rina Marlina', 
  'Depok', 
  '1999-04-17', 
  '01', 
  '082134567801', 
  '@rinamarlina', 
  'Desainer Grafis', 
  'not_school', 
  NULL,
  'rina.marlina',
  'password123',
  'pending'
),
(
  'Fahmi Rahman', 
  'Jakarta', 
  '2006-08-23', 
  '02', 
  '082134567802', 
  '@fahmirahman', 
  'Pelajar', 
  'school', 
  'SMA/SMK',
  'fahmi.rahman',
  'password123',
  'pending'
),
(
  'Lisa Andriani', 
  'Tangerang', 
  '1996-12-05', 
  '03', 
  '082134567803', 
  '@lisaandriani', 
  'Marketing', 
  'not_school', 
  NULL,
  'lisa.andriani',
  'password123',
  'pending'
),
(
  'Rudi Hermawan', 
  'Bekasi', 
  '2009-03-11', 
  '04', 
  '082134567804', 
  '@rudihermawan', 
  'Pelajar', 
  'school', 
  'SMP',
  'rudi.hermawan',
  'password123',
  'pending'
),
(
  'Maya Putri', 
  'Bogor', 
  '1993-09-28', 
  '01', 
  '082134567805', 
  '@mayaputri', 
  'Guru', 
  'not_school', 
  NULL,
  'maya.putri',
  'password123',
  'pending'
);

-- Verify insertion
SELECT COUNT(*) as total_pending FROM account_applications WHERE status = 'pending';
SELECT full_name, username, rt, status FROM account_applications ORDER BY submitted_at DESC LIMIT 5;
