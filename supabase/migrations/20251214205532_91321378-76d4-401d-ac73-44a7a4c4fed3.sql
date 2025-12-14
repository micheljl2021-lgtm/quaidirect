-- Ajouter la colonne affiliate_code pour le tracking des liens pêcheur
ALTER TABLE public.fishermen 
ADD COLUMN IF NOT EXISTS affiliate_code TEXT UNIQUE;

-- Générer un code unique pour les pêcheurs existants
UPDATE public.fishermen 
SET affiliate_code = UPPER(SUBSTRING(MD5(id::text || created_at::text) FROM 1 FOR 8))
WHERE affiliate_code IS NULL;

-- Créer un index pour les recherches par affiliate_code
CREATE INDEX IF NOT EXISTS idx_fishermen_affiliate_code ON public.fishermen(affiliate_code);