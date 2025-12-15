-- Étape 1: Recréer la vue public_fishermen avec SECURITY INVOKER
DROP VIEW IF EXISTS public_fishermen;

CREATE VIEW public_fishermen WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  fishing_methods,
  fishing_zones_geojson,
  seo_how_to_order,
  verified_at,
  is_ambassador,
  ambassador_slot,
  default_sale_point_id,
  zone_id,
  created_at,
  updated_at,
  seo_enriched_at,
  seo_long_content,
  seo_hours_location,
  favorite_photo_url,
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
  affiliate_code,
  fishing_zones,
  client_message,
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
  seo_keywords
FROM fishermen
WHERE slug IS NOT NULL;

COMMENT ON VIEW public_fishermen IS 'Vue publique des pêcheurs avec slug, exclut PII (phone, email, address, SIRET). Utilise SECURITY INVOKER.';

-- Étape 5: Créer la fonction RPC increment_wallet_balance
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  p_fisherman_id UUID,
  p_amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Incrémenter le solde SMS du pêcheur de manière atomique
  UPDATE fishermen_sms_usage
  SET 
    paid_sms_balance = COALESCE(paid_sms_balance, 0) + p_amount,
    updated_at = now()
  WHERE fisherman_id = p_fisherman_id
    AND month_year = to_char(now(), 'YYYY-MM');
  
  -- Si aucune ligne n'existe pour ce mois, en créer une
  IF NOT FOUND THEN
    INSERT INTO fishermen_sms_usage (
      fisherman_id, 
      month_year, 
      paid_sms_balance, 
      free_sms_used,
      created_at,
      updated_at
    ) VALUES (
      p_fisherman_id,
      to_char(now(), 'YYYY-MM'),
      p_amount,
      0,
      now(),
      now()
    )
    ON CONFLICT (fisherman_id, month_year) DO UPDATE
    SET 
      paid_sms_balance = fishermen_sms_usage.paid_sms_balance + p_amount,
      updated_at = now();
  END IF;
END;
$$;