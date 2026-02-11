-- Create payment_items table
CREATE TABLE IF NOT EXISTS public.payment_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    deadline_date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('dp', 'full')),
    amount NUMERIC NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts when re-running
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.payment_items;
DROP POLICY IF EXISTS "Enable insert access for admins only" ON public.payment_items;
DROP POLICY IF EXISTS "Enable update access for admins only" ON public.payment_items;
DROP POLICY IF EXISTS "Enable delete access for admins only" ON public.payment_items;

-- Create permissive policies (Application handles auth logic via user_accounts)
CREATE POLICY "Anyone can view payment items"
    ON public.payment_items FOR SELECT USING (true);

CREATE POLICY "Anyone can insert payment items"
    ON public.payment_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update payment items"
    ON public.payment_items FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete payment items"
    ON public.payment_items FOR DELETE USING (true);

-- Enable realtime
alter publication supabase_realtime add table public.payment_items;
