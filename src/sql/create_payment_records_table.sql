-- Create payment_records table
CREATE TABLE IF NOT EXISTS public.payment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_item_id UUID REFERENCES public.payment_items(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
    last_payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(payment_item_id, member_id)
);

-- Enable RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (Application handles auth logic via user_accounts)
CREATE POLICY "Anyone can view payment records"
    ON public.payment_records FOR SELECT USING (true);

CREATE POLICY "Anyone can insert payment records"
    ON public.payment_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update payment records"
    ON public.payment_records FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete payment records"
    ON public.payment_records FOR DELETE USING (true);

-- Enable realtime
alter publication supabase_realtime add table public.payment_records;
