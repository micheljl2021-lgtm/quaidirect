-- Add public read policies for zones_peche and zones_especes tables

-- Policy pour permettre la lecture publique des zones de pêche
CREATE POLICY "Anyone can view fishing zones"
  ON public.zones_peche
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Policy pour permettre la lecture publique des associations zones-espèces  
CREATE POLICY "Anyone can view zone species associations"
  ON public.zones_especes
  FOR SELECT
  TO authenticated, anon
  USING (true);