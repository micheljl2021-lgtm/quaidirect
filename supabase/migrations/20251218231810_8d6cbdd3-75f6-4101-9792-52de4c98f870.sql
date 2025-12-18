-- ============================================================
-- IMPORT DES ESPÈCES MÉDITERRANÉENNES AVEC ENGINS DE PÊCHE
-- Source: Fichier Excel Liste_especes_completee.xlsx
-- ============================================================

-- D'abord, créer une table temporaire pour le mapping des engins de pêche
-- Mapping Excel → enum fishing_method

-- Mettre à jour les espèces existantes avec fishing_area = 'mediterranee'
-- Et ajouter les nouvelles espèces avec leurs engins de pêche

-- POISSONS BLEUS
INSERT INTO species (name, scientific_name, fishing_area, fishing_gear, description) VALUES
('Albacore', 'Thunnus albacares', 'mediterranee', 'ligne,canne', 'Thon albacore, excellente source de protéines, saveur de viande'),
('Alose feinte', 'Alosa fallax', 'mediterranee', 'filet', 'Chair délicate, légèrement grasse'),
('Anchois', 'Engraulidae', 'mediterranee', 'chalut', 'Poisson gras riche en oméga-3'),
('Bonite', 'Sarda spp', 'mediterranee', 'ligne,canne', 'Proche du thon, reproduction rapide'),
('Chinchard à queue jaune', 'Trachurus mediterraneus', 'mediterranee', 'chalut,palangre,ligne', 'Chinchard méditerranéen à nageoire caudale jaune'),
('Espadon', 'Xiphias gladius', 'mediterranee', 'palangre', 'Poisson imposant, chair ferme'),
('Germon', 'Thunnus alalunga', 'mediterranee', 'palangre', 'Thon blanc, chair délicate'),
('Maquereau commun', 'Scomber scombrus', 'mediterranee', 'chalut,filet,ligne', 'Poisson gras savoureux'),
('Sardine', 'Sardina pilchardus', 'mediterranee', 'chalut,filet,senne', 'Petit poisson bleu traditionnel'),
('Thon rouge', 'Thunnus thynnus', 'mediterranee', 'palangre,senne,ligne', 'Espèce prestigieuse, chair rouge')
ON CONFLICT (name) DO UPDATE SET 
  fishing_area = EXCLUDED.fishing_area,
  fishing_gear = EXCLUDED.fishing_gear,
  description = COALESCE(EXCLUDED.description, species.description);

-- POISSONS BLANCS
INSERT INTO species (name, scientific_name, fishing_area, fishing_gear, description) VALUES
('Bar européen', 'Dicentrarchus labrax', 'mediterranee', 'filet,palangre', 'Loup de mer, chair fine et maigre'),
('Baudroie', 'Lophius spp', 'mediterranee', 'chalut,palangre,ligne', 'Lotte de mer, chair ferme sans arêtes'),
('Bogue', 'Boops boops', 'mediterranee', 'filet', 'Sparidé méditerranéen'),
('Capelan', 'Mallotus villosus', 'mediterranee', 'filet', 'Poisson de fond'),
('Congre d''Europe', 'Conger conger', 'mediterranee', 'chalut,filet', 'Anguille de mer, chair dense'),
('Denté commun', 'Dentex dentex', 'mediterranee', 'palangre', 'Sparidé noble, chair fine'),
('Dorade royale', 'Sparus aurata', 'mediterranee', 'traine,chalut,ligne', 'Poisson argenté à bandeau doré'),
('Maigre commun', 'Argyrosomus regius', 'mediterranee', 'chalut,palangre', 'Chair ferme proche du bar'),
('Marbré', 'Lithognathus mormyrus', 'mediterranee', 'chalut,filet', 'Sparidé proche de la daurade'),
('Merlan', 'Merlangius merlangus', 'mediterranee', 'chalut,filet,ligne', 'Poisson maigre à chair délicate'),
('Merlu européen', 'Merluccius merluccius', 'mediterranee', 'filet,palangre', 'Chair ferme, peu d''arêtes'),
('Mulet à grosse tête', 'Mugil cephalus', 'mediterranee', 'filet,ligne,senne', 'Chair ferme et savoureuse'),
('Mulet doré', 'Liza aurata', 'mediterranee', 'filet,ligne,senne', 'Chair légèrement grasse'),
('Mulet Europe', 'Mugil spp', 'mediterranee', 'filet,ligne,senne', 'Source de fer et phosphore'),
('Mulet labeon', 'Oedalechilus labeo', 'mediterranee', 'filet,ligne,senne', 'Chair ferme méditerranéenne'),
('Mulet porc', 'Liza ramada', 'mediterranee', 'filet,ligne,senne', 'Chair ferme et délicate'),
('Mulet sauteur', 'Liza saliens', 'mediterranee', 'filet,ligne,senne', 'Capacité à sauter hors de l''eau'),
('Oblade', 'Oblada melanura', 'mediterranee', 'ligne,filet', 'Sparidé proche de la daurade'),
('Pageot acarne', 'Pagellus acarne', 'mediterranee', 'ligne,filet,senne', 'Sparidé méditerranéen'),
('Pageot commun', 'Pagellus erythrinus', 'mediterranee', 'ligne,filet,senne', 'Chair délicate et savoureuse'),
('Pagre commun', 'Pagrus pagrus', 'mediterranee', 'ligne,filet,palangre', 'Sparidé à chair ferme'),
('Rouget barbet', 'Mullus barbatus', 'mediterranee', 'chalut,filet', 'Chair fine et parfumée'),
('Rouget de roche', 'Mullus surmuletus', 'mediterranee', 'filet,ligne', 'Chair délicate très appréciée'),
('Saint-Pierre', 'Zeus faber', 'mediterranee', 'chalut,filet', 'Chair fine et délicate'),
('Sar commun', 'Diplodus sargus', 'mediterranee', 'ligne,filet', 'Sparidé côtier'),
('Sar à tête noire', 'Diplodus vulgaris', 'mediterranee', 'ligne,filet', 'Sparidé méditerranéen'),
('Sole commune', 'Solea solea', 'mediterranee', 'chalut,filet', 'Poisson plat noble'),
('Turbot', 'Scophthalmus maximus', 'mediterranee', 'chalut,filet', 'Poisson plat prestigieux')
ON CONFLICT (name) DO UPDATE SET 
  fishing_area = EXCLUDED.fishing_area,
  fishing_gear = EXCLUDED.fishing_gear,
  description = COALESCE(EXCLUDED.description, species.description);

