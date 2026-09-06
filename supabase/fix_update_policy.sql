-- Run this script in your Supabase Dashboard SQL Editor:
-- Go to https://supabase.com/dashboard -> Project -> SQL Editor -> New Query

-- 1. Ensure RLS is enabled on the expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 2. Drop the policy if it already exists with an incorrect definition
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;

-- 3. Create the UPDATE policy with both USING and WITH CHECK clauses
CREATE POLICY "Users can update their own expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
