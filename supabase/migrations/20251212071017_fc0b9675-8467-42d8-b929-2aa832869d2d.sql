-- Table pour collecter les emails avant lancement
CREATE TABLE public.launch_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index unique sur email pour éviter les doublons
CREATE UNIQUE INDEX idx_launch_subscribers_email ON public.launch_subscribers(email);

-- RLS
ALTER TABLE public.launch_subscribers ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut s'inscrire
CREATE POLICY "Anyone can subscribe" ON public.launch_subscribers 
FOR INSERT WITH CHECK (true);

-- Seuls les admins peuvent lire
CREATE POLICY "Admins can read subscribers" ON public.launch_subscribers 
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));