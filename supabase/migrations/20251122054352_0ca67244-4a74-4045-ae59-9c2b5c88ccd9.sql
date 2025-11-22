-- Fix: Make public_fishermen view use SECURITY INVOKER to avoid privilege escalation

DROP VIEW IF EXISTS public.public_fishermen;

CREATE VIEW public.public_fishermen 
WITH (security_invoker = true)
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
  fishing_methods,
  fishing_zones,
  fishing_zones_geojson,
  verified_at,
  created_at,
  updated_at
FROM public.fishermen
WHERE verified_at IS NOT NULL;

GRANT SELECT ON public.public_fishermen TO authenticated, anon;

COMMENT ON VIEW public.public_fishermen IS 'Public view of verified fishermen excluding sensitive PII (phone, SIRET, license_number). Uses SECURITY INVOKER to enforce RLS properly.';