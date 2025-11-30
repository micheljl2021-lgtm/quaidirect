-- Correction 1: Policies INSERT manquantes sur audits et notifications
CREATE POLICY "System can insert audit logs"
ON public.audits
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Correction 2: Policies DELETE manquantes
CREATE POLICY "Fishermen can delete their own drops"
ON public.drops
FOR DELETE
TO authenticated
USING (
  fisherman_id IN (
    SELECT id FROM public.fishermen WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can delete their own offers"
ON public.offers
FOR DELETE
TO authenticated
USING (
  drop_id IN (
    SELECT d.id FROM public.drops d
    JOIN public.fishermen f ON d.fisherman_id = f.id
    WHERE f.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own reservations"
ON public.reservations
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Fishermen can delete their drop photos"
ON public.drop_photos
FOR DELETE
TO authenticated
USING (
  drop_id IN (
    SELECT d.id FROM public.drops d
    JOIN public.fishermen f ON d.fisherman_id = f.id
    WHERE f.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can delete their offer photos"
ON public.offer_photos
FOR DELETE
TO authenticated
USING (
  offer_id IN (
    SELECT o.id FROM public.offers o
    JOIN public.drops d ON o.drop_id = d.id
    JOIN public.fishermen f ON d.fisherman_id = f.id
    WHERE f.user_id = auth.uid()
  )
);

-- Correction 3: Sécuriser la view public_fishermen en masquant les données sensibles
DROP VIEW IF EXISTS public.public_fishermen;

CREATE VIEW public.public_fishermen
WITH (security_invoker = true)
AS
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
  zone_id,
  slug,
  verified_at,
  is_ambassador,
  ambassador_slot,
  default_sale_point_id,
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
  seo_how_to_order,
  seo_hours_location,
  seo_enriched_at,
  created_at,
  updated_at
  -- Données sensibles SUPPRIMÉES: siret, email, phone, address, city, postal_code, license_number
FROM public.fishermen
WHERE verified_at IS NOT NULL;