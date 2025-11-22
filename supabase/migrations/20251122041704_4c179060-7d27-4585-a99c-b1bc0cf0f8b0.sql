-- Create drop_species table for quick species selection
CREATE TABLE drop_species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
  species_id UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(drop_id, species_id)
);

-- Index for performance
CREATE INDEX idx_drop_species_drop_id ON drop_species(drop_id);
CREATE INDEX idx_drop_species_species_id ON drop_species(species_id);

-- Enable RLS
ALTER TABLE drop_species ENABLE ROW LEVEL SECURITY;

-- Fishermen can manage species for their drops
CREATE POLICY "Fishermen can manage species for their drops"
ON drop_species
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM drops
    JOIN fishermen ON fishermen.id = drops.fisherman_id
    WHERE drops.id = drop_species.drop_id
    AND fishermen.user_id = auth.uid()
  )
);

-- Premium users can view drop species
CREATE POLICY "Premium users can view drop species"
ON drop_species
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM drops
    WHERE drops.id = drop_species.drop_id
    AND has_role(auth.uid(), 'premium'::app_role)
    AND now() >= drops.visible_at
  )
);

-- Users can view drop species from public window
CREATE POLICY "Users can view drop species from public window"
ON drop_species
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM drops
    WHERE drops.id = drop_species.drop_id
    AND has_role(auth.uid(), 'user'::app_role)
    AND now() >= COALESCE(drops.public_visible_at, drops.visible_at + INTERVAL '30 minutes')
  )
);

-- Clean duplicate species
DELETE FROM species WHERE name = 'Daurade royale';

-- Insert Mediterranean fish
INSERT INTO species (name, scientific_name, description) VALUES
('Loup de mer', 'Dicentrarchus labrax', 'Nom méditerranéen du bar, poisson noble très prisé'),
('Pageot', 'Pagellus acarne', 'Petit poisson rose, excellent grillé'),
('Sar', 'Diplodus sargus', 'Poisson argenté rayé, chair ferme'),
('Saupe', 'Sarpa salpa', 'Poisson herbivore, saveur particulière'),
('Rascasse', 'Scorpaena scrofa', 'Essentielle pour la bouillabaisse'),
('Chapon', 'Scorpaena scrofa', 'Grosse rascasse, très recherchée'),
('Baudroie', 'Lophius piscatorius', 'Lotte de mer, chair délicate'),
('Merlan', 'Merlangius merlangus', 'Poisson blanc économique'),
('Sardine', 'Sardina pilchardus', 'Petit poisson bleu typique'),
('Anchois', 'Engraulis encrasicolus', 'Petit poisson bleu, idéal frais'),
('Maquereau', 'Scomber scombrus', 'Poisson bleu savoureux'),
('Thon rouge', 'Thunnus thynnus', 'Espèce prestigieuse, pêche réglementée'),
('Bonite', 'Sarda sarda', 'Petit thon, chair rosée'),
('Congre', 'Conger conger', 'Anguille de mer, pour soupes'),
('Mulet', 'Mugil cephalus', 'Muge, excellent grillé'),
('Raie', 'Raja spp.', 'Cartilagineux, ailes comestibles'),
('Poulpe', 'Octopus vulgaris', 'Pieuvre, chair tendre une fois attendrie'),
('Seiche', 'Sepia officinalis', 'Mollusque à chair ferme'),
('Calamar', 'Loligo vulgaris', 'Encornet, excellent poêlé'),
('Langouste rouge', 'Palinurus elephas', 'Crustacé premium sans pinces'),
('Homard', 'Homarus gammarus', 'Crustacé noble à grosses pinces'),
('Cigale de mer', 'Scyllarides latus', 'Petit crustacé rare et délicat'),
('Araignée de mer', 'Maja squinado', 'Crabe à longues pattes, chair fine'),
('Étrille', 'Necora puber', 'Petit crabe nageur, pour soupes'),
('Tourteau', 'Cancer pagurus', 'Gros crabe dormeur, chair abondante'),
('Crevette rose', 'Parapenaeus longirostris', 'Bouquet, crevette de qualité'),
('Crevette grise', 'Crangon crangon', 'Petite crevette locale'),
('Coquille Saint-Jacques', 'Pecten maximus', 'Mollusque noble'),
('Moules', 'Mytilus galloprovincialis', 'Bivalve très populaire'),
('Huîtres', 'Ostrea edulis', 'Bivalve d''élevage ou sauvage'),
('Palourdes', 'Ruditapes decussatus', 'Clovisse, petit mollusque'),
('Tellines', 'Donax trunculus', 'Petit coquillage typique de Méditerranée'),
('Violet', 'Microcosmus sabatieri', 'Tunicier, spécialité provençale');