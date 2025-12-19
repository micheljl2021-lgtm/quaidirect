-- Phase 1: Enrichir la table species avec les données du fichier Excel
-- Ajouter les nouvelles colonnes pour les informations détaillées sur les espèces

-- Colonnes d'identification et description
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS fao_code text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS product_type text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS flavor text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS budget text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS bones_level text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS season_text text;

-- Colonnes pour les 9 méthodes de cuisson (boolean)
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_plancha boolean DEFAULT false;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_friture boolean DEFAULT false;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_grill boolean DEFAULT false;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_sushi_tartare boolean DEFAULT false;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_vapeur boolean DEFAULT false;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_four boolean DEFAULT false;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_poele boolean DEFAULT false;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_soupe boolean DEFAULT false;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_bouillabaisse boolean DEFAULT false;

-- Colonnes pour les informations nutritionnelles et conservation
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS calories_per_100g integer;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS conservation_info text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS portion_weight_g integer;

-- Colonnes pour les conseils et anecdotes
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS cooking_tips text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS fun_facts text;
ALTER TABLE public.species ADD COLUMN IF NOT EXISTS local_names text[];

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_species_fao_code ON public.species(fao_code);
CREATE INDEX IF NOT EXISTS idx_species_product_type ON public.species(product_type);
CREATE INDEX IF NOT EXISTS idx_species_budget ON public.species(budget);
CREATE INDEX IF NOT EXISTS idx_species_bones_level ON public.species(bones_level);

-- Index GIN pour les méthodes de cuisson (recherche par méthode)
CREATE INDEX IF NOT EXISTS idx_species_cooking_methods ON public.species USING btree (
  cooking_plancha, cooking_friture, cooking_grill, cooking_sushi_tartare,
  cooking_vapeur, cooking_four, cooking_poele, cooking_soupe, cooking_bouillabaisse
);

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN public.species.fao_code IS 'Code FAO de l''espèce';
COMMENT ON COLUMN public.species.product_type IS 'Type de produit: Poisson, Céphalopode, Crustacé, Coquillage';
COMMENT ON COLUMN public.species.flavor IS 'Profil de saveur: Délicat, Prononcé, Iodé, etc.';
COMMENT ON COLUMN public.species.budget IS 'Gamme de prix: €, €€, €€€';
COMMENT ON COLUMN public.species.bones_level IS 'Niveau d''arêtes: Sans arêtes, Peu d''arêtes, Arêtes faciles, Beaucoup d''arêtes';
COMMENT ON COLUMN public.species.season_text IS 'Description textuelle de la saison';
COMMENT ON COLUMN public.species.cooking_plancha IS 'Peut être cuisiné à la plancha';
COMMENT ON COLUMN public.species.cooking_friture IS 'Peut être frit';
COMMENT ON COLUMN public.species.cooking_grill IS 'Peut être grillé';
COMMENT ON COLUMN public.species.cooking_sushi_tartare IS 'Peut être consommé cru (sushi/tartare)';
COMMENT ON COLUMN public.species.cooking_vapeur IS 'Peut être cuit à la vapeur';
COMMENT ON COLUMN public.species.cooking_four IS 'Peut être cuit au four';
COMMENT ON COLUMN public.species.cooking_poele IS 'Peut être poêlé';
COMMENT ON COLUMN public.species.cooking_soupe IS 'Peut être utilisé en soupe';
COMMENT ON COLUMN public.species.cooking_bouillabaisse IS 'Peut être utilisé en bouillabaisse';
COMMENT ON COLUMN public.species.calories_per_100g IS 'Calories pour 100g';
COMMENT ON COLUMN public.species.conservation_info IS 'Instructions de conservation';
COMMENT ON COLUMN public.species.portion_weight_g IS 'Poids recommandé par portion en grammes';
COMMENT ON COLUMN public.species.cooking_tips IS 'Conseils de cuisson';
COMMENT ON COLUMN public.species.fun_facts IS 'Anecdotes intéressantes sur l''espèce';
COMMENT ON COLUMN public.species.local_names IS 'Appellations locales/régionales';