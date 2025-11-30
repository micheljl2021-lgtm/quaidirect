-- Rendre port_id nullable dans la table drops
ALTER TABLE drops ALTER COLUMN port_id DROP NOT NULL;