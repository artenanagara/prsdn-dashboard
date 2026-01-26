-- Migration: Add new fields to members and account_applications tables
-- Date: 2026-01-26
-- Description: Add grade, university, and joined_whatsapp fields

-- Add columns to members table
ALTER TABLE members
ADD COLUMN IF NOT EXISTS grade VARCHAR(50),
ADD COLUMN IF NOT EXISTS university VARCHAR(255),
ADD COLUMN IF NOT EXISTS joined_whatsapp BOOLEAN DEFAULT false;

-- Add columns to account_applications table
ALTER TABLE account_applications
ADD COLUMN IF NOT EXISTS grade VARCHAR(50),
ADD COLUMN IF NOT EXISTS university VARCHAR(255),
ADD COLUMN IF NOT EXISTS joined_whatsapp BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN members.grade IS 'Kelas untuk pelajar (e.g., "SD Kelas 1", "SMA/SMK Kelas 10")';
COMMENT ON COLUMN members.university IS 'Nama universitas untuk mahasiswa';
COMMENT ON COLUMN members.joined_whatsapp IS 'Sudah bergabung di grup WhatsApp atau belum';

COMMENT ON COLUMN account_applications.grade IS 'Kelas untuk pelajar (e.g., "SD Kelas 1", "SMA/SMK Kelas 10")';
COMMENT ON COLUMN account_applications.university IS 'Nama universitas untuk mahasiswa';
COMMENT ON COLUMN account_applications.joined_whatsapp IS 'Sudah bergabung di grup WhatsApp atau belum';
