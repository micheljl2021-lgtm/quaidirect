-- Créer la table pour le pêcheur soutenu (1 par client Premium/Premium+)
CREATE TABLE public.client_supported_fishermen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fisherman_id UUID NOT NULL REFERENCES public.fishermen(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id) -- Un seul pêcheur soutenu par client
);

-- Enable RLS
ALTER TABLE public.client_supported_fishermen ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leur pêcheur soutenu
CREATE POLICY "Users can view own supported fisherman"
ON public.client_supported_fishermen
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent ajouter leur pêcheur soutenu
CREATE POLICY "Users can insert own supported fisherman"
ON public.client_supported_fishermen
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent modifier leur pêcheur soutenu
CREATE POLICY "Users can update own supported fisherman"
ON public.client_supported_fishermen
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leur pêcheur soutenu
CREATE POLICY "Users can delete own supported fisherman"
ON public.client_supported_fishermen
FOR DELETE
USING (auth.uid() = user_id);

-- Index pour les lookups rapides
CREATE INDEX idx_client_supported_fishermen_user_id ON public.client_supported_fishermen(user_id);
CREATE INDEX idx_client_supported_fishermen_fisherman_id ON public.client_supported_fishermen(fisherman_id);