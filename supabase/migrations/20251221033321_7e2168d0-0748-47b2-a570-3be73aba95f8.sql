-- 1. Drop the existing view
DROP VIEW IF EXISTS public_fishermen;

-- 2. Recreate the view with explicit SECURITY INVOKER (default, no more warning)
CREATE VIEW public.public_fishermen 
WITH (security_invoker = true)
AS
SELECT 
  id, boat_name, company_name, bio, description, generated_description,
  photo_url, favorite_photo_url, photo_boat_1, photo_boat_2, photo_dock_sale,
  fishing_methods, fishing_zones, main_fishing_zone,
  passion_quote, work_philosophy, years_experience,
  facebook_url, instagram_url, website_url, slug, verified_at, is_ambassador,
  seo_title, seo_meta_description, seo_keywords, seo_long_content,
  seo_how_to_order, seo_hours_location, created_at
FROM fishermen
WHERE verified_at IS NOT NULL;

-- 3. Grant permissions to the view
GRANT SELECT ON public.public_fishermen TO anon, authenticated;

-- 4. Add RLS policy on fishermen table for anonymous read access to verified fishermen
-- First check if policy exists and drop it
DROP POLICY IF EXISTS "Allow anonymous read access to verified fishermen" ON fishermen;

-- Create the policy
CREATE POLICY "Allow anonymous read access to verified fishermen" 
ON fishermen 
FOR SELECT 
TO anon 
USING (verified_at IS NOT NULL);