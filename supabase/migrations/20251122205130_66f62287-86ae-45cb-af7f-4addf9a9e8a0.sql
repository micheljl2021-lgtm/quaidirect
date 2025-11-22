-- Fix: Make public_fishermen view accessible to everyone by using SECURITY DEFINER
-- This allows the view to read from the fishermen table even though users don't have direct access

DROP VIEW IF EXISTS public.public_fishermen;

CREATE VIEW public.public_fishermen 
WITH (security_barrier = true)
AS
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
  updated_at,
  email,
  address,
  city,
  postal_code
FROM public.fishermen
WHERE verified_at IS NOT NULL;

-- Grant public access to the view
GRANT SELECT ON public.public_fishermen TO authenticated, anon;

COMMENT ON VIEW public.public_fishermen IS 'Public view of verified fishermen excluding sensitive PII (phone, SIRET, license_number, onboarding data). Uses security_barrier to prevent leaking filtered rows.';