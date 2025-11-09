-- Table pour les recettes de cuisine
CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  preparation_time integer, -- en minutes
  cooking_time integer, -- en minutes
  difficulty text CHECK (difficulty IN ('facile', 'moyen', 'difficile')),
  servings integer DEFAULT 4,
  instructions jsonb, -- array d'étapes [{step: 1, text: "..."}]
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table de liaison recette-espèces
CREATE TABLE public.recipe_species (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  species_id uuid REFERENCES public.species(id) ON DELETE CASCADE NOT NULL,
  quantity text, -- ex: "2 filets", "500g"
  is_primary boolean DEFAULT false, -- espèce principale de la recette
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(recipe_id, species_id)
);

-- Table pour les ingrédients des recettes
CREATE TABLE public.recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  quantity text NOT NULL, -- ex: "200g", "2 cuillères"
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table pour les forfaits/abonnements
CREATE TABLE public.subscription_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  duration_days integer NOT NULL DEFAULT 7, -- 7 pour semaine, 30 pour mois
  fish_quota integer NOT NULL, -- nombre de poissons/pièces inclus
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table pour les souscriptions utilisateurs aux forfaits
CREATE TABLE public.user_package_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid REFERENCES public.subscription_packages(id) ON DELETE CASCADE NOT NULL,
  remaining_quota integer NOT NULL,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  status text CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table pour le programme de parrainage
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL, -- celui qui parraine
  referred_id uuid NOT NULL, -- celui qui est parrainé
  referrer_type text CHECK (referrer_type IN ('fisherman', 'user')) NOT NULL,
  referred_type text CHECK (referred_type IN ('fisherman', 'user')) NOT NULL,
  bonus_amount numeric(10,2) DEFAULT 0, -- bonus en euros
  bonus_claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Indexes
CREATE INDEX idx_recipe_species_recipe ON public.recipe_species(recipe_id);
CREATE INDEX idx_recipe_species_species ON public.recipe_species(species_id);
CREATE INDEX idx_recipe_ingredients_recipe ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_user_package_subscriptions_user ON public.user_package_subscriptions(user_id);
CREATE INDEX idx_user_package_subscriptions_status ON public.user_package_subscriptions(status);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_id);

-- RLS Policies
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_package_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les recettes
CREATE POLICY "Everyone can view recipes"
  ON public.recipes FOR SELECT
  USING (true);

-- Admins peuvent gérer les recettes
CREATE POLICY "Admins can manage recipes"
  ON public.recipes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tout le monde peut voir les liaisons recette-espèces
CREATE POLICY "Everyone can view recipe species"
  ON public.recipe_species FOR SELECT
  USING (true);

-- Admins peuvent gérer les liaisons
CREATE POLICY "Admins can manage recipe species"
  ON public.recipe_species FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tout le monde peut voir les ingrédients
CREATE POLICY "Everyone can view recipe ingredients"
  ON public.recipe_ingredients FOR SELECT
  USING (true);

-- Admins peuvent gérer les ingrédients
CREATE POLICY "Admins can manage recipe ingredients"
  ON public.recipe_ingredients FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tout le monde peut voir les forfaits actifs
CREATE POLICY "Everyone can view active packages"
  ON public.subscription_packages FOR SELECT
  USING (is_active = true);

-- Admins peuvent gérer les forfaits
CREATE POLICY "Admins can manage packages"
  ON public.subscription_packages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users peuvent voir leurs propres souscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.user_package_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users peuvent créer leurs souscriptions
CREATE POLICY "Users can create their subscriptions"
  ON public.user_package_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins peuvent tout voir et gérer
CREATE POLICY "Admins can manage all subscriptions"
  ON public.user_package_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users peuvent voir leurs parrainages
CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Users peuvent créer des parrainages
CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Admins peuvent tout gérer
CREATE POLICY "Admins can manage referrals"
  ON public.referrals FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers pour updated_at
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_packages_updated_at
  BEFORE UPDATE ON public.subscription_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_package_subscriptions_updated_at
  BEFORE UPDATE ON public.user_package_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Données de test pour les forfaits
INSERT INTO public.subscription_packages (name, description, price, duration_days, fish_quota) VALUES
('Forfait Semaine Découverte', 'Idéal pour tester - 3 poissons par semaine', 29.99, 7, 3),
('Forfait Semaine Famille', 'Pour toute la famille - 8 poissons par semaine', 49.99, 7, 8),
('Forfait Mois Gourmet', 'Le meilleur rapport qualité/prix - 20 poissons par mois', 89.99, 30, 20);

-- Exemple de recettes
INSERT INTO public.recipes (title, description, preparation_time, cooking_time, difficulty, servings, instructions, image_url) VALUES
('Bar grillé au fenouil', 'Un classique méditerranéen simple et délicieux', 15, 25, 'facile', 4, 
'[{"step":1,"text":"Préparer le bar en retirant les écailles et les viscères"},{"step":2,"text":"Farcir le poisson avec du fenouil frais et des tranches de citron"},{"step":3,"text":"Griller au four à 180°C pendant 25 minutes"},{"step":4,"text":"Servir avec un filet d''huile d''olive et du citron"}]'::jsonb, null),
('Sole meunière traditionnelle', 'La recette classique française pour sublimer la sole', 10, 15, 'moyen', 2,
'[{"step":1,"text":"Fariner légèrement les soles"},{"step":2,"text":"Faire fondre du beurre dans une poêle"},{"step":3,"text":"Cuire les soles 5-7 min de chaque côté"},{"step":4,"text":"Ajouter persil, citron et servir immédiatement"}]'::jsonb, null),
('Bouillabaisse marseillaise', 'Le grand classique provençal aux multiples poissons', 30, 45, 'difficile', 6,
'[{"step":1,"text":"Préparer le fumet avec les têtes et arêtes"},{"step":2,"text":"Faire revenir oignons, fenouil, tomates et safran"},{"step":3,"text":"Ajouter les poissons fermes puis les plus délicats"},{"step":4,"text":"Servir avec rouille et croûtons"}]'::jsonb, null);