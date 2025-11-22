-- Ajouter les colonnes pour les prix et présentations aux espèces
ALTER TABLE public.species
ADD COLUMN IF NOT EXISTS indicative_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS price_unit TEXT DEFAULT '€/kg',
ADD COLUMN IF NOT EXISTS presentation TEXT;

-- Ajouter des commentaires pour expliquer l'usage
COMMENT ON COLUMN public.species.indicative_price IS 'Prix indicatif pour cette espèce (peut varier selon le marché)';
COMMENT ON COLUMN public.species.price_unit IS 'Unité du prix (€/kg, €/douzaine, €/pièce, etc.)';
COMMENT ON COLUMN public.species.presentation IS 'Type de présentation (entier, tranché, coupé, ailes, etc.)';

-- Créer un index pour optimiser les recherches par prix
CREATE INDEX IF NOT EXISTS idx_species_indicative_price ON public.species(indicative_price) WHERE indicative_price IS NOT NULL;