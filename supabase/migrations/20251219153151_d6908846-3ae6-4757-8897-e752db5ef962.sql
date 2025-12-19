-- Permettre aux pêcheurs (role fisherman) de voir les informations complètes des arrivages
-- (offres, photos d'offres, espèces déclarées, points de vente)

-- OFFERS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view all offers"
ON public.offers
FOR SELECT
USING (public.has_role(auth.uid(), 'fisherman'::app_role));

-- OFFER PHOTOS
ALTER TABLE public.offer_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view all offer photos"
ON public.offer_photos
FOR SELECT
USING (public.has_role(auth.uid(), 'fisherman'::app_role));

-- DROP SPECIES
ALTER TABLE public.drop_species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view all drop species"
ON public.drop_species
FOR SELECT
USING (public.has_role(auth.uid(), 'fisherman'::app_role));

-- SALE POINTS (pour afficher le lieu complet dans /drop/:id quand il n'y a pas de port_id)
ALTER TABLE public.fisherman_sale_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view all sale points"
ON public.fisherman_sale_points
FOR SELECT
USING (public.has_role(auth.uid(), 'fisherman'::app_role));
