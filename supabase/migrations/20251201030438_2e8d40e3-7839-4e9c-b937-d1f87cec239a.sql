
-- Supprimer la policy publique sur fisherman_whitelist
DROP POLICY IF EXISTS "Service role can read whitelist" ON fisherman_whitelist;

-- La table fisherman_whitelist doit rester accessible uniquement aux admins
-- La policy existante "Admins can manage fisherman whitelist" est suffisante
