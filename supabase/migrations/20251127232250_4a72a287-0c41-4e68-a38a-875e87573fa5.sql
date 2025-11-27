-- Phase 1: Nouvelles tables pour zones de pêche, paniers clients, et IA

-- 1. Table zones_peche (zones géographiques détaillées)
CREATE TABLE IF NOT EXISTS public.zones_peche (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Table zones_especes (association zones <-> espèces)
CREATE TABLE IF NOT EXISTS public.zones_especes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.zones_peche(id) ON DELETE CASCADE,
  species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(zone_id, species_id)
);

-- 3. Table client_baskets (paniers génériques vendus par tous les pêcheurs)
CREATE TABLE IF NOT EXISTS public.client_baskets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  weight_kg NUMERIC,
  variety_level TEXT CHECK (variety_level IN ('basic', 'varied', 'premium')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Table basket_orders (commandes de paniers par les clients)
CREATE TABLE IF NOT EXISTS public.basket_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  basket_id UUID NOT NULL REFERENCES public.client_baskets(id) ON DELETE RESTRICT,
  fisherman_id UUID REFERENCES public.fishermen(id) ON DELETE SET NULL,
  drop_id UUID REFERENCES public.drops(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled')),
  stripe_payment_id TEXT,
  total_price_cents INTEGER NOT NULL,
  pickup_location TEXT,
  pickup_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Table ai_conversations (historique conversations IA du Marin)
CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES public.fishermen(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Ajouter zone_id à la table fishermen
ALTER TABLE public.fishermen 
ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES public.zones_peche(id) ON DELETE SET NULL;

-- 7. Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_zones_especes_zone ON public.zones_especes(zone_id);
CREATE INDEX IF NOT EXISTS idx_zones_especes_species ON public.zones_especes(species_id);
CREATE INDEX IF NOT EXISTS idx_basket_orders_user ON public.basket_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_basket_orders_fisherman ON public.basket_orders(fisherman_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_fisherman ON public.ai_conversations(fisherman_id);
CREATE INDEX IF NOT EXISTS idx_fishermen_zone ON public.fishermen(zone_id);

-- 8. Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.zones_peche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones_especes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_baskets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.basket_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- 9. Policies pour zones_peche (lecture publique)
CREATE POLICY "Everyone can view fishing zones"
ON public.zones_peche FOR SELECT
TO authenticated
USING (true);

-- 10. Policies pour zones_especes (lecture publique)
CREATE POLICY "Everyone can view zone species"
ON public.zones_especes FOR SELECT
TO authenticated
USING (true);

-- 11. Policies pour client_baskets (lecture publique, admin manage)
CREATE POLICY "Everyone can view active baskets"
ON public.client_baskets FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage baskets"
ON public.client_baskets FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. Policies pour basket_orders (utilisateur voit ses commandes, pêcheur voit les siennes, admin tout)
CREATE POLICY "Users can view their own basket orders"
ON public.basket_orders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own basket orders"
ON public.basket_orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own basket orders"
ON public.basket_orders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Fishermen can view their basket orders"
ON public.basket_orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = basket_orders.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all basket orders"
ON public.basket_orders FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 13. Policies pour ai_conversations (pêcheur voit ses conversations, admin tout)
CREATE POLICY "Fishermen can manage their AI conversations"
ON public.ai_conversations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = ai_conversations.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all AI conversations"
ON public.ai_conversations FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 14. Trigger pour updated_at sur client_baskets
CREATE TRIGGER update_client_baskets_updated_at
BEFORE UPDATE ON public.client_baskets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Trigger pour updated_at sur basket_orders
CREATE TRIGGER update_basket_orders_updated_at
BEFORE UPDATE ON public.basket_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Trigger pour updated_at sur ai_conversations
CREATE TRIGGER update_ai_conversations_updated_at
BEFORE UPDATE ON public.ai_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Insérer les 3 paniers clients standards
INSERT INTO public.client_baskets (name, description, price_cents, weight_kg, variety_level) VALUES
('Panier Découverte', 'Parfait pour découvrir la pêche locale', 2500, 1.5, 'basic'),
('Panier Famille', 'Idéal pour les repas en famille', 4500, 3.0, 'varied'),
('Panier Gourmet', 'Pour les amateurs de qualité exceptionnelle', 7500, 4.0, 'premium')
ON CONFLICT DO NOTHING;

-- 18. Insérer des zones de pêche principales (Méditerranée, Atlantique, Manche)
INSERT INTO public.zones_peche (name, region, latitude, longitude) VALUES
-- Méditerranée
('Hyères', 'Méditerranée', 43.0959, 6.1286),
('Toulon', 'Méditerranée', 43.1242, 5.9280),
('Marseille', 'Méditerranée', 43.2965, 5.3698),
('La Ciotat', 'Méditerranée', 43.1746, 5.6076),
('Sète', 'Méditerranée', 43.4032, 3.6972),
-- Atlantique
('Lorient', 'Atlantique', 47.7482, -3.3667),
('Concarneau', 'Atlantique', 47.8717, -3.9169),
('Quiberon', 'Atlantique', 47.4845, -3.1198),
('La Rochelle', 'Atlantique', 46.1591, -1.1520),
('Les Sables-d''Olonne', 'Atlantique', 46.4961, -1.7835),
-- Manche
('Cherbourg', 'Manche', 49.6333, -1.6167),
('Dieppe', 'Manche', 49.9233, 1.0786),
('Boulogne-sur-Mer', 'Manche', 50.7264, 1.6147),
('Calais', 'Manche', 50.9513, 1.8587)
ON CONFLICT DO NOTHING;