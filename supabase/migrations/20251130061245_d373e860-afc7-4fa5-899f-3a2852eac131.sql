-- Create RLS policy for anonymous visitors to view public drops
CREATE POLICY "Anonymous visitors can view published drops"
ON public.drops
FOR SELECT
USING (
  status IN ('scheduled', 'landed') 
  AND now() >= COALESCE(public_visible_at, visible_at + interval '30 minutes')
);

-- Create RLS policy for anonymous visitors to view public offers
CREATE POLICY "Anonymous visitors can view public offers"
ON public.offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drops
    WHERE drops.id = offers.drop_id
    AND drops.status IN ('scheduled', 'landed')
    AND now() >= COALESCE(drops.public_visible_at, drops.visible_at + interval '30 minutes')
  )
);

-- Create RLS policy for anonymous visitors to view ports
CREATE POLICY "Anonymous visitors can view ports"
ON public.ports
FOR SELECT
USING (true);

-- Create RLS policy for anonymous visitors to view drop_photos
CREATE POLICY "Anonymous visitors can view public drop photos"
ON public.drop_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drops
    WHERE drops.id = drop_photos.drop_id
    AND drops.status IN ('scheduled', 'landed')
    AND now() >= COALESCE(drops.public_visible_at, drops.visible_at + interval '30 minutes')
  )
);