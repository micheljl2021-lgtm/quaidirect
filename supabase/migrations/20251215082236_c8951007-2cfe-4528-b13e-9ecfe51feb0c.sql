-- Allow authenticated users to read their own whitelist entry (based on JWT email)
-- This prevents RLS errors in ProtectedFisherRoute when checking whitelist status

CREATE POLICY "Users can read own whitelist entry"
ON public.fisherman_whitelist
FOR SELECT
TO authenticated
USING (
  lower(email) = lower((auth.jwt() ->> 'email'))
);