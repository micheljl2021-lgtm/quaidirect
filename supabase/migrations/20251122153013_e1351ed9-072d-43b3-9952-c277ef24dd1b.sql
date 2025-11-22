-- Ajouter les colonnes manquantes dans la table fishermen
ALTER TABLE public.fishermen
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS main_fishing_zone text,
ADD COLUMN IF NOT EXISTS photo_boat_1 text,
ADD COLUMN IF NOT EXISTS photo_boat_2 text,
ADD COLUMN IF NOT EXISTS photo_dock_sale text,
ADD COLUMN IF NOT EXISTS years_experience text,
ADD COLUMN IF NOT EXISTS passion_quote text,
ADD COLUMN IF NOT EXISTS work_philosophy text,
ADD COLUMN IF NOT EXISTS client_message text,
ADD COLUMN IF NOT EXISTS generated_description text,
ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Fonction pour générer un slug unique à partir du boat_name
CREATE OR REPLACE FUNCTION public.generate_fisherman_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Ne régénérer que si le slug est NULL ou si le boat_name a changé
  IF NEW.slug IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.boat_name = NEW.boat_name) THEN
    RETURN NEW;
  END IF;
  
  -- Générer le slug de base à partir du boat_name
  base_slug := lower(regexp_replace(NEW.boat_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- Si le slug est vide, utiliser un UUID
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'pecheur-' || substring(gen_random_uuid()::text, 1, 8);
  END IF;
  
  final_slug := base_slug;
  
  -- Vérifier l'unicité et ajouter un compteur si nécessaire
  WHILE EXISTS (SELECT 1 FROM public.fishermen WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Créer le trigger pour générer automatiquement le slug
DROP TRIGGER IF EXISTS generate_fisherman_slug_trigger ON public.fishermen;
CREATE TRIGGER generate_fisherman_slug_trigger
  BEFORE INSERT OR UPDATE OF boat_name ON public.fishermen
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_fisherman_slug();

-- Générer les slugs pour les pêcheurs existants
UPDATE public.fishermen
SET boat_name = boat_name
WHERE slug IS NULL;

-- Mettre à jour la vue public_fishermen pour inclure les nouveaux champs
DROP VIEW IF EXISTS public.public_fishermen CASCADE;
CREATE VIEW public.public_fishermen AS
SELECT 
  id,
  user_id,
  boat_name,
  boat_registration,
  company_name,
  description,
  bio,
  photo_url,
  fishing_methods,
  fishing_zones,
  fishing_zones_geojson,
  verified_at,
  created_at,
  updated_at,
  address,
  postal_code,
  city,
  email,
  facebook_url,
  instagram_url,
  website_url,
  main_fishing_zone,
  photo_boat_1,
  photo_boat_2,
  photo_dock_sale,
  generated_description,
  slug
FROM public.fishermen
WHERE verified_at IS NOT NULL;