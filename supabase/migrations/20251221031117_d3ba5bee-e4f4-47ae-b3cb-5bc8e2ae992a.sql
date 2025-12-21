-- Add columns for species photo caching and translations
ALTER TABLE public.species 
ADD COLUMN IF NOT EXISTS english_name TEXT,
ADD COLUMN IF NOT EXISTS latin_name TEXT,
ADD COLUMN IF NOT EXISTS default_photo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.species.english_name IS 'English name for better Pixabay search';
COMMENT ON COLUMN public.species.latin_name IS 'Latin/scientific name for fallback search';
COMMENT ON COLUMN public.species.default_photo_url IS 'Cached default photo URL for this species';