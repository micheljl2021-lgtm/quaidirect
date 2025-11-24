-- Ajouter le système ambassadeurs et les tables de contacts
-- 1. Ajouter le champ ambassador_slot dans fishermen
ALTER TABLE fishermen 
ADD COLUMN ambassador_slot INTEGER DEFAULT NULL,
ADD CONSTRAINT check_ambassador_slot CHECK (ambassador_slot >= 1 AND ambassador_slot <= 10);

-- 2. Créer la table des contacts des pêcheurs
CREATE TABLE fishermen_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  contact_group TEXT DEFAULT 'general',
  notes TEXT,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT contact_must_have_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Index pour recherche rapide
CREATE INDEX idx_fishermen_contacts_fisherman ON fishermen_contacts(fisherman_id);
CREATE INDEX idx_fishermen_contacts_email ON fishermen_contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_fishermen_contacts_phone ON fishermen_contacts(phone) WHERE phone IS NOT NULL;

-- 3. Créer la table des messages envoyés par les pêcheurs
CREATE TABLE fishermen_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('invitation_initiale', 'new_drop', 'custom')),
  subject TEXT,
  body TEXT NOT NULL,
  sent_to_group TEXT,
  drop_id UUID REFERENCES drops(id) ON DELETE SET NULL,
  recipient_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fishermen_messages_fisherman ON fishermen_messages(fisherman_id);
CREATE INDEX idx_fishermen_messages_sent_at ON fishermen_messages(sent_at DESC);

-- 4. RLS Policies pour fishermen_contacts
ALTER TABLE fishermen_contacts ENABLE ROW LEVEL SECURITY;

-- Pêcheurs peuvent gérer leurs propres contacts
CREATE POLICY "Fishermen can manage their own contacts"
ON fishermen_contacts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM fishermen 
    WHERE fishermen.id = fishermen_contacts.fisherman_id 
    AND fishermen.user_id = auth.uid()
  )
);

-- Admins peuvent voir tous les contacts
CREATE POLICY "Admins can view all contacts"
ON fishermen_contacts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. RLS Policies pour fishermen_messages
ALTER TABLE fishermen_messages ENABLE ROW LEVEL SECURITY;

-- Pêcheurs peuvent voir leurs propres messages
CREATE POLICY "Fishermen can view their own messages"
ON fishermen_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fishermen 
    WHERE fishermen.id = fishermen_messages.fisherman_id 
    AND fishermen.user_id = auth.uid()
  )
);

-- Pêcheurs peuvent créer leurs propres messages
CREATE POLICY "Fishermen can create their own messages"
ON fishermen_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fishermen 
    WHERE fishermen.id = fishermen_messages.fisherman_id 
    AND fishermen.user_id = auth.uid()
  )
);

-- Admins peuvent voir tous les messages
CREATE POLICY "Admins can view all messages"
ON fishermen_messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));