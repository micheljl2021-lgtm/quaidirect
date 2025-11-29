-- Fonction RPC pour compter les pêcheurs vérifiés (accessible publiquement)
CREATE OR REPLACE FUNCTION public.count_verified_fishermen()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM fishermen
  WHERE verified_at IS NOT NULL;
$$;

-- Fonction RPC pour compter les utilisateurs (accessible publiquement)
CREATE OR REPLACE FUNCTION public.count_users()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT user_id)::bigint
  FROM user_roles;
$$;

-- Permettre l'accès anonyme à ces fonctions
GRANT EXECUTE ON FUNCTION public.count_verified_fishermen() TO anon;
GRANT EXECUTE ON FUNCTION public.count_users() TO anon;