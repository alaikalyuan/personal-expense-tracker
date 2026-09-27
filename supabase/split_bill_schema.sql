-- 1. Split Bills (Lean Header)
CREATE TABLE IF NOT EXISTS public.split_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  split_mode TEXT NOT NULL DEFAULT 'itemized', -- 'itemized' | 'equal'
  tax_percentage NUMERIC NOT NULL DEFAULT 0,
  service_percentage NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  extra_fee NUMERIC NOT NULL DEFAULT 0,
  rounding_step INTEGER NOT NULL DEFAULT 100,
  payment_info JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'Food & Dining',
  logged_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'settled'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Split Participants (Minimal participant record)
CREATE TABLE IF NOT EXISTS public.split_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.split_bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_creator BOOLEAN NOT NULL DEFAULT false,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ
);

-- 3. Split Items (Raw item entries)
CREATE TABLE IF NOT EXISTS public.split_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.split_bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  assigned_participant_ids UUID[] NOT NULL DEFAULT '{}'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.split_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_items ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (Allow friends to view bill without signing in)
DROP POLICY IF EXISTS "Public read split_bills" ON public.split_bills;
CREATE POLICY "Public read split_bills" ON public.split_bills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read split_participants" ON public.split_participants;
CREATE POLICY "Public read split_participants" ON public.split_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read split_items" ON public.split_items;
CREATE POLICY "Public read split_items" ON public.split_items FOR SELECT USING (true);

-- Authenticated Creator Write Policies
DROP POLICY IF EXISTS "Creator manage split_bills" ON public.split_bills;
CREATE POLICY "Creator manage split_bills" ON public.split_bills
  FOR ALL TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creator manage split_participants" ON public.split_participants;
CREATE POLICY "Creator manage split_participants" ON public.split_participants
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.split_bills WHERE id = bill_id AND creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.split_bills WHERE id = bill_id AND creator_id = auth.uid()));

DROP POLICY IF EXISTS "Creator manage split_items" ON public.split_items;
CREATE POLICY "Creator manage split_items" ON public.split_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.split_bills WHERE id = bill_id AND creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.split_bills WHERE id = bill_id AND creator_id = auth.uid()));
