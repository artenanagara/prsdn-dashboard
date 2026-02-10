-- Add missing columns to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS grade VARCHAR(10),
ADD COLUMN IF NOT EXISTS university VARCHAR(255),
ADD COLUMN IF NOT EXISTS joined_whatsapp BOOLEAN NOT NULL DEFAULT false;

-- Add same columns to account_applications table for consistency
ALTER TABLE account_applications
ADD COLUMN IF NOT EXISTS grade VARCHAR(10),
ADD COLUMN IF NOT EXISTS university VARCHAR(255),
ADD COLUMN IF NOT EXISTS joined_whatsapp BOOLEAN NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN members.grade IS 'Grade/class for students in SD, SMP, or SMA/SMK';
COMMENT ON COLUMN members.university IS 'University name for college students';
COMMENT ON COLUMN members.joined_whatsapp IS 'Whether member has joined the WhatsApp group';
