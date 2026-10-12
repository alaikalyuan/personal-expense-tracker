-- ==============================================================================
-- SakuTrack Email Transaction Detection Schema (Livin' by Mandiri & Webhook Sync)
-- ==============================================================================

-- 1. Extend user_settings table with email sync configurations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'email_sync_enabled'
  ) THEN
    ALTER TABLE public.user_settings
      ADD COLUMN email_sync_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'email_sync_token'
  ) THEN
    ALTER TABLE public.user_settings
      ADD COLUMN email_sync_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'email_sync_mode'
  ) THEN
    ALTER TABLE public.user_settings
      ADD COLUMN email_sync_mode TEXT NOT NULL DEFAULT 'review' CHECK (email_sync_mode IN ('auto', 'review'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'email_sync_wallet_id'
  ) THEN
    ALTER TABLE public.user_settings
      ADD COLUMN email_sync_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Populate email_sync_token for existing user_settings rows if null
UPDATE public.user_settings
SET email_sync_token = encode(gen_random_bytes(16), 'hex')
WHERE email_sync_token IS NULL;

-- 3. Email Transactions Table (Audit trail & Human Review Queue)
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

-- Deduplication index: prevent double recording of the same transaction reference for a user
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_tx_user_ref
  ON public.email_transactions (user_id, reference_id)
  WHERE reference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_tx_user_status
  ON public.email_transactions (user_id, status, created_at DESC);

-- Enable RLS
ALTER TABLE public.email_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_transactions_user_policy" ON public.email_transactions;
CREATE POLICY "email_transactions_user_policy"
  ON public.email_transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Ingestion RPC function (Callable securely by webhook handler or API)
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
  -- 1. Find user by email_sync_token
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

  -- 2. Check for duplicate reference
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

  -- 3. Determine target wallet
  IF v_setting_wallet_id IS NOT NULL THEN
    v_target_wallet_id := v_setting_wallet_id;
  ELSE
    SELECT id INTO v_target_wallet_id
    FROM public.wallets
    WHERE user_id = v_user_id AND is_primary = true AND kind = 'spending'
    LIMIT 1;
  END IF;

  -- 4. Process based on user preference (Auto vs Review)
  IF v_mode = 'auto' THEN
    -- Insert directly into public.expenses
    INSERT INTO public.expenses (
      user_id,
      category,
      name,
      note,
      amount,
      spent_at,
      wallet_id
    ) VALUES (
      v_user_id,
      COALESCE(p_category, 'Food & Dining'),
      p_merchant,
      'QRIS Livin by Mandiri',
      p_amount,
      p_date,
      v_target_wallet_id
    )
    RETURNING id INTO v_expense_id;

    -- Record in email_transactions as auto_logged
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
    -- Human Review mode: stage in email_transactions as pending
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
