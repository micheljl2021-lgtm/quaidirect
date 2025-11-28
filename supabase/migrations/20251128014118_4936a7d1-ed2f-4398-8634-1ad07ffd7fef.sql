-- ============================================================
-- CORRECTION SÉCURITÉ CRITIQUE : Restriction accès public table fishermen
-- ============================================================
-- La table fishermen contient des données sensibles (email, téléphone, adresse, SIRET)
-- qui ne doivent PAS être accessibles publiquement.
-- La vue public_fishermen existe déjà pour l'accès public avec champs filtrés.

-- 1. SUPPRIMER la policy publique dangereuse
DROP POLICY IF EXISTS "Public can view verified fishermen rows" ON public.fishermen;

-- 2. CRÉER une nouvelle policy restreinte pour l'accès public via public_fishermen
-- Cette policy n'autorise l'accès direct à la table fishermen que pour:
-- - Le pêcheur lui-même (via user_id)
-- - Les admins
-- Le public doit utiliser la vue public_fishermen qui filtre les champs sensibles

-- Les policies existantes restent inchangées:
-- ✓ "Fishermen can view their own profile" - OK
-- ✓ "Admins can view all fishermen" - OK
-- ✓ "Fishermen can update their own profile" - OK
-- ✓ "Fishermen can insert their own profile" - OK
-- ✓ "Admins can update fishermen" - OK

-- Note: Le code utilise déjà public_fishermen pour l'accès public
-- et fishermen directement uniquement pour le propriétaire (isOwner check)