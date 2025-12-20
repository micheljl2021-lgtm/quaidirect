-- Corrections RLS mineures

-- 1. Ajouter policy admin pour push_subscriptions
CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Ajouter policies admin pour species (gestion complète)
CREATE POLICY "Admins can manage species"
ON public.species FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));