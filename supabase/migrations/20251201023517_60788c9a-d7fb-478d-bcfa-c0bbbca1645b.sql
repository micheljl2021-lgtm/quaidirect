-- Créer une table pour la whitelist des pêcheurs
CREATE TABLE IF NOT EXISTS public.fisherman_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur la table
ALTER TABLE public.fisherman_whitelist ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent gérer la whitelist
CREATE POLICY "Admins can manage fisherman whitelist"
ON public.fisherman_whitelist
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role peut lire pour vérifications système
CREATE POLICY "Service role can read whitelist"
ON public.fisherman_whitelist
FOR SELECT
USING (true);

-- Insérer les emails actuels de la whitelist
INSERT INTO public.fisherman_whitelist (email, reason) VALUES
  ('micheljlouis048@gmail.com', 'Compte test initial'),
  ('seb.zadeyan.leboncoin@gmail.com', 'Ambassadeur Partenaire Fondateur')
ON CONFLICT (email) DO NOTHING;

-- Trigger pour updated_at
CREATE TRIGGER update_fisherman_whitelist_updated_at
  BEFORE UPDATE ON public.fisherman_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour performance
CREATE INDEX idx_fisherman_whitelist_email ON public.fisherman_whitelist(email);
CREATE INDEX idx_fisherman_whitelist_user_id ON public.fisherman_whitelist(user_id) WHERE user_id IS NOT NULL;