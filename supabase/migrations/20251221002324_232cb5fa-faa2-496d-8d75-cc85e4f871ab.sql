-- Recréer la vue public_fishermen avec SECURITY DEFINER pour permettre l'accès anonyme
DROP VIEW IF EXISTS public_fishermen;

CREATE VIEW public_fishermen WITH (security_invoker = false) AS
SELECT 
  id,
  boat_name,
  company_name,
  bio,
  description,
  generated_description,
  photo_url,
  favorite_photo_url,
  photo_boat_1,
  photo_boat_2,
  photo_dock_sale,
  fishing_methods,
  fishing_zones,
  main_fishing_zone,
  passion_quote,
  work_philosophy,
  years_experience,
  facebook_url,
  instagram_url,
  website_url,
  slug,
  verified_at,
  is_ambassador,
  seo_title,
  seo_meta_description,
  seo_keywords,
  seo_long_content,
  seo_how_to_order,
  seo_hours_location,
  created_at
FROM fishermen
WHERE verified_at IS NOT NULL;

-- Autoriser l'accès anonyme à la vue
GRANT SELECT ON public_fishermen TO anon;
GRANT SELECT ON public_fishermen TO authenticated;