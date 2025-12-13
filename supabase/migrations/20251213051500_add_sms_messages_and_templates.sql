-- ============================================================
-- SMS Messages and Templates Tables
-- ============================================================
-- Tables pour gérer l'historique des SMS et les templates personnalisables

-- 1. Table sms_messages : historique complet des SMS envoyés
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES fishermen_contacts(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('invitation', 'notification', 'custom')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  twilio_sid TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Index pour requêtes optimisées
CREATE INDEX idx_sms_messages_fisherman ON sms_messages(fisherman_id);
CREATE INDEX idx_sms_messages_contact ON sms_messages(contact_id);
CREATE INDEX idx_sms_messages_status ON sms_messages(status);
CREATE INDEX idx_sms_messages_created_at ON sms_messages(created_at DESC);
CREATE INDEX idx_sms_messages_type ON sms_messages(type);

-- 2. Table sms_templates : templates personnalisables par pêcheur
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('invitation', 'notification', 'custom')),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fisherman_id, type, name)
);

-- Index pour templates
CREATE INDEX idx_sms_templates_fisherman ON sms_templates(fisherman_id);
CREATE INDEX idx_sms_templates_type ON sms_templates(type);

-- 3. Ajouter colonne phone_verified à fishermen_contacts
ALTER TABLE fishermen_contacts 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Index pour phone_verified
CREATE INDEX IF NOT EXISTS idx_fishermen_contacts_phone_verified 
ON fishermen_contacts(phone_verified) WHERE phone_verified = true;

-- 4. RLS Policies pour sms_messages
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Pêcheurs peuvent voir leurs propres SMS
CREATE POLICY "Fishermen can view their own SMS messages"
ON sms_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fishermen 
    WHERE fishermen.id = sms_messages.fisherman_id 
    AND fishermen.user_id = auth.uid()
  )
);

-- Admins peuvent voir tous les SMS
CREATE POLICY "Admins can view all SMS messages"
ON sms_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role peut gérer les SMS (pour les edge functions)
CREATE POLICY "Service role can manage SMS messages"
ON sms_messages FOR ALL
USING (true);

-- 5. RLS Policies pour sms_templates
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- Pêcheurs peuvent gérer leurs propres templates
CREATE POLICY "Fishermen can manage their own templates"
ON sms_templates FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM fishermen 
    WHERE fishermen.id = sms_templates.fisherman_id 
    AND fishermen.user_id = auth.uid()
  )
);

-- Admins peuvent voir tous les templates
CREATE POLICY "Admins can view all templates"
ON sms_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Insérer des templates par défaut pour les pêcheurs existants
INSERT INTO sms_templates (fisherman_id, type, name, body, variables, is_default)
SELECT 
  id as fisherman_id,
  'invitation' as type,
  'Invitation par défaut' as name,
  'Bonjour ! J''ai du poisson frais ! Rejoins-moi sur QuaiDirect : {{signup_link}}' as body,
  '["signup_link"]'::jsonb as variables,
  true as is_default
FROM fishermen
ON CONFLICT (fisherman_id, type, name) DO NOTHING;

INSERT INTO sms_templates (fisherman_id, type, name, body, variables, is_default)
SELECT 
  id as fisherman_id,
  'notification' as type,
  'Notification arrivage par défaut' as name,
  'Arrivage ! Poisson frais du jour : {{species}} - Voir les détails : {{drop_link}}' as body,
  '["species", "drop_link"]'::jsonb as variables,
  true as is_default
FROM fishermen
ON CONFLICT (fisherman_id, type, name) DO NOTHING;

-- 7. Commentaires pour documentation
COMMENT ON TABLE sms_messages IS 'Historique complet de tous les SMS envoyés par les pêcheurs';
COMMENT ON TABLE sms_templates IS 'Templates SMS personnalisables par pêcheur';
COMMENT ON COLUMN sms_messages.type IS 'Type de SMS: invitation, notification ou custom';
COMMENT ON COLUMN sms_messages.status IS 'Statut: pending, sent, failed, delivered';
COMMENT ON COLUMN sms_templates.variables IS 'Variables disponibles dans le template (ex: ["signup_link", "species"])';
COMMENT ON COLUMN fishermen_contacts.phone_verified IS 'Indique si le numéro de téléphone a été vérifié';
