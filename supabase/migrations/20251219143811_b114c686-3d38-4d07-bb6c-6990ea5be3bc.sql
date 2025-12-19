-- Table des zones réglementaires officielles (cache data.gouv.fr)
CREATE TABLE public.regulatory_fishing_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,
  thematique TEXT,
  zone_name TEXT NOT NULL,
  reglementations TEXT,
  geometry_wkt TEXT,
  geometry_geojson JSONB,
  region TEXT,
  departement TEXT,
  source_url TEXT,
  last_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour la recherche
CREATE INDEX idx_regulatory_zones_region ON regulatory_fishing_zones(region);
CREATE INDEX idx_regulatory_zones_thematique ON regulatory_fishing_zones(thematique);
CREATE INDEX idx_regulatory_zones_departement ON regulatory_fishing_zones(departement);
CREATE INDEX idx_regulatory_zones_name ON regulatory_fishing_zones USING gin(to_tsvector('french', zone_name));

-- Enable RLS
ALTER TABLE regulatory_fishing_zones ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les zones réglementaires (données publiques)
CREATE POLICY "Everyone can view regulatory zones"
  ON regulatory_fishing_zones FOR SELECT
  USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can manage regulatory zones"
  ON regulatory_fishing_zones FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table de liaison pêcheur <-> zones réglementaires
CREATE TABLE public.fisherman_regulatory_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES regulatory_fishing_zones(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  subscribed_to_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fisherman_id, zone_id)
);

-- Index pour les requêtes
CREATE INDEX idx_fisherman_regulatory_zones_fisherman ON fisherman_regulatory_zones(fisherman_id);
CREATE INDEX idx_fisherman_regulatory_zones_zone ON fisherman_regulatory_zones(zone_id);

-- Enable RLS
ALTER TABLE fisherman_regulatory_zones ENABLE ROW LEVEL SECURITY;

-- Les pêcheurs peuvent gérer leurs propres zones
CREATE POLICY "Fishermen can manage their regulatory zones"
  ON fisherman_regulatory_zones FOR ALL
  USING (fisherman_id IN (SELECT id FROM fishermen WHERE user_id = auth.uid()));

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all fisherman regulatory zones"
  ON fisherman_regulatory_zones FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table pour tracker les changements réglementaires
CREATE TABLE public.regulatory_zone_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES regulatory_fishing_zones(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL, -- 'new', 'updated', 'deleted'
  old_reglementations TEXT,
  new_reglementations TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ
);

-- Index
CREATE INDEX idx_regulatory_zone_changes_zone ON regulatory_zone_changes(zone_id);
CREATE INDEX idx_regulatory_zone_changes_detected ON regulatory_zone_changes(detected_at DESC);

-- Enable RLS
ALTER TABLE regulatory_zone_changes ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les changements
CREATE POLICY "Everyone can view regulatory zone changes"
  ON regulatory_zone_changes FOR SELECT
  USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can manage regulatory zone changes"
  ON regulatory_zone_changes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));