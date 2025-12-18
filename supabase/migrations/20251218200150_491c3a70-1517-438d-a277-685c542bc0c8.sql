-- Supprimer l'ancienne politique restrictive pour les visiteurs anonymes
DROP POLICY IF EXISTS "Anonymous visitors can view public drops" ON public.drops;

-- Créer une nouvelle politique qui inclut les arrivages terminés (completed)
CREATE POLICY "Anonymous visitors can view public drops" 
ON public.drops 
FOR SELECT 
USING (
  status IN ('scheduled', 'landed', 'completed')
  AND now() >= COALESCE(public_visible_at, visible_at + interval '30 minutes')
);

-- Mettre à jour également la politique pour drop_photos
DROP POLICY IF EXISTS "Anonymous visitors can view public drop photos" ON public.drop_photos;

CREATE POLICY "Anonymous visitors can view public drop photos" 
ON public.drop_photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM drops
    WHERE drops.id = drop_photos.drop_id
    AND drops.status IN ('scheduled', 'landed', 'completed')
    AND now() >= COALESCE(drops.public_visible_at, drops.visible_at + interval '30 minutes')
  )
);

-- Mettre à jour la politique pour les utilisateurs standard
DROP POLICY IF EXISTS "Users can view public drops" ON public.drops;

CREATE POLICY "Users can view public drops" 
ON public.drops 
FOR SELECT 
USING (
  has_role(auth.uid(), 'user')
  AND status IN ('scheduled', 'landed', 'completed')
  AND now() >= COALESCE(public_visible_at, visible_at + interval '30 minutes')
);

-- Mettre à jour la politique des photos pour les utilisateurs standard
DROP POLICY IF EXISTS "Users can view public drop photos" ON public.drop_photos;

CREATE POLICY "Users can view public drop photos" 
ON public.drop_photos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'user')
  AND EXISTS (
    SELECT 1 FROM drops d
    WHERE d.id = drop_photos.drop_id
    AND d.status IN ('scheduled', 'landed', 'completed')
    AND now() >= COALESCE(d.public_visible_at, d.visible_at + interval '30 minutes')
  )
);