-- Add missing fishing methods to the enum
ALTER TYPE fishing_method ADD VALUE IF NOT EXISTS 'senne';
ALTER TYPE fishing_method ADD VALUE IF NOT EXISTS 'drague';
ALTER TYPE fishing_method ADD VALUE IF NOT EXISTS 'filet_maillant';
ALTER TYPE fishing_method ADD VALUE IF NOT EXISTS 'tremail';
ALTER TYPE fishing_method ADD VALUE IF NOT EXISTS 'traine';
ALTER TYPE fishing_method ADD VALUE IF NOT EXISTS 'peche_pied';
ALTER TYPE fishing_method ADD VALUE IF NOT EXISTS 'plongee';