-- ==============================================================================
-- SakuTrack Complete Supabase Database Schema
-- ==============================================================================
-- Run this script in your Supabase Dashboard SQL Editor:
-- Go to https://supabase.com/dashboard -> Project -> SQL Editor -> New Query
-- ==============================================================================

-- 1. EXPENSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Expenses Policies
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
CREATE POLICY "Users can view their own expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
CREATE POLICY "Users can insert their own expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
CREATE POLICY "Users can update their own expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
CREATE POLICY "Users can delete their own expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Expenses Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_spent_at ON public.expenses (user_id, spent_at);


-- 2. SPLIT BILLS
-- ------------------------------------------------------------------------------
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

-- 3. SPLIT PARTICIPANTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.split_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.split_bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_creator BOOLEAN NOT NULL DEFAULT false,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ
);

-- 4. SPLIT ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.split_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.split_bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  assigned_participant_ids UUID[] NOT NULL DEFAULT '{}'
);

-- Enable RLS for split bills tables
ALTER TABLE public.split_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_items ENABLE ROW LEVEL SECURITY;

-- Public Read Policies (Allows friends to view bill and items via shared link without signing in)
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

-- Allow anyone with access to the bill to update participant payment status (optional, or restricted to creator)
DROP POLICY IF EXISTS "Creator manage split_items" ON public.split_items;
CREATE POLICY "Creator manage split_items" ON public.split_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.split_bills WHERE id = bill_id AND creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.split_bills WHERE id = bill_id AND creator_id = auth.uid()));

-- Split Bill Indexes
CREATE INDEX IF NOT EXISTS idx_split_bills_creator ON public.split_bills (creator_id);
CREATE INDEX IF NOT EXISTS idx_split_participants_bill ON public.split_participants (bill_id);
CREATE INDEX IF NOT EXISTS idx_split_items_bill ON public.split_items (bill_id);
