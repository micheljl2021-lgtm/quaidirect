-- Fix Security Definer View warning
-- Explicitly set SECURITY INVOKER on public_fishermen view to ensure it uses querying user's permissions

DROP VIEW IF EXISTS public.public_fishermen CASCADE;

CREATE VIEW public.public_fishermen 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  boat_name,
  boat_registration,
  company_name,
  bio,
  description,
  generated_description,
  photo_url,
  photo_boat_1,
  photo_boat_2,
  photo_dock_sale,
  fishing_methods,
  fishing_zones,
  fishing_zones_geojson,
  main_fishing_zone,
  slug,
  default_time_slot,
  display_name_preference,
  passion_quote,
  work_philosophy,
  years_experience,
  website_url,
  instagram_url,
  facebook_url,
  seo_title,
  seo_meta_description,
  seo_keywords,
  seo_long_content,
  seo_hours_location,
  seo_how_to_order,
  verified_at,
  is_ambassador,
  ambassador_slot,
  default_sale_point_id,
  zone_id,
  created_at,
  updated_at,
  seo_enriched_at
FROM public.fishermen
WHERE verified_at IS NOT NULL;

GRANT SELECT ON public.public_fishermen TO anon, authenticated;

COMMENT ON VIEW public.public_fishermen IS 'Public view of verified fishermen profiles without PII (phone, email, address, SIRET, postal_code, city). Uses SECURITY INVOKER to respect querying user permissions.';