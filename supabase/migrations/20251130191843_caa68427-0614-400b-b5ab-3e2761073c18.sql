-- Fix security issue: Remove public access to fishermen phone numbers and other PII
-- The public should only access data through the public_fishermen view, not the fishermen table directly

-- Drop the overly permissive public policy on fishermen table
DROP POLICY IF EXISTS "Everyone can view verified fishermen" ON public.fishermen;

-- Recreate the public_fishermen view to ensure it doesn't expose PII
-- This view is used for public display of fisherman profiles
DROP VIEW IF EXISTS public.public_fishermen CASCADE;

CREATE VIEW public.public_fishermen AS
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

-- Grant SELECT on the public view to everyone
GRANT SELECT ON public.public_fishermen TO anon, authenticated;

-- Add RLS policy to allow public read access to the view
-- (Views don't have RLS, but we enable it on the underlying table)

-- Ensure only fishermen and admins can see full fishermen data including phone, email, address
CREATE POLICY "Fishermen and admins can view full fishermen data" 
ON public.fishermen 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Public must use public_fishermen view instead
COMMENT ON VIEW public.public_fishermen IS 'Public view of verified fishermen profiles without PII (phone, email, address, SIRET, postal_code, city)';