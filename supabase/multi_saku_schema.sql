-- ==============================================================================
-- SakuTrack Multi-Saku Schema (Phase 2 Data Foundation)
-- Tables: user_settings, wallets, savings_goals, wallet_transactions
-- View: wallet_balances
-- Triggers: handle_new_expense_wallet, handle_update_expense_wallet, handle_new_user_wallets
-- ==============================================================================

-- 1. USER SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  base_currency TEXT NOT NULL DEFAULT 'IDR',
  multi_saku_enabled BOOLEAN NOT NULL DEFAULT false,
  default_wallet_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_owner_policy"
  ON public.user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. WALLETS TABLE
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

CREATE POLICY "wallets_owner_policy"
  ON public.wallets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wallets_user_kind ON public.wallets (user_id, kind);
CREATE INDEX IF NOT EXISTS idx_wallets_user_archived ON public.wallets (user_id, archived_at);

-- Foreign key from user_settings.default_wallet_id to wallets.id
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
END $$;

-- 3. SAVINGS GOALS TABLE
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

CREATE POLICY "savings_goals_owner_policy"
  ON public.savings_goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_savings_goals_wallet ON public.savings_goals (wallet_id);

-- 4. WALLET TRANSACTIONS TABLE
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

CREATE POLICY "wallet_transactions_owner_policy"
  ON public.wallet_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_date ON public.wallet_transactions (user_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_from_to ON public.wallet_transactions (from_wallet_id, to_wallet_id);

-- 5. WALLET BALANCES VIEW
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

-- 6. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.ensure_default_wallets(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_main_wallet_id uuid;
  v_savings_wallet_id uuid;
BEGIN
  -- 1. Ensure user_settings exists
  INSERT INTO public.user_settings (user_id, base_currency, multi_saku_enabled)
  VALUES (p_user_id, 'IDR', false)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2. Check if primary spending wallet exists
  SELECT id INTO v_main_wallet_id
  FROM public.wallets
  WHERE user_id = p_user_id AND is_primary = true AND kind = 'spending'
  LIMIT 1;

  IF v_main_wallet_id IS NULL THEN
    INSERT INTO public.wallets (
      user_id, kind, name, emoji, color, currency, is_primary, track_balance, opening_balance, sort_order
    ) VALUES (
      p_user_id, 'spending', 'Dompet Utama', '👛', '#10b981', 'IDR', true, false, 0, 0
    )
    RETURNING id INTO v_main_wallet_id;
  END IF;

  -- 3. Check if stash wallet (Tabungan) exists
  SELECT id INTO v_savings_wallet_id
  FROM public.wallets
  WHERE user_id = p_user_id AND kind = 'stash'
  LIMIT 1;

  IF v_savings_wallet_id IS NULL THEN
    INSERT INTO public.wallets (
      user_id, kind, name, emoji, color, currency, is_primary, track_balance, opening_balance, sort_order
    ) VALUES (
      p_user_id, 'stash', 'Tabungan', '🏦', '#0d9488', 'IDR', false, true, 0, 1
    )
    RETURNING id INTO v_savings_wallet_id;
  END IF;

  -- 4. Update default_wallet_id in user_settings if not set
  UPDATE public.user_settings
  SET default_wallet_id = v_main_wallet_id
  WHERE user_id = p_user_id AND default_wallet_id IS NULL;

  RETURN v_main_wallet_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_expense_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  IF NEW.wallet_id IS NULL THEN
    SELECT default_wallet_id INTO v_wallet_id
    FROM public.user_settings
    WHERE user_id = NEW.user_id;

    IF v_wallet_id IS NULL THEN
      v_wallet_id := public.ensure_default_wallets(NEW.user_id);
    END IF;

    NEW.wallet_id := v_wallet_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_update_expense_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.wallet_id IS NULL THEN
    NEW.wallet_id := OLD.wallet_id;
    IF NEW.wallet_id IS NULL THEN
      NEW.wallet_id := public.ensure_default_wallets(NEW.user_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_wallets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.ensure_default_wallets(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_expense_set_default_wallet ON public.expenses;
CREATE TRIGGER on_expense_set_default_wallet
  BEFORE INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_expense_wallet();

DROP TRIGGER IF EXISTS on_expense_update_wallet ON public.expenses;
CREATE TRIGGER on_expense_update_wallet
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION handle_update_expense_wallet();

DROP TRIGGER IF EXISTS on_auth_user_created_wallets ON auth.users;
CREATE TRIGGER on_auth_user_created_wallets
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_wallets();
