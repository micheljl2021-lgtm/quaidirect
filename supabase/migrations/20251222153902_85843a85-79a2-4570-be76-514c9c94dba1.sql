-- Permettre aux utilisateurs authentifiés de voir les pêcheurs vérifiés
CREATE POLICY "Authenticated users can view verified fishermen"
ON public.fishermen
FOR SELECT
TO authenticated
USING (verified_at IS NOT NULL);

-- Supprimer la policy contradictoire qui bloque les anonymes
DROP POLICY IF EXISTS "Block anonymous access to fishermen" ON public.fishermen;