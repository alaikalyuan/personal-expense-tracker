-- ==============================================================================
-- Migration: 20261105182446_lock_down_public_functions.sql
-- Goal: Remove API access to SECURITY DEFINER functions that don't need it.
--
-- get_due_subscriptions_for_cron_v2 and get_push_subscriptions_for_user stay open
-- until the cron route runs on a service-role key.
-- ingest_email_transaction and save_email_verification_code stay open because the
-- inbound email route calls them with the publishable key; both require a user's
-- email sync token.
-- ==============================================================================

-- Trigger functions never need to be callable through the API. Firing a trigger does not check EXECUTE.
REVOKE ALL ON FUNCTION public.handle_new_expense_wallet() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_update_expense_wallet() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_wallets() FROM PUBLIC, anon, authenticated;

-- No code calls these.
REVOKE ALL ON FUNCTION public.perform_multi_saku_cleanup() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_due_subscriptions_for_cron() FROM PUBLIC, anon, authenticated;

-- Signed-in users may only provision their own wallets. A NULL auth.uid() is the
-- internal path: the expense trigger firing during token-checked email ingestion.
-- Logged-out callers can't reach it directly once anon loses EXECUTE below.
CREATE OR REPLACE FUNCTION public.ensure_default_wallets(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_main_wallet_id UUID;
  v_savings_wallet_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not allowed to create wallets for another user' USING ERRCODE = '42501';
  END IF;

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

REVOKE ALL ON FUNCTION public.ensure_default_wallets(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_default_wallets(UUID) TO authenticated, service_role;
