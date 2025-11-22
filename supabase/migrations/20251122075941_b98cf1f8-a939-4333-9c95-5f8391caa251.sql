-- Mise à jour des espèces existantes avec prix indicatifs
UPDATE public.species SET indicative_price = 75, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Homard';
UPDATE public.species SET indicative_price = 28, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Rouget';
UPDATE public.species SET indicative_price = 28, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Dorade royale';
UPDATE public.species SET indicative_price = 28, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Loup de mer' OR name = 'Bar de ligne';
UPDATE public.species SET indicative_price = 25, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name LIKE '%Dorade%' AND name != 'Dorade royale';
UPDATE public.species SET indicative_price = 22, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Calamar';
UPDATE public.species SET indicative_price = 15, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Araignée de mer';
UPDATE public.species SET indicative_price = 15, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Seiche';
UPDATE public.species SET indicative_price = 13, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Poulpe';
UPDATE public.species SET indicative_price = 10, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Congre';
UPDATE public.species SET indicative_price = 28, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Chapon' OR name = 'Rascasse';
UPDATE public.species SET indicative_price = 28, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Pageot';
UPDATE public.species SET indicative_price = 28, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Saint-Pierre';
UPDATE public.species SET indicative_price = 25, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Sar';
UPDATE public.species SET indicative_price = 18, price_unit = '€/kg', presentation = 'ailes', fao_zone = '37.1' WHERE name = 'Raie';
UPDATE public.species SET indicative_price = 10, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Mulet';
UPDATE public.species SET indicative_price = 6, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Saupe';
UPDATE public.species SET indicative_price = 30, price_unit = '€/kg', presentation = 'tranché', fao_zone = '37.1' WHERE name = 'Thon rouge';
UPDATE public.species SET indicative_price = 12, price_unit = '€/kg', presentation = 'entière', fao_zone = '37.1' WHERE name = 'Baudroie';
UPDATE public.species SET indicative_price = 75, price_unit = '€/kg', presentation = 'entier', fao_zone = '37.1' WHERE name = 'Langouste rouge';

-- Insertion des nouvelles espèces uniquement
INSERT INTO public.species (name, scientific_name, description, indicative_price, price_unit, presentation, fao_zone, min_size_cm)
SELECT * FROM (VALUES
  ('Espadon', 'Xiphias gladius', 'Poisson noble à chair ferme et goûteuse, excellent grillé', 30, '€/kg', 'tranché', '37.1', 125),
  ('Denti', 'Dentex dentex', 'Poisson noble méditerranéen, chair ferme et savoureuse', 28, '€/kg', 'entier', '37.1', 30),
  ('Corb', 'Umbrina cirrosa', 'Poisson de roche très recherché, chair excellente', 28, '€/kg', 'entier', '37.1', 30),
  ('Beaux Yeux', 'Pagellus bogaraveo', 'Pageot rouge des profondeurs, chair fine', 28, '€/kg', 'entier', '37.1', 25),
  ('Pagre', 'Pagrus pagrus', 'Poisson noble à chair ferme, excellent grillé', 28, '€/kg', 'entier', '37.1', 18),
  ('Mérou', 'Epinephelus marginatus', 'Poisson de roche protégé, pêche très réglementée', 28, '€/kg', 'entier', '37.1', 45),
  ('Mostelle', 'Phycis blennoides', 'Poisson de fond à chair blanche et délicate', 20, '€/kg', 'entier', '37.1', 30),
  ('Bouillabaisse', NULL, 'Mélange de poissons de roche pour bouillabaisse traditionnelle provençale', 18, '€/kg', 'mélange poissons', '37.1', NULL),
  ('Soupe de poisson', NULL, 'Petits poissons de roche pour soupe de poisson méditerranéenne', 14, '€/kg', 'poissons pour soupe', '37.1', NULL),
  ('Oursins', 'Paracentrotus lividus', 'Oursin violet de Méditerranée, corail savoureux et iodé', 10, '€/douzaine', 'la douzaine', '37.1', NULL),
  ('Sabre', 'Lepidopus caudatus', 'Poisson argenté des profondeurs, chair blanche', 6, '€/kg', 'entier', '37.1', NULL),
  ('Sévèreaux', 'Trachurus trachurus', 'Chinchard commun, excellent frit ou mariné', 10, '€/kg', 'entier', '37.1', 15),
  ('Murène', 'Muraena helena', 'Poisson serpentiforme, utilisé en soupe de poisson', 10, '€/kg', 'entier', '37.1', NULL),
  ('Sériole (coupée)', 'Seriola dumerili', 'Poisson puissant de haute mer, chair ferme et savoureuse', 25, '€/kg', 'coupée', '37.1', NULL),
  ('Sériole (entière)', 'Seriola dumerili', 'Poisson puissant de haute mer, chair ferme et savoureuse', 15, '€/kg', 'entière', '37.1', NULL),
  ('Barracuda (coupé)', 'Sphyraena sphyraena', 'Poisson prédateur à chair blanche et ferme', 20, '€/kg', 'coupé', '37.1', NULL),
  ('Barracuda (entier)', 'Sphyraena sphyraena', 'Poisson prédateur à chair blanche et ferme', 15, '€/kg', 'entier', '37.1', NULL),
  ('Baudroie (coupée)', 'Lophius piscatorius', 'Lotte de Méditerranée, chair exceptionnelle sans arêtes', 25, '€/kg', 'coupée', '37.1', NULL),
  ('Langouste', 'Palinurus elephas', 'Crustacé noble de Méditerranée, chair délicate et savoureuse', 75, '€/kg', 'entier', '37.1', NULL),
  ('Roussette', 'Scyliorhinus canicula', 'Petit requin côtier, chair ferme', 10, '€/kg', 'entier', '37.1', NULL)
) AS new_species(name, scientific_name, description, indicative_price, price_unit, presentation, fao_zone, min_size_cm)
WHERE NOT EXISTS (
  SELECT 1 FROM public.species WHERE species.name = new_species.name
);