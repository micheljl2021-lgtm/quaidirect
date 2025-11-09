-- Add sale_start_time to drops table to separate landing time from sale time
ALTER TABLE drops ADD COLUMN sale_start_time timestamp with time zone;

COMMENT ON COLUMN drops.sale_start_time IS 'Heure à partir de laquelle les clients peuvent retirer leur poisson (distincte de l''ETA pour respecter la réglementation)';

-- Add fields to species for regulatory information
ALTER TABLE species ADD COLUMN fao_zone text;
ALTER TABLE species ADD COLUMN min_size_cm integer;
ALTER TABLE species ADD COLUMN fishing_gear text;

COMMENT ON COLUMN species.fao_zone IS 'Zone FAO de capture (ex: 27.VIIIa pour Atlantique Nord-Est)';
COMMENT ON COLUMN species.min_size_cm IS 'Taille minimale réglementaire en centimètres';
COMMENT ON COLUMN species.fishing_gear IS 'Engin de pêche utilisé (ex: Ligne, Filet, Casier)';

-- Update offers to support piece-based pricing with indicative price
ALTER TABLE offers ADD COLUMN price_type text DEFAULT 'per_kg' CHECK (price_type IN ('per_kg', 'per_piece'));
ALTER TABLE offers ADD COLUMN indicative_weight_kg numeric;

COMMENT ON COLUMN offers.price_type IS 'Type de prix: per_kg (prix au kilo définitif) ou per_piece (prix indicatif à la pièce, ajusté après pesée)';
COMMENT ON COLUMN offers.indicative_weight_kg IS 'Poids indicatif par pièce pour les ventes à la pièce (poids réel déterminé à la pesée)';