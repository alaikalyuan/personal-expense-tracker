-- ==============================================================================
-- Migration: 20261113082149_add_get_shared_split_bill.sql
-- Audit 002, A002-01, step 1 of 2. Adds the function the friend view uses to read
-- one split bill by ID. Additive only: the public read policies stay until the
-- app that calls this function is deployed (step 2 drops them).
-- The creator's user ID and linked expense ID are returned to the creator only.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_shared_split_bill(p_bill_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_bill public.split_bills%ROWTYPE;
  v_is_host BOOLEAN;
BEGIN
  IF p_bill_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_bill FROM public.split_bills WHERE id = p_bill_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_is_host := auth.uid() IS NOT NULL AND auth.uid() = v_bill.creator_id;

  RETURN jsonb_build_object(
    'is_host', v_is_host,
    'bill', jsonb_build_object(
      'id', v_bill.id,
      'creator_id', CASE WHEN v_is_host THEN v_bill.creator_id END,
      'title', v_bill.title,
      'split_mode', v_bill.split_mode,
      'tax_percentage', v_bill.tax_percentage,
      'service_percentage', v_bill.service_percentage,
      'discount_amount', v_bill.discount_amount,
      'extra_fee', v_bill.extra_fee,
      'rounding_step', v_bill.rounding_step,
      'payment_info', v_bill.payment_info,
      'category', v_bill.category,
      'logged_expense_id', CASE WHEN v_is_host THEN v_bill.logged_expense_id END,
      'status', v_bill.status,
      'created_at', v_bill.created_at,
      'updated_at', v_bill.updated_at
    ),
    'participants', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'bill_id', p.bill_id,
          'name', p.name,
          'is_creator', p.is_creator,
          'is_paid', p.is_paid,
          'paid_at', p.paid_at
        )
        ORDER BY p.is_creator DESC
      )
      FROM public.split_participants p
      WHERE p.bill_id = v_bill.id
    ), '[]'::jsonb),
    'items', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', i.id,
          'bill_id', i.bill_id,
          'name', i.name,
          'price', i.price,
          'quantity', i.quantity,
          'assigned_participant_ids', i.assigned_participant_ids
        )
      )
      FROM public.split_items i
      WHERE i.bill_id = v_bill.id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_split_bill(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_split_bill(UUID) TO anon, authenticated, service_role;
