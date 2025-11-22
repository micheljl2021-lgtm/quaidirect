-- Ajouter la colonne is_ambassador à la table fishermen
ALTER TABLE public.fishermen 
ADD COLUMN is_ambassador BOOLEAN DEFAULT false;

-- Marquer Seb comme ambassadeur partenaire
UPDATE public.fishermen 
SET is_ambassador = true 
WHERE id = '157d560f-1860-4e7a-aae5-2ddd177b5b94';

COMMENT ON COLUMN public.fishermen.is_ambassador IS 'Indique si le pêcheur est un ambassadeur partenaire de la plateforme';