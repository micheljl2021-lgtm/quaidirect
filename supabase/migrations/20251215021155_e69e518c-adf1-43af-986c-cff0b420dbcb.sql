-- Update public_fishermen view to include non-verified fishermen
-- This allows anonymous users to view fisherman profiles from email links
-- Sensitive data (email, phone, SIRET, address, user_id) remains excluded

DROP VIEW IF EXISTS public.public_fishermen;

CREATE VIEW public.public_fishermen AS
SELECT 
  id,
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
  seo_enriched_at,
  favorite_photo_url,
  affiliate_code,
  client_message
FROM fishermen
WHERE slug IS NOT NULL; -- Only require slug to be set (for URL access)

-- Grant select access to public (anon and authenticated)
GRANT SELECT ON public.public_fishermen TO anon, authenticated;

COMMENT ON VIEW public.public_fishermen IS 'Public view of fishermen profiles - excludes sensitive data (email, phone, SIRET, address, user_id). Includes both verified and non-verified fishermen with a slug.';