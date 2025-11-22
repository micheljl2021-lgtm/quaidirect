-- Create a SECURITY DEFINER function to safely expose public fishermen data
-- This is the ONLY way to achieve column-level filtering with public access

-- Drop existing view
DROP VIEW IF EXISTS public.public_fishermen CASCADE;

-- Create a function that returns public fishermen data (column-filtered)
CREATE OR REPLACE FUNCTION public.get_public_fishermen()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  boat_name TEXT,
  boat_registration TEXT,
  bio TEXT,
  photo_url TEXT,
  company_name TEXT,
  description TEXT,
  generated_description TEXT,
  fishing_methods fishing_method[],
  fishing_zones TEXT[],
  fishing_zones_geojson JSONB,
  main_fishing_zone TEXT,
  photo_boat_1 TEXT,
  photo_boat_2 TEXT,
  photo_dock_sale TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  website_url TEXT,
  slug TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
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
    f.verified_at,
    f.created_at,
    f.updated_at
  FROM public.fishermen f
  WHERE f.verified_at IS NOT NULL;
$$;

-- Create a view that uses the function
CREATE OR REPLACE VIEW public.public_fishermen AS
SELECT * FROM public.get_public_fishermen();

-- Grant public access
GRANT EXECUTE ON FUNCTION public.get_public_fishermen() TO authenticated, anon;
GRANT SELECT ON public.public_fishermen TO authenticated, anon;

COMMENT ON FUNCTION public.get_public_fishermen() IS 'SECURITY DEFINER function to safely expose public fishermen data without sensitive PII (phone, email, address, SIRET). This function is necessary because RLS policies cannot filter at column level, only row level.';
COMMENT ON VIEW public.public_fishermen IS 'Public view of verified fishermen excluding sensitive PII. Uses SECURITY DEFINER function for column-level filtering.';