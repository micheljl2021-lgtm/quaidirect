-- =============================================
-- LOT 1 : RLS DELETE Policies + Indexes
-- =============================================

-- 1. Policy DELETE pour offers (les pêcheurs peuvent supprimer leurs propres offres)
-- Note: Cette policy existe déjà selon le contexte, vérifions et créons si absente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'offers' 
    AND policyname = 'Fishermen can delete their own offers'
  ) THEN
    CREATE POLICY "Fishermen can delete their own offers"
    ON public.offers
    FOR DELETE
    USING (drop_id IN (
      SELECT d.id FROM drops d
      JOIN fishermen f ON d.fisherman_id = f.id
      WHERE f.user_id = auth.uid()
    ));
  END IF;
END $$;

-- 2. Policy DELETE pour drop_species
CREATE POLICY "Fishermen can delete species for their drops"
ON public.drop_species
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM drops
  JOIN fishermen ON fishermen.id = drops.fisherman_id
  WHERE drops.id = drop_species.drop_id
  AND fishermen.user_id = auth.uid()
));

-- 3. Policy DELETE pour drop_photos (vérifie si absente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'drop_photos' 
    AND policyname = 'Fishermen can delete their own drop photos'
  ) THEN
    CREATE POLICY "Fishermen can delete their own drop photos"
    ON public.drop_photos
    FOR DELETE
    USING (drop_id IN (
      SELECT d.id FROM drops d
      JOIN fishermen f ON d.fisherman_id = f.id
      WHERE f.user_id = auth.uid()
    ));
  END IF;
END $$;

-- =============================================
-- INDEXES D'OPTIMISATION POUR LES REQUÊTES RLS
-- =============================================

-- Index 1: Accélérer la recherche de pêcheurs par user_id
CREATE INDEX IF NOT EXISTS idx_fishermen_user_id ON public.fishermen(user_id);

-- Index 2: Accélérer les jointures drops → fisherman
CREATE INDEX IF NOT EXISTS idx_drops_fisherman_id ON public.drops(fisherman_id);

-- Index 3: Filtrage des arrivages par date de vente
CREATE INDEX IF NOT EXISTS idx_drops_sale_start_time ON public.drops(sale_start_time);

-- Index 4: Filtrage des arrivages par statut
CREATE INDEX IF NOT EXISTS idx_drops_status ON public.drops(status);

-- Index 5: Recherche des commandes par utilisateur
CREATE INDEX IF NOT EXISTS idx_basket_orders_user_id ON public.basket_orders(user_id);

-- Index 6: Accélérer has_role() - index composite
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);

-- Index 7: Messages des pêcheurs
CREATE INDEX IF NOT EXISTS idx_fishermen_messages_fisherman_id ON public.fishermen_messages(fisherman_id);

-- Index 8: Offres par drop
CREATE INDEX IF NOT EXISTS idx_offers_drop_id ON public.offers(drop_id);