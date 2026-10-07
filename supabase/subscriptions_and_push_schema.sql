-- ==============================================================================
-- SakuTrack Subscriptions and Push Notifications Schema
-- ==============================================================================

-- 1. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly' | 'yearly' | 'weekly'
  next_renewal_date DATE NOT NULL,
  payment_platform TEXT NOT NULL DEFAULT 'Google Play', -- 'Google Play' | 'Apple App Store' | 'Spotify Direct' | 'Patreon' | 'Credit Card' | 'GoPay' | 'Dana' | 'Other'
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

CREATE POLICY "Users can manage their own subscriptions"
  ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal ON public.subscriptions (next_renewal_date, status);

-- 2. PUSH SUBSCRIPTIONS TABLE
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

CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.push_subscriptions (user_id);
