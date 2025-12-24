-- Table pour tracker les notifications automatiques envoyées par arrivage
-- Permet d'éviter les doublons et d'afficher les contacts déjà notifiés
CREATE TABLE public.drop_notifications_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  contact_id UUID REFERENCES public.fishermen_contacts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms')),
  notification_source TEXT NOT NULL CHECK (notification_source IN ('follower', 'species', 'port', 'sale_point', 'manual')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par drop
CREATE INDEX idx_drop_notifications_sent_drop_id ON public.drop_notifications_sent(drop_id);

-- Index pour recherche par user_id
CREATE INDEX idx_drop_notifications_sent_user_id ON public.drop_notifications_sent(user_id);

-- Index pour recherche par email (contacts sans compte)
CREATE INDEX idx_drop_notifications_sent_email ON public.drop_notifications_sent(email);

-- Contrainte unique : un user ne peut recevoir qu'une notif par channel par drop
CREATE UNIQUE INDEX idx_drop_notifications_unique_user 
ON public.drop_notifications_sent(drop_id, user_id, channel) 
WHERE user_id IS NOT NULL;

-- Contrainte unique : un email ne peut recevoir qu'une notif par channel par drop
CREATE UNIQUE INDEX idx_drop_notifications_unique_email 
ON public.drop_notifications_sent(drop_id, email, channel) 
WHERE email IS NOT NULL AND user_id IS NULL;

-- Enable RLS
ALTER TABLE public.drop_notifications_sent ENABLE ROW LEVEL SECURITY;

-- Policy: Les pêcheurs peuvent voir les notifications de leurs propres drops
CREATE POLICY "Fishermen can view notifications for their drops"
ON public.drop_notifications_sent
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drops d
    JOIN public.fishermen f ON d.fisherman_id = f.id
    WHERE d.id = drop_notifications_sent.drop_id
    AND f.user_id = auth.uid()
  )
);

-- Policy: Admins peuvent tout voir
CREATE POLICY "Admins can view all notifications"
ON public.drop_notifications_sent
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Insertion par service role uniquement (edge functions)
CREATE POLICY "Service role can insert notifications"
ON public.drop_notifications_sent
FOR INSERT
WITH CHECK (true);

-- Policy: Pas de modification/suppression par les utilisateurs
-- Seul service role peut modifier via edge functions