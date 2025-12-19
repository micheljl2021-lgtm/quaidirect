-- Allow fishermen to view all verified fishermen profiles
-- This is needed for joins when viewing arrivages from other fishermen in the same zone
CREATE POLICY "Fishermen can view all verified fishermen"
ON public.fishermen
FOR SELECT
USING (
  has_role(auth.uid(), 'fisherman'::app_role)
  AND verified_at IS NOT NULL
);