-- Phase 1: Ajouter photo_url pour les points de vente
ALTER TABLE fisherman_sale_points 
ADD COLUMN IF NOT EXISTS photo_url TEXT;