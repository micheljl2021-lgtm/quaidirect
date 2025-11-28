-- Ajouter le champ status à fishermen_messages pour la gestion admin
ALTER TABLE fishermen_messages 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'archived'));

-- Index pour faciliter les requêtes par statut
CREATE INDEX IF NOT EXISTS idx_fishermen_messages_status ON fishermen_messages(status);

-- Commentaire pour la documentation
COMMENT ON COLUMN fishermen_messages.status IS 'Statut du message pour gestion admin: pending (non traité), read (lu par admin), archived (archivé)';