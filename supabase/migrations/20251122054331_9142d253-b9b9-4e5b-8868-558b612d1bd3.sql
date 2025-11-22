-- Security Fix: Protect sensitive fishermen data from public exposure

-- 1. Drop the overly permissive public policy
DROP POLICY IF EXISTS "Everyone can view verified fishermen" ON public.fishermen;

-- 2. Create a public view excluding sensitive fields (phone, SIRET, license_number)
CREATE OR REPLACE VIEW public.public_fishermen AS
SELECT 
  id,
  user_id,
  boat_name,
  boat_registration,
  bio,
  photo_url,
  company_name,
  description,
  fishing_methods,
  fishing_zones,
  fishing_zones_geojson,
  verified_at,
  created_at,
  updated_at
FROM public.fishermen
WHERE verified_at IS NOT NULL;

-- 3. Grant access to the public view
GRANT SELECT ON public.public_fishermen TO authenticated, anon;

-- 4. Ensure the restricted policy on fishermen table allows owners and admins full access
-- (The existing "Fishermen can view their own profile" and "Admins can view all fishermen" policies already cover this)

-- 5. Add a comment explaining the security model
COMMENT ON VIEW public.public_fishermen IS 'Public view of verified fishermen excluding sensitive PII (phone, SIRET, license_number) to prevent data harvesting and privacy violations.';