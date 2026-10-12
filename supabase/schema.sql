-- ==============================================================================
-- SakuTrack Complete Supabase Database Schema
-- ==============================================================================
-- Run this script in your Supabase Dashboard SQL Editor:
-- Go to https://supabase.com/dashboard -> Project -> SQL Editor -> New Query
-- ==============================================================================

-- 1. USER SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_currency TEXT NOT NULL DEFAULT 'IDR',
  multi_saku_enabled BOOLEAN NOT NULL DEFAULT false,
  default_wallet_id UUID,
  email_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  email_sync_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  email_sync_mode TEXT NOT NULL DEFAULT 'review' CHECK (email_sync_mode IN ('auto', 'review')),
  email_sync_wallet_id UUID,
  last_email_verification_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_settings_owner_policy" ON public.user_settings;
CREATE POLICY "user_settings_owner_policy"
  ON public.user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. WALLETS (MULTI-SAKU)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('spending', 'stash')),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '👛',
  color TEXT NOT NULL DEFAULT '#10b981',
  currency TEXT NOT NULL DEFAULT 'IDR',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  track_balance BOOLEAN NOT NULL DEFAULT false,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  weekly_budget NUMERIC,
  monthly_budget NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_owner_policy" ON public.wallets;
CREATE POLICY "wallets_owner_policy"
  ON public.wallets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wallets_user_kind ON public.wallets (user_id, kind);
CREATE INDEX IF NOT EXISTS idx_wallets_user_archived ON public.wallets (user_id, archived_at);

-- Link user_settings foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_settings_default_wallet_id_fkey'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_default_wallet_id_fkey
      FOREIGN KEY (default_wallet_id) REFERENCES public.wallets(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_settings_email_sync_wallet_id_fkey'
  ) THEN
    ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_email_sync_wallet_id_fkey
      FOREIGN KEY (email_sync_wallet_id) REFERENCES public.wallets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. EXPENSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  note TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

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

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_spent_at ON public.expenses (user_id, spent_at);
CREATE INDEX IF NOT EXISTS idx_expenses_wallet_id ON public.expenses (wallet_id);

-- 4. SAVINGS GOALS & WALLET TRANSACTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎯',
  target_amount NUMERIC NOT NULL DEFAULT 0,
  allocated_amount NUMERIC NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "savings_goals_owner_policy" ON public.savings_goals;