-- AUTRES POISSONS
INSERT INTO species (name, scientific_name, fishing_area, fishing_gear, description) VALUES
('Anguille d''Europe', 'Anguilla anguilla', 'mediterranee', 'filet', 'Poisson migrateur à chair grasse'),
('Barbue', 'Scophthalmus rhombus', 'mediterranee', 'chalut', 'Poisson plat à chair blanche'),
('Barracuda', 'Sphyraena barracuda', 'mediterranee', 'traine,palangre', 'Prédateur, chair excellente'),
('Cernier commun', 'Polyprion americanus', 'mediterranee', 'chalut,palangre,ligne', 'Mérou des profondeurs'),
('Chien espagnol', 'Galeus melastomus', 'mediterranee', 'filet', 'Petit requin à chair délicate'),
('Corb commun', 'Sciaena umbra', 'mediterranee', 'chalut,filet', 'Chair ferme et fine'),
('Coryphène commune', 'Coryphaena hippurus', 'mediterranee', 'chalut,ligne', 'Poisson coloré spectaculaire'),
('Émissoles nca', 'Mustelus spp', 'mediterranee', 'traine,filet', 'Chien de mer'),
('Éperlan européen', 'Osmerus eperlanus', 'mediterranee', 'filet', 'Petit poisson en friture'),
('Girelle', 'Coris julis', 'mediterranee', 'ligne,filet,casier', 'Petit poisson coloré'),
('Grande roussette', 'Scyliorhinus stellaris', 'mediterranee', 'chalut,palangre', 'Petit requin cuisiné en sauce'),
('Grande vive', 'Trachinus draco', 'mediterranee', 'filet,chalut', 'Chair fine, épines venimeuses'),
('Grondin commun', 'Lepidotrigla cavillone', 'mediterranee', 'filet,chalut', 'Chair blanche délicate'),
('Joël', 'Atherina boyeri', 'mediterranee', 'nasse,ligne,filet', 'Athérine en friture'),
('Liche', 'Lichia amia', 'mediterranee', 'traine,ligne', 'Chair fine très appréciée'),
('Limande', 'Limanda limanda', 'mediterranee', 'chalut,filet', 'Poisson plat délicat'),
('Mérou brun', 'Epinephelus marginatus', 'mediterranee', 'casier,ligne', 'Chair dense et délicate'),
('Motelles nca', 'Gaidropsarus spp', 'mediterranee', 'casier,ligne', 'Poisson de fond méditerranéen'),
('Murène de Méditerranée', 'muraena helena', 'mediterranee', 'senne,plongee', 'Chair ferme et délicate'),
('Orphie', 'Belone belone', 'mediterranee', 'filet,ligne', 'Poisson allongé à bec'),
('Rascasse rouge', 'Scorpaena scrofa', 'mediterranee', 'filet,ligne,casier', 'Essentielle pour la bouillabaisse'),
('Raie bouclée', 'Raja clavata', 'mediterranee', 'chalut,filet', 'Chair ferme et savoureuse'),
('Sériole', 'Seriola dumerili', 'mediterranee', 'traine,palangre,ligne', 'Chair ferme appréciée'),
('Tacaud', 'Trisopterus luscus', 'mediterranee', 'chalut,filet', 'Petit poisson à chair fragile')
ON CONFLICT (name) DO UPDATE SET 
  fishing_area = EXCLUDED.fishing_area,
  fishing_gear = EXCLUDED.fishing_gear,
  description = COALESCE(EXCLUDED.description, species.description);

