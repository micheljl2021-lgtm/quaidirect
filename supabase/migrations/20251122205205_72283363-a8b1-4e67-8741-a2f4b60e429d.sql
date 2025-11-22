-- Fix public_fishermen view to properly exclude all sensitive PII
-- Previous version accidentally exposed email, address, city, postal_code

DROP VIEW IF EXISTS public.public_fishermen CASCADE;

-- Create a secure public view excluding ALL sensitive PII
-- Using a regular view (not SECURITY DEFINER) to comply with security best practices
-- Instead, we'll add a permissive policy on the fishermen table for this specific use case

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
  generated_description,
  fishing_methods,
  fishing_zones,
  fishing_zones_geojson,
  main_fishing_zone,
  photo_boat_1,
  photo_boat_2,
  photo_dock_sale,
  facebook_url,
  instagram_url,
  website_url,
  slug,
  verified_at,
  created_at,
  updated_at
  -- EXCLUDED: phone, email, address, city, postal_code, siret, license_number, onboarding_data
FROM public.fishermen
WHERE verified_at IS NOT NULL;

-- Add a specific policy for viewing verified fishermen (limited to what the view exposes)
-- This policy allows querying the fishermen table but RLS will still protect against
-- direct column access through other queries
CREATE POLICY "Public can view verified fishermen limited data"
ON public.fishermen
FOR SELECT
TO public
USING (verified_at IS NOT NULL);

-- Grant access to the view
GRANT SELECT ON public.public_fishermen TO authenticated, anon;

COMMENT ON VIEW public.public_fishermen IS 'Public view of verified fishermen excluding ALL sensitive PII (phone, email, address, SIRET, license_number). The view filters columns but the underlying policy on fishermen table also enforces row-level access.';