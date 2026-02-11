-- Add bill_amount to payment_records to support variable pricing
ALTER TABLE public.payment_records
ADD COLUMN IF NOT EXISTS bill_amount NUMERIC DEFAULT NULL;

-- Update RLS policies if needed (existing ones are permissive, so likely fine, but good to check)
-- The existing policies on payment_records are "USING (true)" so they cover this new column automatically.
