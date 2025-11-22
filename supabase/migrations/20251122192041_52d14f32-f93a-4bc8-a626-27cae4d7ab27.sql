-- 1. Créer la table offer_photos pour gérer plusieurs photos par offre
CREATE TABLE IF NOT EXISTS public.offer_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offer_photos_offer_id ON public.offer_photos(offer_id);

-- 2. Ajouter display_name_preference dans fishermen
ALTER TABLE public.fishermen 
ADD COLUMN IF NOT EXISTS display_name_preference TEXT DEFAULT 'boat_name';

-- Ajouter une contrainte CHECK pour valider les valeurs
ALTER TABLE public.fishermen 
ADD CONSTRAINT check_display_name_preference 
CHECK (display_name_preference IN ('boat_name', 'company_name'));

-- 3. Modifier les contraintes sur drops
-- Rendre eta_at optionnel (déjà nullable selon le schema)
-- Rendre sale_start_time obligatoire
ALTER TABLE public.drops 
ALTER COLUMN sale_start_time SET NOT NULL;

-- 4. RLS policies pour offer_photos
ALTER TABLE public.offer_photos ENABLE ROW LEVEL SECURITY;

-- Pêcheurs peuvent gérer leurs photos d'offres
CREATE POLICY "Fishermen can manage their offer photos"
ON public.offer_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.offers o
    JOIN public.drops d ON d.id = o.drop_id
    JOIN public.fishermen f ON f.id = d.fisherman_id
    WHERE o.id = offer_photos.offer_id
    AND f.user_id = auth.uid()
  )
);

-- Premium users peuvent voir les photos en avance
CREATE POLICY "Premium users can view offer photos early"
ON public.offer_photos FOR SELECT
USING (
  public.has_role(auth.uid(), 'premium'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.offers o
    JOIN public.drops d ON d.id = o.drop_id
    WHERE o.id = offer_photos.offer_id
    AND d.status IN ('scheduled', 'landed')
    AND NOW() >= d.visible_at
  )
);

-- Users peuvent voir les photos publiques
CREATE POLICY "Users can view public offer photos"
ON public.offer_photos FOR SELECT
USING (
  public.has_role(auth.uid(), 'user'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.offers o
    JOIN public.drops d ON d.id = o.drop_id
    WHERE o.id = offer_photos.offer_id
    AND d.status IN ('scheduled', 'landed')
    AND NOW() >= COALESCE(d.public_visible_at, d.visible_at + INTERVAL '30 minutes')
  )
);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all offer photos"
ON public.offer_photos FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));