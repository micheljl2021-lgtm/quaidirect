-- Supprimer la vue et la fonction, puis les recréer avec is_ambassador

-- 1. Supprimer la vue qui dépend de la fonction
DROP VIEW IF EXISTS public.public_fishermen CASCADE;

-- 2. Supprimer la fonction
DROP FUNCTION IF EXISTS public.get_public_fishermen() CASCADE;

-- 3. Recréer la fonction avec is_ambassador
CREATE FUNCTION public.get_public_fishermen()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  boat_name text,
  boat_registration text,
  bio text,
  photo_url text,
  company_name text,
  description text,
  generated_description text,
  fishing_methods fishing_method[],
  fishing_zones text[],
  fishing_zones_geojson jsonb,
  main_fishing_zone text,
  photo_boat_1 text,
  photo_boat_2 text,
  photo_dock_sale text,
  facebook_url text,
  instagram_url text,
  website_url text,
  slug text,
  is_ambassador boolean,
  verified_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT 
    f.id,
    f.user_id,
    f.boat_name,
    f.boat_registration,
    f.bio,
    f.photo_url,
    f.company_name,
    f.description,
    f.generated_description,
    f.fishing_methods,
    f.fishing_zones,
    f.fishing_zones_geojson,
    f.main_fishing_zone,
    f.photo_boat_1,
    f.photo_boat_2,
    f.photo_dock_sale,
    f.facebook_url,
    f.instagram_url,
    f.website_url,
    f.slug,
    f.is_ambassador,
    f.verified_at,
    f.created_at,
    f.updated_at
  FROM public.fishermen f
  WHERE f.verified_at IS NOT NULL;
$function$;

-- 4. Recréer la vue
CREATE VIEW public.public_fishermen AS 
SELECT * FROM public.get_public_fishermen();