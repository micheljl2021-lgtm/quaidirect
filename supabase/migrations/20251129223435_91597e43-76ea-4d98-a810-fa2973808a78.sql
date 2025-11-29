-- Table des types de demandes prédéfinies
CREATE TABLE IF NOT EXISTS public.request_type_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  action_admin TEXT NOT NULL,
  action_button_label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les types prédéfinis
INSERT INTO public.request_type_definitions (code, label, description, action_admin, action_button_label) VALUES
('EDIT_PROFILE_AFTER_STRIPE', 'Modifier mon profil après paiement', 'Vous souhaitez modifier vos informations professionnelles (nom du bateau, zones de pêche, etc.)', 'SEND_PROFILE_EDIT_LINK', 'Envoyer un lien de modification de profil'),
('STRIPE_BILLING_UPDATE', 'Modifier mes informations de facturation', 'Accéder au portail Stripe pour gérer votre moyen de paiement et vos factures', 'SEND_BILLING_PORTAL_LINK', 'Envoyer un lien vers le portail de facturation'),
('TECHNICAL_ISSUE', 'Problème technique', 'Signaler un bug ou un dysfonctionnement sur la plateforme', 'MANUAL_RESPONSE', 'Répondre manuellement'),
('GENERAL_SUPPORT', 'Question générale', 'Toute autre demande d''assistance', 'MANUAL_RESPONSE', 'Répondre manuellement')
ON CONFLICT (code) DO NOTHING;

-- Ajouter colonne request_type_code à support_requests
ALTER TABLE public.support_requests 
ADD COLUMN IF NOT EXISTS request_type_code TEXT REFERENCES public.request_type_definitions(code);

-- Créer index pour performance
CREATE INDEX IF NOT EXISTS idx_support_requests_type_code ON public.support_requests(request_type_code);

-- Migrer les catégories existantes vers les nouveaux types
UPDATE public.support_requests 
SET request_type_code = CASE 
  WHEN category = 'profile_modification' THEN 'EDIT_PROFILE_AFTER_STRIPE'
  WHEN category = 'technical' THEN 'TECHNICAL_ISSUE'
  ELSE 'GENERAL_SUPPORT'
END
WHERE request_type_code IS NULL;

-- Ajouter nouveau statut 'link_sent' à l'enum support_status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t 
                 JOIN pg_enum e ON t.oid = e.enumtypid 
                 WHERE t.typname = 'support_status' AND e.enumlabel = 'link_sent') THEN
    ALTER TYPE public.support_status ADD VALUE 'link_sent';
  END IF;
END $$;

-- Table des tokens sécurisés pour modification de profil
CREATE TABLE IF NOT EXISTS public.secure_edit_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  fisherman_id UUID NOT NULL REFERENCES public.fishermen(id) ON DELETE CASCADE,
  support_request_id UUID REFERENCES public.support_requests(id) ON DELETE SET NULL,
  token_type TEXT NOT NULL DEFAULT 'PROFILE_EDIT',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_via TEXT,
  sent_at TIMESTAMPTZ
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_secure_tokens_token ON public.secure_edit_tokens(token);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_fisherman ON public.secure_edit_tokens(fisherman_id);
CREATE INDEX IF NOT EXISTS idx_secure_tokens_expires ON public.secure_edit_tokens(expires_at);

-- RLS sur secure_edit_tokens
ALTER TABLE public.secure_edit_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage secure tokens"
ON public.secure_edit_tokens FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage tokens"
ON public.secure_edit_tokens FOR ALL
USING ((current_setting('request.jwt.claims'::text, true)::json ->> 'role'::text) = 'service_role'::text);

-- Table d'audit des modifications de profil
CREATE TABLE IF NOT EXISTS public.profile_edit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fisherman_id UUID NOT NULL REFERENCES public.fishermen(id) ON DELETE CASCADE,
  token_id UUID REFERENCES public.secure_edit_tokens(id) ON DELETE SET NULL,
  old_data JSONB,
  new_data JSONB,
  fields_changed TEXT[],
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour audit
CREATE INDEX IF NOT EXISTS idx_profile_edit_logs_fisherman ON public.profile_edit_logs(fisherman_id);
CREATE INDEX IF NOT EXISTS idx_profile_edit_logs_created ON public.profile_edit_logs(created_at);

-- RLS sur profile_edit_logs
ALTER TABLE public.profile_edit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view profile edit logs"
ON public.profile_edit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert logs"
ON public.profile_edit_logs FOR INSERT
WITH CHECK ((current_setting('request.jwt.claims'::text, true)::json ->> 'role'::text) = 'service_role'::text);

-- RLS sur request_type_definitions (lecture publique pour les pêcheurs)
ALTER TABLE public.request_type_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active request types"
ON public.request_type_definitions FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage request types"
ON public.request_type_definitions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));