CREATE POLICY "savings_goals_owner_policy"
  ON public.savings_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_savings_goals_wallet ON public.savings_goals (wallet_id);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'transfer', 'expense', 'adjustment', 'surplus_sweep', 'goal_allocate', 'goal_withdraw')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'IDR',
  from_wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public.savings_goals(id) ON DELETE SET NULL,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  week_id TEXT,
  note TEXT,
  occurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallet_transactions_owner_policy" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_owner_policy"
  ON public.wallet_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_date ON public.wallet_transactions (user_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_from_to ON public.wallet_transactions (from_wallet_id, to_wallet_id);

-- Wallet Balances View
CREATE OR REPLACE VIEW public.wallet_balances AS
WITH inflows AS (
  SELECT
    wallet_transactions.to_wallet_id AS wallet_id,
    COALESCE(SUM(wallet_transactions.amount), 0::numeric) AS total_inflow
  FROM wallet_transactions
  WHERE wallet_transactions.to_wallet_id IS NOT NULL
  GROUP BY wallet_transactions.to_wallet_id
),
outflows AS (
  SELECT
    wallet_transactions.from_wallet_id AS wallet_id,
    COALESCE(SUM(wallet_transactions.amount), 0::numeric) AS total_outflow
  FROM wallet_transactions
  WHERE wallet_transactions.from_wallet_id IS NOT NULL
  GROUP BY wallet_transactions.from_wallet_id
),
expense_deductions AS (
  SELECT
    expenses.wallet_id,
    COALESCE(SUM(expenses.amount), 0::numeric) AS total_expenses
  FROM expenses
  WHERE expenses.wallet_id IS NOT NULL
  GROUP BY expenses.wallet_id
)
SELECT
  w.id AS wallet_id,
  w.user_id,
  w.name,
  w.kind,
  w.emoji,
  w.color,
  w.currency,
  w.is_primary,
  w.track_balance,
  w.weekly_budget,
  w.monthly_budget,
  w.sort_order,
  w.archived_at,
  w.opening_balance,
  COALESCE(inf.total_inflow, 0::numeric) AS total_inflow,
  (COALESCE(outf.total_outflow, 0::numeric) + COALESCE(exp_ded.total_expenses, 0::numeric)) AS total_outflow,
  CASE
    WHEN w.track_balance = false THEN 0::numeric
    ELSE (w.opening_balance + COALESCE(inf.total_inflow, 0::numeric)) - (COALESCE(outf.total_outflow, 0::numeric) + COALESCE(exp_ded.total_expenses, 0::numeric))
  END AS current_balance
FROM wallets w
LEFT JOIN inflows inf ON inf.wallet_id = w.id
LEFT JOIN outflows outf ON outf.wallet_id = w.id
LEFT JOIN expense_deductions exp_ded ON exp_ded.wallet_id = w.id;

-- 5. SPLIT BILLS
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

CREATE TABLE IF NOT EXISTS public.split_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.split_bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_creator BOOLEAN NOT NULL DEFAULT false,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.split_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.split_bills(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  assigned_participant_ids UUID[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.split_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read split_bills" ON public.split_bills;
CREATE POLICY "Public read split_bills" ON public.split_bills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read split_participants" ON public.split_participants;
CREATE POLICY "Public read split_participants" ON public.split_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read split_items" ON public.split_items;
CREATE POLICY "Public read split_items" ON public.split_items FOR SELECT USING (true);

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

CREATE INDEX IF NOT EXISTS idx_split_bills_creator ON public.split_bills (creator_id);
CREATE INDEX IF NOT EXISTS idx_split_participants_bill ON public.split_participants (bill_id);
CREATE INDEX IF NOT EXISTS idx_split_items_bill ON public.split_items (bill_id);

-- 6. SUBSCRIPTIONS & PUSH NOTIFICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' | 'yearly' | 'weekly'
  next_renewal_date DATE NOT NULL,
  payment_platform TEXT NOT NULL DEFAULT 'Google Play',
  category TEXT NOT NULL DEFAULT 'Entertainment',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'paused' | 'cancelled'
  reminder_days_before INTEGER NOT NULL DEFAULT 2,
  is_split BOOLEAN NOT NULL DEFAULT false,
  split_config JSONB NOT NULL DEFAULT '{"split_mode":"equal","friends":[],"auto_create_split_bill":true,"auto_log_to_expenses":true}'::jsonb,
  last_split_bill_id UUID REFERENCES public.split_bills(id) ON DELETE SET NULL,
  last_processed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can manage their own subscriptions"
  ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON public.subscriptions (next_renewal_date, status);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions (user_id);

-- 7. EMAIL TRANSACTIONS (LIVIN' MANDIRI & WEBHOOKS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'livin_mandiri',
  sender TEXT,
  subject TEXT,
  merchant_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'IDR',
  transaction_date DATE NOT NULL,
  transaction_time TIME,
  reference_id TEXT,
  suggested_category TEXT NOT NULL DEFAULT 'Food & Dining',
  target_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed', 'auto_logged')),
  logged_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  raw_email_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_tx_user_ref
  ON public.email_transactions (user_id, reference_id)
  WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_tx_user_status
  ON public.email_transactions (user_id, status, created_at DESC);

ALTER TABLE public.email_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_transactions_user_policy" ON public.email_transactions;
CREATE POLICY "email_transactions_user_policy"
  ON public.email_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ingestion RPC Function
CREATE OR REPLACE FUNCTION public.ingest_email_transaction(
  p_token TEXT,
  p_merchant TEXT,
  p_amount NUMERIC,
  p_date DATE,
  p_time TIME,
  p_ref TEXT,
  p_category TEXT,
  p_sender TEXT DEFAULT NULL,
  p_subject TEXT DEFAULT NULL,
  p_snippet TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_mode TEXT;
  v_setting_wallet_id UUID;
  v_target_wallet_id UUID;
  v_existing_tx UUID;
  v_new_tx_id UUID;
  v_expense_id UUID;
  v_result JSONB;
BEGIN
  SELECT user_id, email_sync_mode, email_sync_wallet_id
  INTO v_user_id, v_mode, v_setting_wallet_id
  FROM public.user_settings
  WHERE email_sync_token = p_token AND email_sync_enabled = true
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_TOKEN',
      'message', 'User not found or email sync disabled for this token.'
    );
  END IF;

  IF p_ref IS NOT NULL AND trim(p_ref) != '' THEN
    SELECT id INTO v_existing_tx
    FROM public.email_transactions
    WHERE user_id = v_user_id AND reference_id = trim(p_ref)
    LIMIT 1;

    IF v_existing_tx IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'DUPLICATE_TRANSACTION',
        'message', 'This transaction has already been recorded.',
        'transaction_id', v_existing_tx
      );
    END IF;
  END IF;

  v_target_wallet_id := v_setting_wallet_id;
  IF v_target_wallet_id IS NULL THEN
    SELECT default_wallet_id INTO v_target_wallet_id
    FROM public.user_settings
    WHERE user_id = v_user_id;
  END IF;

  IF v_mode = 'auto' THEN
    INSERT INTO public.expenses (
      user_id,
      wallet_id,
      name,
      amount,
      category,
      spent_at,
      note
    ) VALUES (
      v_user_id,
      v_target_wallet_id,
      p_merchant,
      p_amount,
      COALESCE(p_category, 'Food & Dining'),
      p_date,
      CASE 
        WHEN p_ref IS NOT NULL AND trim(p_ref) != '' 
        THEN 'Auto-logged via Livin'' QRIS (' || trim(p_ref) || ')' 
        ELSE 'Auto-logged via Livin'' QRIS' 
      END
    )
    RETURNING id INTO v_expense_id;

    INSERT INTO public.email_transactions (
      user_id,
      source,
      sender,
      subject,
      merchant_name,
      amount,
      currency,
      transaction_date,
      transaction_time,
      reference_id,
      suggested_category,
      target_wallet_id,
      status,
      logged_expense_id,
      raw_email_snippet
    ) VALUES (
      v_user_id,
      'livin_mandiri',
      p_sender,
      p_subject,
      p_merchant,
      p_amount,
      'IDR',
      p_date,
      p_time,
      p_ref,
      COALESCE(p_category, 'Food & Dining'),
      v_target_wallet_id,
      'auto_logged',
      v_expense_id,
      p_snippet
    )
    RETURNING id INTO v_new_tx_id;

    v_result := jsonb_build_object(
      'success', true,
      'mode', 'auto',
      'user_id', v_user_id,
      'transaction_id', v_new_tx_id,
      'expense_id', v_expense_id,
      'merchant', p_merchant,
      'amount', p_amount,
      'date', p_date,
      'wallet_id', v_target_wallet_id
    );
  ELSE
    INSERT INTO public.email_transactions (
      user_id,
      source,
      sender,
      subject,
      merchant_name,
      amount,
      currency,
      transaction_date,
      transaction_time,
      reference_id,
      suggested_category,
      target_wallet_id,
      status,
      raw_email_snippet
    ) VALUES (
      v_user_id,
      'livin_mandiri',
      p_sender,
      p_subject,
      p_merchant,
      p_amount,
      'IDR',
      p_date,
      p_time,
      p_ref,
      COALESCE(p_category, 'Food & Dining'),
      v_target_wallet_id,
      'pending',
      p_snippet
    )
    RETURNING id INTO v_new_tx_id;

    v_result := jsonb_build_object(
      'success', true,
      'mode', 'review',
      'user_id', v_user_id,
      'transaction_id', v_new_tx_id,
      'merchant', p_merchant,
      'amount', p_amount,
      'date', p_date,
      'wallet_id', v_target_wallet_id
    );
  END IF;

  RETURN v_result;
END;
$$;

-- Verification Code Helper RPC
CREATE OR REPLACE FUNCTION public.save_email_verification_code(
  p_token TEXT,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.user_settings
  SET last_email_verification_code = p_code
  WHERE email_sync_token = p_token;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RETURN jsonb_build_object('success', true, 'code', p_code);
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'TOKEN_NOT_FOUND');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_email_verification_code(TEXT, TEXT) TO anon, authenticated, service_role;
