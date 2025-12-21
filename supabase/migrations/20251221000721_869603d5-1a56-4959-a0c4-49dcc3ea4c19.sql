-- Recréer la vue public_fishermen SANS le champ affiliate_code (sensible)
DROP VIEW IF EXISTS public.public_fishermen;

CREATE VIEW public.public_fishermen AS
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
    -- affiliate_code SUPPRIMÉ pour des raisons de sécurité
    client_message,
    default_time_slot,
    display_name_preference,
    passion_quote,
    work_philosophy,
    years_experience
FROM fishermen
WHERE verified_at IS NOT NULL 
  AND slug IS NOT NULL;

-- Ajouter un commentaire pour documenter la décision
COMMENT ON VIEW public.public_fishermen IS 'Vue publique des pêcheurs vérifiés. Le champ affiliate_code est volontairement exclu pour des raisons de sécurité.';