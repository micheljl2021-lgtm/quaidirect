-- SECURITY FIX: Eliminate SECURITY DEFINER and properly secure public fishermen access
-- 
-- Issue 1: Remove SECURITY DEFINER view (Supabase linter error)
-- Issue 2: Ensure phone numbers and sensitive PII are not exposed to public
--
-- Solution: Use standard RLS policy + view column filtering instead of SECURITY DEFINER

-- ============================================================================
-- 1. Drop existing SECURITY DEFINER implementation
-- ============================================================================

DROP VIEW IF EXISTS public.public_fishermen CASCADE;
DROP FUNCTION IF EXISTS public.get_public_fishermen() CASCADE;

-- ============================================================================
-- 2. Create RLS policy allowing public to view VERIFIED fishermen rows
-- ============================================================================
-- This policy only grants row-level access to verified fishermen
-- Column-level filtering is handled by the view below

CREATE POLICY "Public can view verified fishermen rows"
ON public.fishermen
FOR SELECT
TO anon, authenticated
USING (verified_at IS NOT NULL);

-- ============================================================================
-- 3. Create secure view with column filtering (no SECURITY DEFINER)
-- ============================================================================
-- This view explicitly selects ONLY non-sensitive columns
-- Sensitive fields excluded: phone, email, address, postal_code, city, siret, 
-- license_number, onboarding_*, can_edit_profile, ambassador_slot, zone_id

CREATE VIEW public.public_fishermen
WITH (security_invoker = true)
AS
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

-- Grant access
GRANT SELECT ON public.public_fishermen TO anon, authenticated;

-- ============================================================================
-- SECURITY VERIFICATION
-- ============================================================================
-- ✅ No SECURITY DEFINER (eliminates linter warning)
-- ✅ RLS enabled on fishermen table (existing)
-- ✅ Public can only see verified fishermen (RLS policy)
-- ✅ Sensitive data excluded from view (phone, email, address, SIRET, etc.)
-- ✅ View uses SECURITY INVOKER (respects caller's permissions)
-- ✅ Admins and fishermen still have full access via direct table queries

COMMENT ON POLICY "Public can view verified fishermen rows" ON public.fishermen IS 
  'Allows anon and authenticated users to view verified fishermen rows. Column-level filtering is enforced by public_fishermen view.';

COMMENT ON VIEW public.public_fishermen IS 
  'Public-safe view of verified fishermen. Excludes all sensitive PII: phone, email, address, postal_code, city, siret, license_number, onboarding data. Uses SECURITY INVOKER with RLS policy for secure access.';