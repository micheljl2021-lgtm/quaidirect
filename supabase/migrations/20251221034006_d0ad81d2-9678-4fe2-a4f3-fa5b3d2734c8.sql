-- Supprimer les colonnes inutilisées ajoutées pour Pixabay
ALTER TABLE public.species 
DROP COLUMN IF EXISTS english_name,
DROP COLUMN IF EXISTS latin_name,
DROP COLUMN IF EXISTS default_photo_url;