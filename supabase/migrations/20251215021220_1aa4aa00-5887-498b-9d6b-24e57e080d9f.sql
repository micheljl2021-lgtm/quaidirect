-- Re-add user_id to public_fishermen view (needed for ownership check)
-- This field is used to verify if the current user owns the profile
-- It's safe to expose as it's just a UUID reference

DROP VIEW IF EXISTS public.public_fishermen;

CREATE VIEW public.public_fishermen AS
SELECT 
  id,
  user_id, -- Needed for ownership check in frontend
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
WHERE slug IS NOT NULL;

GRANT SELECT ON public.public_fishermen TO anon, authenticated;

COMMENT ON VIEW public.public_fishermen IS 'Public view of fishermen profiles - excludes sensitive PII (email, phone, SIRET, address). Includes user_id for ownership verification. Shows all fishermen with a slug (verified or not).';