-- ÉTAPE 1: Table fisherman_sale_points
CREATE TABLE IF NOT EXISTS fisherman_sale_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS pour fisherman_sale_points
ALTER TABLE fisherman_sale_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can manage their own sale points"
  ON fisherman_sale_points FOR ALL
  USING (fisherman_id IN (SELECT id FROM fishermen WHERE user_id = auth.uid()));

-- Index
CREATE INDEX idx_fisherman_sale_points_fisherman ON fisherman_sale_points(fisherman_id);

-- ÉTAPE 2: Ajouter drop_type aux drops
ALTER TABLE drops ADD COLUMN IF NOT EXISTS drop_type TEXT DEFAULT 'detailed' CHECK (drop_type IN ('detailed', 'simple'));

-- ÉTAPE 3: Table drop_templates
CREATE TABLE IF NOT EXISTS drop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '⭐',
  payload JSONB NOT NULL,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS pour drop_templates
ALTER TABLE drop_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can manage their own templates"
  ON drop_templates FOR ALL
  USING (fisherman_id IN (SELECT id FROM fishermen WHERE user_id = auth.uid()));

-- Index
CREATE INDEX idx_drop_templates_fisherman ON drop_templates(fisherman_id);
CREATE INDEX idx_drop_templates_usage ON drop_templates(usage_count DESC);

-- ÉTAPE 3: Ajouter préférences par défaut aux fishermen
ALTER TABLE fishermen ADD COLUMN IF NOT EXISTS default_sale_point_id UUID REFERENCES fisherman_sale_points(id) ON DELETE SET NULL;
ALTER TABLE fishermen ADD COLUMN IF NOT EXISTS default_time_slot TEXT DEFAULT 'matin';

-- Update trigger for fisherman_sale_points
CREATE OR REPLACE FUNCTION update_fisherman_sale_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_fisherman_sale_points_updated_at
  BEFORE UPDATE ON fisherman_sale_points
  FOR EACH ROW
  EXECUTE FUNCTION update_fisherman_sale_points_updated_at();