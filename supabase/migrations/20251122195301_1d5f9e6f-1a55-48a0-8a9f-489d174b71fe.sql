-- Créer le type ENUM pour les zones de pêche
CREATE TYPE fishing_area AS ENUM ('mediterranee', 'atlantique', 'manche', 'all');

-- Ajouter la colonne fishing_area à la table species
ALTER TABLE species 
ADD COLUMN fishing_area fishing_area DEFAULT 'all';

-- Créer un index pour optimiser les requêtes
CREATE INDEX idx_species_fishing_area ON species(fishing_area);

-- Créer la table drop_photos pour les photos générales d'arrivage
CREATE TABLE drop_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_drop_photos_drop_id ON drop_photos(drop_id);

-- Enable RLS
ALTER TABLE drop_photos ENABLE ROW LEVEL SECURITY;

-- Pêcheurs peuvent créer/modifier leurs photos d'arrivage
CREATE POLICY "Fishermen can manage their drop photos"
ON drop_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM drops d
    JOIN fishermen f ON f.id = d.fisherman_id
    WHERE d.id = drop_photos.drop_id
    AND f.user_id = auth.uid()
  )
);

-- Tout le monde peut voir les photos publiques après la fenêtre publique
CREATE POLICY "Users can view public drop photos"
ON drop_photos FOR SELECT
USING (
  has_role(auth.uid(), 'user') AND
  EXISTS (
    SELECT 1 FROM drops d
    WHERE d.id = drop_photos.drop_id
    AND d.status IN ('scheduled', 'landed')
    AND NOW() >= COALESCE(d.public_visible_at, d.visible_at + INTERVAL '30 minutes')
  )
);

-- Premium users peuvent voir les photos en avance
CREATE POLICY "Premium users can view drop photos early"
ON drop_photos FOR SELECT
USING (
  has_role(auth.uid(), 'premium') AND
  EXISTS (
    SELECT 1 FROM drops d
    WHERE d.id = drop_photos.drop_id
    AND d.status IN ('scheduled', 'landed')
    AND NOW() >= d.visible_at
  )
);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all drop photos"
ON drop_photos FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Peupler les zones de pêche pour les espèces existantes

-- Méditerranée
UPDATE species SET fishing_area = 'mediterranee' 
WHERE name IN (
  'Rouget', 'Sar', 'Pageot', 'Daurade royale', 'Loup de mer', 
  'Saint-Pierre', 'Poulpe', 'Seiche', 'Calamar', 'Rascasse',
  'Denti', 'Mérou', 'Langouste rouge', 'Cigale de mer'
);

-- Atlantique
UPDATE species SET fishing_area = 'atlantique' 
WHERE name IN (
  'Merlu', 'Lieu jaune', 'Sole', 'Turbot', 
  'Baudroie', 'Saint-Jacques', 'Homard', 'Araignée',
  'Bar de ligne', 'Lieu noir', 'Tacaud'
);

-- Manche
UPDATE species SET fishing_area = 'manche' 
WHERE name IN (
  'Hareng', 'Maquereau', 'Cabillaud', 'Eglefin', 
  'Plie', 'Carrelet', 'Bulot', 'Moule',
  'Limande', 'Flétan'
);

-- Espèces présentes partout (garder 'all')
UPDATE species SET fishing_area = 'all' 
WHERE name IN (
  'Sardine', 'Anchois', 'Mulet', 'Chinchard', 
  'Congre', 'Raie', 'Crevette', 'Langouste',
  'Bar', 'Dorade grise', 'Rouget barbet', 'Thon'
);