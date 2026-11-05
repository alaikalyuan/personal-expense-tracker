-- ==============================================================================
-- Migration: 20261013000000_cleanup_multi_saku.sql
-- Goal: Clean up triggers, orphan guest data, metadata dual-writes, and views
-- ==============================================================================

BEGIN;

-- 1. DROP UNWANTED AUTH TRIGGER
-- Stop automatic creation of wallets/settings for throwaway anonymous users
DROP TRIGGER IF EXISTS on_auth_user_created_wallets ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_wallets();

-- 2. UPDATE EXPENSE TRIGGER TO IGNORE ANONYMOUS GUESTS
-- Only assign default wallet for authenticated registered users; let guest expenses stay NULL
CREATE OR REPLACE FUNCTION public.handle_new_expense_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_is_anon BOOLEAN;
BEGIN
  -- Check if user is anonymous
  SELECT COALESCE(is_anonymous, false) INTO v_is_anon
  FROM auth.users
  WHERE id = NEW.user_id;

  -- For anonymous guests, do not generate wallets or force wallet_id
  IF v_is_anon THEN
    RETURN NEW;
  END IF;

  -- For registered users without a wallet_id, assign default wallet
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

-- 3. REFINE WALLET_BALANCES VIEW
-- Exclude transactions that already reference an expense to prevent double deductions
CREATE OR REPLACE VIEW public.wallet_balances AS
WITH inflows AS (
  SELECT
    wallet_transactions.to_wallet_id AS wallet_id,
    COALESCE(SUM(wallet_transactions.amount), 0::numeric) AS total_inflow
  FROM public.wallet_transactions
  WHERE wallet_transactions.to_wallet_id IS NOT NULL
  GROUP BY wallet_transactions.to_wallet_id
),
outflows AS (
  SELECT
    wallet_transactions.from_wallet_id AS wallet_id,
    COALESCE(SUM(wallet_transactions.amount), 0::numeric) AS total_outflow
  FROM public.wallet_transactions
  WHERE wallet_transactions.from_wallet_id IS NOT NULL
    AND wallet_transactions.expense_id IS NULL -- Prevent double-counting logged expenses
  GROUP BY wallet_transactions.from_wallet_id
),
expense_deductions AS (
  SELECT
    expenses.wallet_id,
    COALESCE(SUM(expenses.amount), 0::numeric) AS total_expenses
  FROM public.expenses
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
FROM public.wallets w
LEFT JOIN inflows inf ON inf.wallet_id = w.id
LEFT JOIN outflows outf ON outf.wallet_id = w.id
LEFT JOIN expense_deductions exp_ded ON exp_ded.wallet_id = w.id;

-- 4. CLEAN UP ORPHAN ANONYMOUS SESSIONS & WALLETS
-- Step 4a: Delete unused anonymous users from auth.users (cascades to their settings & wallets)
DELETE FROM auth.users u
WHERE u.is_anonymous = true
  AND NOT EXISTS (SELECT 1 FROM public.expenses e WHERE e.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.split_bills b WHERE b.creator_id = u.id);

-- Step 4b: Delete unused wallets for remaining anonymous users who have expenses
-- (Their expenses can remain with wallet_id = NULL until they register)
UPDATE public.expenses e
SET wallet_id = NULL
WHERE EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = e.user_id AND u.is_anonymous = true
);

DELETE FROM public.wallets w
WHERE EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = w.user_id AND u.is_anonymous = true
);

DELETE FROM public.user_settings s
WHERE EXISTS (
  SELECT 1 FROM auth.users u
  WHERE u.id = s.user_id AND u.is_anonymous = true
);

-- 5. ENSURE REGISTERED USERS HAVE WALLETS & USER_SETTINGS
DO $$
DECLARE
  u RECORD;
BEGIN
  FOR u IN SELECT id FROM auth.users WHERE is_anonymous = false LOOP
    PERFORM public.ensure_default_wallets(u.id);
  END LOOP;
END $$;

-- 6. PRUNE REDUNDANT KEYS FROM auth.users.raw_user_meta_data
-- Strip out legacy arrays and budget values now that tables are canonical
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data 
  - 'savings_goals'
  - 'savings_history'
  - 'savings_manual_deposit'
  - 'savings_swept_surplus'
  - 'savings_patches'
  - 'weekly_budget'
  - 'monthly_budget'
  - 'base_currency'
WHERE raw_user_meta_data IS NOT NULL;

COMMIT;
