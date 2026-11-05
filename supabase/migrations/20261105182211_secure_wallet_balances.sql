-- ==============================================================================
-- Migration: 20261105182211_secure_wallet_balances.sql
-- Goal: Stop wallet_balances from exposing every user's wallets.
--
-- The view ran with its owner's permissions, which skipped row-level security on
-- wallets, wallet_transactions and expenses. Anyone holding the publishable key
-- could read all rows without logging in.
--
-- With security_invoker the view applies the caller's own permissions and RLS, so
-- signed-in users (guests included) see only their own wallets.
-- ==============================================================================

BEGIN;

ALTER VIEW public.wallet_balances SET (security_invoker = true);

REVOKE ALL ON public.wallet_balances FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.wallet_balances TO authenticated, service_role;

COMMIT;
