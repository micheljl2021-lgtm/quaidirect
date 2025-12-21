-- Recréer la vue public_fishermen avec SECURITY INVOKER au lieu de SECURITY DEFINER
-- Cela garantit que les requêtes respectent les RLS policies de l'utilisateur connecté

DROP VIEW IF EXISTS public.public_fishermen;

CREATE VIEW public.public_fishermen
WITH (security_invoker = true)
AS
SELECT 
  id,
  boat_name,
  boat_registration,
  company_name,
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
  bio,
  facebook_url,
  instagram_url,
  website_url,
  slug,
  verified_at,
  created_at,
  user_id,
  default_sale_point_id,
  display_name_preference,
  client_message,
  seo_title,
  seo_meta_description,
  seo_keywords,
  seo_long_content,
  seo_how_to_order,
  seo_hours_location,
  seo_enriched_at
FROM public.fishermen
WHERE verified_at IS NOT NULL;

-- Accorder les permissions de lecture sur la vue
GRANT SELECT ON public.public_fishermen TO anon, authenticated;