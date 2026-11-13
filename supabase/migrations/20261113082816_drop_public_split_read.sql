-- ==============================================================================
-- Migration: 20261113082816_drop_public_split_read.sql
-- Audit 002, A002-01, step 2 of 2. The "Public read" policies let anyone holding
-- the publishable key list every split bill, participant, item and payment detail.
-- Apply only after the app reading through get_shared_split_bill() is deployed.
-- Afterwards only the creator reads the split tables directly ("Creator manage").
-- ==============================================================================

DROP POLICY IF EXISTS "Public read split_bills" ON public.split_bills;
DROP POLICY IF EXISTS "Public read split_participants" ON public.split_participants;
DROP POLICY IF EXISTS "Public read split_items" ON public.split_items;
