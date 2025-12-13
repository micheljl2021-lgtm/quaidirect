-- Add photo_url column to fisherman_sale_points table
ALTER TABLE fisherman_sale_points 
ADD COLUMN photo_url TEXT;

COMMENT ON COLUMN fisherman_sale_points.photo_url IS 'URL de la photo du point de vente (optionnel, fallback sur photo pêcheur)';
