-- Table pour les mises à jour plateforme
CREATE TABLE public.platform_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  sent_by uuid,
  recipient_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.platform_updates ENABLE ROW LEVEL SECURITY;

-- Admins can manage platform updates
CREATE POLICY "Admins can manage platform updates" 
ON public.platform_updates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all platform updates
CREATE POLICY "Admins can view platform updates"
ON public.platform_updates
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));