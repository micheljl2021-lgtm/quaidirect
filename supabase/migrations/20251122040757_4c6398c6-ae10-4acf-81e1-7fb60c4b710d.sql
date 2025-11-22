-- Create fishermen_species table to link fishermen with their target species
CREATE TABLE public.fishermen_species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES public.fishermen(id) ON DELETE CASCADE,
  species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(fisherman_id, species_id)
);

-- Enable RLS
ALTER TABLE public.fishermen_species ENABLE ROW LEVEL SECURITY;

-- Fishermen can view their own species selections
CREATE POLICY "Fishermen can view their own species"
ON public.fishermen_species
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = fishermen_species.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

-- Fishermen can insert their own species selections
CREATE POLICY "Fishermen can insert their own species"
ON public.fishermen_species
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = fishermen_species.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

-- Fishermen can update their own species selections
CREATE POLICY "Fishermen can update their own species"
ON public.fishermen_species
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = fishermen_species.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

-- Fishermen can delete their own species selections
CREATE POLICY "Fishermen can delete their own species"
ON public.fishermen_species
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = fishermen_species.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

-- Everyone can view fishermen species for verified fishermen
CREATE POLICY "Everyone can view species of verified fishermen"
ON public.fishermen_species
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = fishermen_species.fisherman_id
    AND fishermen.verified_at IS NOT NULL
  )
);

-- Admins can manage all fishermen species
CREATE POLICY "Admins can manage all fishermen species"
ON public.fishermen_species
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));