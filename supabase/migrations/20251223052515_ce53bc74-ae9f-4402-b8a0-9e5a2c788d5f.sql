-- Ajouter une policy SELECT pour que TOUS les utilisateurs connectés puissent voir les sale points
-- (la protection de l'adresse est faite côté application via getDropLocationLabel)

CREATE POLICY "Authenticated users can view sale points"
ON public.fisherman_sale_points
FOR SELECT
TO authenticated
USING (true);