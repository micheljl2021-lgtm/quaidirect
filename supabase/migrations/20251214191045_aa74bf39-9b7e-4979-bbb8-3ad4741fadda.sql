-- Add favorite_photo_url column to fishermen table
ALTER TABLE public.fishermen 
ADD COLUMN IF NOT EXISTS favorite_photo_url TEXT;