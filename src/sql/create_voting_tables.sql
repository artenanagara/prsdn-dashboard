-- Voting and Polling Feature Schema (Enhanced)
-- Run this to CREATE or REPLACE the schema

-- 1. Drop existing tables if re-running (optional, valid for dev)
DROP TABLE IF EXISTS public.poll_votes;
DROP TABLE IF EXISTS public.poll_options;
DROP TABLE IF EXISTS public.polls;

-- 2. Create 'polls' table with enhanced fields
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'polling', -- 'voting' or 'polling'
    question_type TEXT NOT NULL DEFAULT 'single_choice', -- 'single_choice' or 'multiple_choice'
    is_anonymous BOOLEAN DEFAULT false,
    requires_login BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '7 days') NOT NULL,
    result_visibility TEXT DEFAULT 'after_vote', -- 'always', 'after_vote', 'after_close'
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'closed', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.user_accounts(id)
);

-- 3. Create 'poll_options' table
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    label TEXT NOT NULL
);

-- 4. Create 'poll_votes' table
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_accounts(id), -- Identify who voted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view active polls" ON public.polls;
DROP POLICY IF EXISTS "Admins can manage polls" ON public.polls;
DROP POLICY IF EXISTS "Authenticated users can insert polls" ON public.polls;
DROP POLICY IF EXISTS "Public can view options" ON public.poll_options;
DROP POLICY IF EXISTS "Authenticated can insert options" ON public.poll_options;
DROP POLICY IF EXISTS "Users can view votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Users can insert votes" ON public.poll_votes;

-- Polls policies
CREATE POLICY "Anyone can view polls" 
  ON public.polls FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert polls" 
  ON public.polls FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update polls" 
  ON public.polls FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete polls" 
  ON public.polls FOR DELETE 
  USING (true);

-- Poll options policies
CREATE POLICY "Anyone can view options" 
  ON public.poll_options FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert options" 
  ON public.poll_options FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update options" 
  ON public.poll_options FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete options" 
  ON public.poll_options FOR DELETE 
  USING (true);

-- Poll votes policies
CREATE POLICY "Anyone can view votes" 
  ON public.poll_votes FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert votes" 
  ON public.poll_votes FOR INSERT 
  WITH CHECK (true);

-- Enable Realtime
alter publication supabase_realtime add table polls;
alter publication supabase_realtime add table poll_options;
alter publication supabase_realtime add table poll_votes;
