-- Supprimer la vue actuelle
DROP VIEW IF EXISTS public_fishermen;

-- Recréer avec uniquement les champs publics nécessaires
-- Exclus: user_id (interne), boat_registration (numéro officiel sensible)
CREATE VIEW public_fishermen 
WITH (security_invoker = true) AS
SELECT 
    id,
    boat_name,
    company_name,
    bio,
    description,
    generated_description,
    photo_url,
    photo_boat_1,
    photo_boat_2,
    photo_dock_sale,
    favorite_photo_url,
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

-- Accès public (données non sensibles uniquement)
GRANT SELECT ON public_fishermen TO anon, authenticated;