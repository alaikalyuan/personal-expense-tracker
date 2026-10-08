-- ==============================================================================
-- SakuTrack Multi-Saku Backfill Migration Script
-- Backfills existing user metadata, expenses, and savings into new tables.
-- ==============================================================================

DO $$
DECLARE
  u RECORD;
  v_main_wallet_id UUID;
  v_savings_wallet_id UUID;
  v_goal RECORD;
  v_hist RECORD;
  v_tx_id UUID;
  v_manual_deposit NUMERIC;
  v_inflows NUMERIC;
  v_outflows NUMERIC;
BEGIN
  -- 1. Ensure user_settings and default wallets exist for each user
  FOR u IN SELECT id, raw_user_meta_data FROM auth.users LOOP
    -- Call idempotent function to set up settings & wallets
    v_main_wallet_id := public.ensure_default_wallets(u.id);

    SELECT id INTO v_savings_wallet_id
    FROM public.wallets
    WHERE user_id = u.id AND kind = 'stash'
    LIMIT 1;

    -- 2. Backfill weekly & monthly budgets into the primary wallet
    UPDATE public.wallets
    SET
      weekly_budget = COALESCE((u.raw_user_meta_data->>'weekly_budget')::numeric, weekly_budget),
      monthly_budget = COALESCE((u.raw_user_meta_data->>'monthly_budget')::numeric, monthly_budget)
    WHERE id = v_main_wallet_id;

    -- 3. Backfill savings goals if present in metadata and not yet in savings_goals
    IF u.raw_user_meta_data ? 'savings_goals' AND jsonb_typeof(u.raw_user_meta_data->'savings_goals') = 'array' THEN
      FOR v_goal IN
        SELECT
          CASE
            WHEN elem->>'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN (elem->>'id')::uuid
            ELSE md5(elem->>'id')::uuid
          END AS goal_id,
          COALESCE(elem->>'name', 'Goal') AS name,
          COALESCE(elem->>'emoji', '🎯') AS emoji,
          COALESCE((elem->>'targetAmount')::numeric, (elem->>'target_amount')::numeric, 0) AS target_amount,
          COALESCE((elem->>'allocatedAmount')::numeric, (elem->>'allocated_amount')::numeric, 0) AS allocated_amount,
          elem->>'createdAt' AS created_at_str
        FROM jsonb_array_elements(u.raw_user_meta_data->'savings_goals') AS elem
      LOOP
        INSERT INTO public.savings_goals (
          id, wallet_id, user_id, name, emoji, target_amount, allocated_amount, sort_order, created_at, updated_at
        ) VALUES (
          v_goal.goal_id,
          v_savings_wallet_id,
          u.id,
          v_goal.name,
          v_goal.emoji,
          v_goal.target_amount,
          v_goal.allocated_amount,
          0,
          COALESCE(v_goal.created_at_str::timestamptz, now()),
          now()
        )
        ON CONFLICT (id) DO UPDATE SET
          target_amount = EXCLUDED.target_amount,
          allocated_amount = EXCLUDED.allocated_amount,
          name = EXCLUDED.name,
          emoji = EXCLUDED.emoji;
      END LOOP;
    END IF;

    -- 4. Backfill savings history transactions if present in metadata and not yet in wallet_transactions
    IF u.raw_user_meta_data ? 'savings_history' AND jsonb_typeof(u.raw_user_meta_data->'savings_history') = 'array' THEN
      FOR v_hist IN
        SELECT
          elem->>'id' AS raw_id,
          elem->>'type' AS tx_type,
          (elem->>'amount')::numeric AS amount,
          elem->>'note' AS note,
          elem->>'date' AS date_str,
          elem->>'weekId' AS week_id
        FROM jsonb_array_elements(u.raw_user_meta_data->'savings_history') AS elem
        WHERE (elem->>'amount')::numeric IS NOT NULL AND (elem->>'amount')::numeric > 0
      LOOP
        IF v_hist.raw_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
          v_tx_id := v_hist.raw_id::uuid;
        ELSE
          v_tx_id := md5(u.id::text || ':' || v_hist.raw_id)::uuid;
        END IF;

        -- Avoid inserting if same transaction note, amount, and date already exists
        IF NOT EXISTS (
          SELECT 1 FROM public.wallet_transactions
          WHERE user_id = u.id
            AND amount = v_hist.amount
            AND (note = v_hist.note OR (note IS NULL AND v_hist.note IS NULL))
            AND occurred_on = COALESCE(v_hist.date_str::date, CURRENT_DATE)
        ) THEN
          INSERT INTO public.wallet_transactions (
            id,
            user_id,
            type,
            amount,
            currency,
            from_wallet_id,
            to_wallet_id,
            week_id,
            note,
            occurred_on,
            created_at
          ) VALUES (
            v_tx_id,
            u.id,
            CASE
              WHEN v_hist.tx_type = 'sweep' THEN 'surplus_sweep'
              ELSE 'adjustment'
            END,
            v_hist.amount,
            'IDR',
            CASE
              WHEN v_hist.tx_type = 'decrease' THEN v_savings_wallet_id
              ELSE NULL
            END,
            CASE
              WHEN v_hist.tx_type IN ('increase', 'sweep') THEN v_savings_wallet_id
              ELSE NULL
            END,
            v_hist.week_id,
            v_hist.note,
            COALESCE(v_hist.date_str::date, CURRENT_DATE),
            COALESCE(v_hist.date_str::timestamptz, now())
          )
          ON CONFLICT (id) DO NOTHING;
        END IF;
      END LOOP;
    END IF;

    -- 5. Calculate correct opening_balance for savings wallet to avoid double-counting
    -- current_balance = opening_balance + inflows - outflows
    -- We want current_balance == savings_manual_deposit
    -- Therefore: opening_balance = savings_manual_deposit - (inflows - outflows)
    v_manual_deposit := COALESCE((u.raw_user_meta_data->>'savings_manual_deposit')::numeric, 0);

    SELECT COALESCE(SUM(amount), 0) INTO v_inflows
    FROM public.wallet_transactions
    WHERE to_wallet_id = v_savings_wallet_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_outflows
    FROM public.wallet_transactions
    WHERE from_wallet_id = v_savings_wallet_id;

    UPDATE public.wallets
    SET opening_balance = GREATEST(0, v_manual_deposit - (v_inflows - v_outflows))
    WHERE id = v_savings_wallet_id;

  END LOOP;

  -- 6. Ensure all expenses have wallet_id populated
  UPDATE public.expenses e
  SET wallet_id = s.default_wallet_id
  FROM public.user_settings s
  WHERE e.user_id = s.user_id AND e.wallet_id IS NULL;

  -- 7. Ensure all subscriptions have pay_from_wallet_id populated (if column exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'pay_from_wallet_id'
  ) THEN
    UPDATE public.subscriptions sub
    SET pay_from_wallet_id = s.default_wallet_id
    FROM public.user_settings s
    WHERE sub.user_id = s.user_id AND sub.pay_from_wallet_id IS NULL;
  END IF;

END $$;
