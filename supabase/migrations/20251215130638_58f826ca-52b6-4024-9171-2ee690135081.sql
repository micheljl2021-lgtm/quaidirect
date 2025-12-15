-- Recréer la vue public_fishermen avec SECURITY DEFINER pour permettre l'accès anonyme
-- et sans filtre WHERE slug IS NOT NULL pour supporter les fallback par id

DROP VIEW IF EXISTS public_fishermen;

CREATE VIEW public_fishermen WITH (security_invoker = false) AS
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
  is_ambassador,
  ambassador_slot,
  default_sale_point_id,
  zone_id,
  created_at,
  updated_at,
  verified_at,
  instagram_url,
  facebook_url,
  website_url,
  seo_title,
  seo_meta_description,
  seo_keywords,
  seo_long_content,
  seo_how_to_order,
  seo_hours_location,
  seo_enriched_at,
  favorite_photo_url,
  affiliate_code,
  client_message,
  default_time_slot,
  display_name_preference,
  passion_quote,
  work_philosophy,
  years_experience
FROM fishermen
WHERE slug IS NOT NULL OR id IS NOT NULL;

-- Accorder les permissions SELECT à tous (anon et authenticated)
GRANT SELECT ON public_fishermen TO anon;
GRANT SELECT ON public_fishermen TO authenticated;