-- CRITICAL FIX: Remove the overly permissive policy that was just added
-- That policy allows public SELECT on ALL columns of fishermen table, including phone!

DROP POLICY IF EXISTS "Public can view verified fishermen limited data" ON public.fishermen;

-- The public_fishermen view will remain, but without a public policy on fishermen table,
-- regular users won't be able to query it. This is intentional - we'll fix the view
-- to use SECURITY DEFINER properly, accepting the linter warning as this is the
-- only way to provide public access while hiding sensitive columns.

-- Note: Postgres RLS policies work at ROW level, not COLUMN level.
-- We cannot create a policy that says "allow SELECT but only certain columns".
-- Therefore, we MUST use SECURITY DEFINER or a function to achieve column-level filtering.