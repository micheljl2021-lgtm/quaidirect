-- Fix overly permissive RLS policy on fishermen_sms_usage
-- The current policy with USING (true) allows any authenticated user to manage SMS usage

DROP POLICY IF EXISTS "Service role can manage SMS usage" ON fishermen_sms_usage;

-- Create a restrictive policy that only allows service_role to manage SMS usage
-- This is done by granting to service_role role specifically
CREATE POLICY "Service role only manages SMS usage" ON fishermen_sms_usage
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);