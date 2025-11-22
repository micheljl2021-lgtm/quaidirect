-- Corriger la vue public_fishermen pour ne pas utiliser SECURITY DEFINER
-- La vue doit respecter les politiques RLS de l'utilisateur qui effectue la requête
DROP VIEW IF EXISTS public.public_fishermen CASCADE;
CREATE VIEW public.public_fishermen 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  boat_name,
  boat_registration,
  company_name,
  description,
  bio,
  photo_url,
  fishing_methods,
  fishing_zones,
  fishing_zones_geojson,
  verified_at,
  created_at,
  updated_at,
  address,
  postal_code,
  city,
  email,
  facebook_url,
  instagram_url,
  website_url,
  main_fishing_zone,
  photo_boat_1,
  photo_boat_2,
  photo_dock_sale,
  generated_description,
  slug
FROM public.fishermen
WHERE verified_at IS NOT NULL;