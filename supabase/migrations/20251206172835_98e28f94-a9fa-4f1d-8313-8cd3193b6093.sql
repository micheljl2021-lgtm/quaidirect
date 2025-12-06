
-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audits;

-- Create a new restrictive INSERT policy that only allows service_role
-- Service role is used by Edge Functions and database triggers, not by users
CREATE POLICY "Only service role can insert audit logs"
ON public.audits
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also add a policy to explicitly block anonymous and authenticated users from inserting
CREATE POLICY "Block user access to insert audits"
ON public.audits
FOR INSERT
TO authenticated, anon
WITH CHECK (false);
