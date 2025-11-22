-- Fonction qui ajoute automatiquement le rôle fisherman quand verified_at est défini
CREATE OR REPLACE FUNCTION public.auto_assign_fisherman_role()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Si verified_at vient d'être défini (n'était pas défini avant)
  IF NEW.verified_at IS NOT NULL AND (OLD.verified_at IS NULL OR OLD IS NULL) THEN
    -- Ajouter le rôle fisherman s'il n'existe pas déjà
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'fisherman')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table fishermen
CREATE TRIGGER on_fisherman_verified
  AFTER INSERT OR UPDATE OF verified_at ON public.fishermen
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_fisherman_role();

-- Ajouter le rôle fisherman pour tous les pêcheurs vérifiés qui ne l'ont pas
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT f.user_id, 'fisherman'::app_role
FROM public.fishermen f
WHERE f.verified_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = f.user_id AND ur.role = 'fisherman'
  );