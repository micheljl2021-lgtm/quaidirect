-- Permettre aux pêcheurs de voir tous les arrivages (actifs et terminés)
DROP POLICY IF EXISTS "Fishermen can view all drops" ON public.drops;

CREATE POLICY "Fishermen can view all drops" 
ON public.drops 
FOR SELECT 
USING (
  has_role(auth.uid(), 'fisherman')
);

-- Permettre aux pêcheurs de voir toutes les photos d'arrivages
DROP POLICY IF EXISTS "Fishermen can view all drop photos" ON public.drop_photos;

CREATE POLICY "Fishermen can view all drop photos" 
ON public.drop_photos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'fisherman')
);