-- POISSONS PLATS
INSERT INTO species (name, scientific_name, fishing_area, fishing_gear, description) VALUES
('Cardines nca', 'Lepidorhombus spp', 'mediterranee', 'chalut', 'Chair ferme, cuisson rapide'),
('Flétan de l''Atlantique', 'Hippoglossus hippoglossus', 'mediterranee', 'filet', 'Grand poisson plat'),
('Plie commune', 'Pleuronectes platessa', 'mediterranee', 'chalut,filet', 'Poisson plat classique')
ON CONFLICT (name) DO UPDATE SET 
  fishing_area = EXCLUDED.fishing_area,
  fishing_gear = EXCLUDED.fishing_gear,
  description = COALESCE(EXCLUDED.description, species.description);

-- CRUSTACÉS
INSERT INTO species (name, scientific_name, fishing_area, fishing_gear, description) VALUES
('Araignée européenne', 'Maja squinado', 'mediterranee', 'casier,filet', 'Crabe araignée à chair délicate'),
('Cigales nca', 'Scyllaridae', 'mediterranee', 'chalut', 'Crustacé à chair sucrée'),
('Crabe vert de la Méditerranée', 'Carcinus aestuarii', 'mediterranee', 'peche_pied', 'Favouille, idéal en soupe'),
('Crevette grise', 'Crangon crangon', 'mediterranee', 'chalut', 'Petite crevette savoureuse'),
('Crevette rose', 'Palaemon serratus', 'mediterranee', 'casier,filet', 'Bouquet, chair délicate'),
('Étrille commune', 'Necora puber', 'mediterranee', 'peche_pied', 'Petit crabe savoureux'),
('Galathées', 'Galatheidae', 'mediterranee', 'chalut,casier', 'Langoustines des profondeurs'),
('Gambon écarlate', 'Plesiopenaeus edwardsianus', 'mediterranee', 'filet,chalut', 'Crevette rouge d''exception'),
('Homard européen', 'Homarus gammarus', 'mediterranee', 'casier,filet', 'Crustacé noble'),
('Langouste rouge', 'Palinurus elephas', 'mediterranee', 'casier,filet', 'Crustacé prestigieux'),
('Langoustine', 'Nephrops norvegicus', 'mediterranee', 'chalut,casier', 'Scampi, chair délicate'),
('Tourteau', 'Cancer pagurus', 'mediterranee', 'casier,filet', 'Crabe à chair généreuse')
ON CONFLICT (name) DO UPDATE SET 
  fishing_area = EXCLUDED.fishing_area,
  fishing_gear = EXCLUDED.fishing_gear,
  description = COALESCE(EXCLUDED.description, species.description);

-- CÉPHALOPODES
INSERT INTO species (name, scientific_name, fishing_area, fishing_gear, description) VALUES
('Calmars côtiers nca', 'Loliginidae', 'mediterranee', 'ligne,canne', 'Chair blanche tendre'),
('Encornet', 'Loligo vulgaris', 'mediterranee', 'chalut,ligne', 'Calamar, facile à préparer'),
('Poulpe commun', 'Octopus vulgaris', 'mediterranee', 'casier,ligne,plongee', 'Chair tendre après cuisson'),
('Seiche commune', 'Sepia officinalis', 'mediterranee', 'chalut,casier,ligne', 'Chair ferme et savoureuse')
ON CONFLICT (name) DO UPDATE SET 
  fishing_area = EXCLUDED.fishing_area,
  fishing_gear = EXCLUDED.fishing_gear,
  description = COALESCE(EXCLUDED.description, species.description);

-- COQUILLAGES
INSERT INTO species (name, scientific_name, fishing_area, fishing_gear, description) VALUES
('Clovisses nca', 'Ruditapes spp', 'mediterranee', 'peche_pied', 'Petits coquillages savoureux'),
('Crepidule', 'Crepidula fornicata', 'mediterranee', 'peche_pied', 'Petit coquillage de fond'),
('Moule commune', 'Mytilus edulis', 'mediterranee', 'peche_pied', 'Coquillage classique'),
('Moule méditerranéenne', 'Mytilus galloprovincialis', 'mediterranee', 'peche_pied', 'Moule typique de Méditerranée'),
('Oursins', 'Echinoidea', 'mediterranee', 'plongee,peche_pied', 'Chair crémeuse iodée'),
('Palourde', 'Ruditapes philippinarum', 'mediterranee', 'peche_pied', 'Coquillage à chair tendre'),
('Praire', 'Venus verrucosa', 'mediterranee', 'peche_pied,drague', 'Coquillage savoureux'),
('Telline', 'Donax trunculus', 'mediterranee', 'peche_pied', 'Petit coquillage délicat'),
('Vernis', 'Callista chione', 'mediterranee', 'drague,peche_pied', 'Coquillage à chair ferme'),
('Violet', 'Microcosmus sulcatus', 'mediterranee', 'plongee,peche_pied', 'Fruit de mer iodé')
ON CONFLICT (name) DO UPDATE SET 
  fishing_area = EXCLUDED.fishing_area,
  fishing_gear = EXCLUDED.fishing_gear,
  description = COALESCE(EXCLUDED.description, species.description);