
-- ============================================
-- SECURITY FIX MIGRATION
-- ============================================

-- 1. Drop and recreate public_fishermen view with SECURITY INVOKER (default)
-- This ensures RLS policies on fishermen table are respected
DROP VIEW IF EXISTS public.public_fishermen;

CREATE VIEW public.public_fishermen AS
SELECT 
    id,
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
WHERE verified_at IS NOT NULL 
  AND slug IS NOT NULL;

-- Add comment to clarify this is a public-safe view
COMMENT ON VIEW public.public_fishermen IS 'Public-safe view of verified fishermen - excludes sensitive data (email, phone, siret, address, license_number, user_id, onboarding data)';

-- 2. Fix rate_limits table - make it service_role only
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Create proper service role policy
CREATE POLICY "Only service role can access rate limits"
ON public.rate_limits
FOR ALL
USING (
  (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
)
WITH CHECK (
  (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
);

-- Block all other access including authenticated users
CREATE POLICY "Block authenticated access to rate limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Block anonymous access to rate limits
CREATE POLICY "Block anonymous access to rate limits"
ON public.rate_limits
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- 3. Tighten fishermen policies - change public to authenticated where appropriate
-- Drop existing policies that use 'public' role incorrectly
DROP POLICY IF EXISTS "Admins can update fishermen" ON public.fishermen;
DROP POLICY IF EXISTS "Fishermen and admins can view full fishermen data" ON public.fishermen;
DROP POLICY IF EXISTS "Fishermen can insert their own profile" ON public.fishermen;
DROP POLICY IF EXISTS "Fishermen can update their own profile" ON public.fishermen;

-- Recreate with authenticated role
CREATE POLICY "Admins can update fishermen"
ON public.fishermen
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Fishermen can insert their own profile"
ON public.fishermen
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Fishermen can update their own profile"
ON public.fishermen
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Tighten fishermen_contacts policies
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.fishermen_contacts;

CREATE POLICY "Admins can view all contacts"
ON public.fishermen_contacts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Tighten fishermen_messages policies
DROP POLICY IF EXISTS "Admins can view all messages" ON public.fishermen_messages;
DROP POLICY IF EXISTS "Fishermen can create their own messages" ON public.fishermen_messages;
DROP POLICY IF EXISTS "Fishermen can view their own messages" ON public.fishermen_messages;

CREATE POLICY "Admins can view all messages"
ON public.fishermen_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Fishermen can create their own messages"
ON public.fishermen_messages
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM fishermen
  WHERE fishermen.id = fishermen_messages.fisherman_id
    AND fishermen.user_id = auth.uid()
));

CREATE POLICY "Fishermen can view their own messages"
ON public.fishermen_messages
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM fishermen
  WHERE fishermen.id = fishermen_messages.fisherman_id
    AND fishermen.user_id = auth.uid()
));

-- 6. Tighten payments policies
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can manage payments" ON public.payments;

CREATE POLICY "Admins can view all payments"
ON public.payments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage payments"
ON public.payments
FOR ALL
USING (
  (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
)
WITH CHECK (
  (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'service_role'
);

-- 7. Add INSERT policy for profiles (was missing)
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
