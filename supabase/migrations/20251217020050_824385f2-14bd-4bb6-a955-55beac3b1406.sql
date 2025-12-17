-- Phase 1: Fondations pour le système de préférences client

-- 1) Ajouter colonne premium_badge_color à profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS premium_badge_color VARCHAR(50) DEFAULT 'or';

COMMENT ON COLUMN profiles.premium_badge_color IS 'Couleur du badge Premium (or, argent, bronze, rose, bleu, vert)';

-- 2) Créer table client_follow_sale_points (Email sur points de vente)
CREATE TABLE IF NOT EXISTS client_follow_sale_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sale_point_id UUID NOT NULL REFERENCES fisherman_sale_points(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, sale_point_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_client_follow_sale_points_user ON client_follow_sale_points(user_id);
CREATE INDEX IF NOT EXISTS idx_client_follow_sale_points_point ON client_follow_sale_points(sale_point_id);

-- Activer RLS
ALTER TABLE client_follow_sale_points ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can view their own sale point follows"
ON client_follow_sale_points
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sale point follows"
ON client_follow_sale_points
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sale point follows"
ON client_follow_sale_points
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sale point follows"
ON client_follow_sale_points
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));