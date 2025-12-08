# Audit des Formulaires QuaiDirect

## Résumé
Ce document cartographie tous les champs de chaque formulaire, leur destination en base de données, et leur utilisation dans le système.

---

## 1. Authentification (Auth.tsx)

### Formulaire Inscription (signup)
| Champ | Type | Requis | Destination BDD | Table | Utilisation |
|-------|------|--------|-----------------|-------|-------------|
| `email` | email | ✅ | `auth.users.email` | auth.users | Authentification, envoi emails |
| `password` | password | ✅ | `auth.users` (hashé) | auth.users | Authentification |

**Actions post-inscription:**
- Création automatique profil via trigger `handle_new_user()` → `profiles`
- Assignation rôle `user` → `user_roles`
- Envoi email bienvenue via `send-user-welcome-email`

### Formulaire Connexion (signin)
| Champ | Type | Requis | Destination BDD | Utilisation |
|-------|------|--------|-----------------|-------------|
| `email` | email | ✅ | Lookup `auth.users` | Authentification |
| `password` | password | ✅ | Validation | Authentification |

### Formulaire Magic Link (OTP)
| Champ | Type | Requis | Destination BDD | Utilisation |
|-------|------|--------|-----------------|-------------|
| `email` | email | ✅ | Lookup `auth.users` | Envoi code OTP |
| `otp` | code 6 digits | ✅ | Validation session | Vérification |

---

## 2. Onboarding Pêcheur (PecheurOnboarding.tsx)

### Step 1 - Société (Step1Societe.tsx)
| Champ | Variable | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------|-------------|
| SIRET | `siret` | text (14 digits) | ✅ | `fishermen.siret` | `siret` | Identification légale, verrouillé après validation |
| Nom du bateau | `boatName` | text | ✅ | `fishermen.boat_name` | `boat_name` | Affichage public, génération slug |
| Nom propriétaire | `ownerName` | text | ✅ | `fishermen.company_name` | `company_name` | Contact admin |
| Raison sociale | `companyName` | text | ❌ | `fishermen.company_name` | `company_name` | Facturation |
| Adresse | `address` | text | ✅ | `fishermen.address` | `address` | Administration |
| Code postal | `postalCode` | text (5 digits) | ✅ | `fishermen.postal_code` | `postal_code` | Localisation, détection bassin |
| Ville | `city` | text | ✅ | `fishermen.city` | `city` | Localisation |
| Téléphone | `phone` | text | ✅ | `fishermen.phone` | `phone` | Contact, SMS |
| Email | `email` | email | ✅ | `fishermen.email` | `email` | Notifications, support |

**⚠️ Note:** `boat_registration` reçoit la valeur de `siret` (doublon potentiel à nettoyer)

### Step 2 - Liens (Step2Liens.tsx)
| Champ | Variable | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------|-------------|
| Facebook | `facebookUrl` | url | ❌ | `fishermen.facebook_url` | `facebook_url` | Profil public |
| Instagram | `instagramUrl` | url | ❌ | `fishermen.instagram_url` | `instagram_url` | Profil public |
| Site web | `websiteUrl` | url | ❌ | `fishermen.website_url` | `website_url` | Profil public |

### Step 3 - Zones et Méthodes (Step3ZonesMethodes.tsx)
| Champ | Variable | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------|-------------|
| Zone principale | `mainFishingZone` | select | ✅ | `fishermen.main_fishing_zone` | `main_fishing_zone` | Affichage, filtrage espèces |
| Zones détaillées | `fishingZones` | textarea | ❌ | `fishermen.fishing_zones` | `fishing_zones` (array) | SEO, description |
| Méthodes de pêche | `fishingMethods` | checkbox[] | ✅ | `fishermen.fishing_methods` | `fishing_methods` (enum[]) | Filtrage, SEO |

**Valeurs enum `fishing_method`:** `palangre`, `filet`, `ligne`, `casier`, `chalut`, `seine`, `hamecon`, `nasse`, `autre`

### Step 4 - Espèces (Step4Especes.tsx)
| Champ | Variable | Type | Requis | Destination BDD | Table | Utilisation |
|-------|----------|------|--------|-----------------|-------|-------------|
| Espèces sélectionnées | `selectedSpecies` | uuid[] | ✅ | `fishermen_species` | `fishermen_species` | Filtrage arrivages, profil |

**Jointure:** `fishermen_species.species_id` → `species.id`

### Step 5 - Photos (Step5Photos.tsx)
| Champ | Variable | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------|-------------|
| Photo bateau 1 | `photoBoat1` | url | ❌ | `fishermen.photo_boat_1` | `photo_boat_1` | Profil public |
| Photo bateau 2 | `photoBoat2` | url | ❌ | `fishermen.photo_boat_2` | `photo_boat_2` | Profil public |
| Photo vente quai | `photoDockSale` | url | ❌ | `fishermen.photo_dock_sale` | `photo_dock_sale` | Profil public |
| Années expérience | `yearsExperience` | text | ❌ | `fishermen.years_experience` | `years_experience` | SEO, description |
| Passion | `passion` | textarea | ❌ | `fishermen.passion_quote` | `passion_quote` | Génération description IA |
| Style de travail | `workStyle` | textarea | ❌ | `fishermen.work_philosophy` | `work_philosophy` | Génération description IA |
| Message clients | `clientMessage` | textarea | ❌ | `fishermen.client_message` | `client_message` | Profil public |
| Description générée | `generatedDescription` | textarea | ✅ | `fishermen.generated_description` | `generated_description` | Profil public |

### Step 6 - Points de Vente (Step6PointsVente.tsx)
| Champ | Variable | Type | Requis | Destination BDD | Table/Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------------|-------------|
| Label point 1 | `salePoint1Label` | text | ✅ | `fisherman_sale_points.label` | `label` | Affichage carte |
| Adresse point 1 | `salePoint1Address` | text | ✅ | `fisherman_sale_points.address` | `address` | Géocodage, affichage |
| Description point 1 | `salePoint1Description` | textarea | ❌ | `fisherman_sale_points.description` | `description` | Détails |
| Label point 2 | `salePoint2Label` | text | ❌ | `fisherman_sale_points.label` | `label` | Affichage carte |
| Adresse point 2 | `salePoint2Address` | text | ❌ | `fisherman_sale_points.address` | `address` | Géocodage |
| Description point 2 | `salePoint2Description` | textarea | ❌ | `fisherman_sale_points.description` | `description` | Détails |

**Données temporaires stockées dans `fishermen.onboarding_data` (JSONB):**
- `selectedSpecies`
- `salePoint1Label`, `salePoint1Address`, `salePoint1Description`
- `salePoint2Label`, `salePoint2Address`, `salePoint2Description`

---

## 3. Édition Profil Pêcheur (EditFisherProfile.tsx)

### Champs Verrouillés (display only)
| Champ | Source | Raison |
|-------|--------|--------|
| SIRET | `fishermen.siret` | Donnée légale non modifiable |
| N° Immatriculation | `fishermen.boat_registration` | Donnée légale non modifiable |

### Champs Modifiables
| Champ | Variable | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------|-------------|
| Nom du bateau | `boat_name` | text | ✅ | `fishermen.boat_name` | `boat_name` | Affichage public |
| Nom entreprise | `company_name` | text | ❌ | `fishermen.company_name` | `company_name` | Facturation |
| Description courte | `description` | textarea | ❌ | `fishermen.description` | `description` | Profil public |
| Bio | `bio` | textarea | ❌ | `fishermen.bio` | `bio` | Profil public |
| Nom affiché | `displayNamePreference` | select | ❌ | `fishermen.display_name_preference` | `display_name_preference` | Choix affichage |
| Zone pêche | `selectedZoneId` | select | ❌ | `fishermen.zone_id` | `zone_id` | Filtrage espèces |
| Méthodes | `selectedMethods` | checkbox[] | ❌ | `fishermen.fishing_methods` | `fishing_methods` | Filtrage |
| Zones texte | `zones` | textarea | ❌ | `fishermen.fishing_zones` | `fishing_zones` | SEO |
| Espèces | `selectedSpecies` | checkbox[] | ❌ | `fishermen_species` | - | Profil |
| Espèce principale | `primarySpeciesId` | select | ❌ | `fishermen_species.is_primary` | `is_primary` | Mise en avant |

---

## 4. Points de Vente (EditSalePoints.tsx)

| Champ | Variable | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------|-------------|
| Nom | `label` | text | ✅ | `fisherman_sale_points.label` | `label` | Affichage carte/arrivages |
| Adresse | `address` | text | ✅ | `fisherman_sale_points.address` | `address` | Géocodage, affichage |
| Description | `description` | textarea | ❌ | `fisherman_sale_points.description` | `description` | Détails point |
| Latitude | `latitude` | number | ✅* | `fisherman_sale_points.latitude` | `latitude` | Carte |
| Longitude | `longitude` | number | ✅* | `fisherman_sale_points.longitude` | `longitude` | Carte |
| Photo | `photo_url` | url | ❌ | `fisherman_sale_points.photo_url` | `photo_url` | Visuel |
| Principal | `is_primary` | boolean | auto | `fisherman_sale_points.is_primary` | `is_primary` | Ordre affichage |

*Requis via sélection carte ou géocodage

**Contrainte:** Maximum 2 points de vente par pêcheur (trigger BDD `check_sale_points_limit`)

---

## 5. Création Arrivage Wizard (CreateArrivageWizard.tsx)

### Step 1 - Lieu et Horaire (Step1LieuHoraire.tsx)
| Champ | Variable | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------|-------------|
| Point de vente | `salePointId` | uuid | ✅ | `drops.sale_point_id` | `sale_point_id` | Localisation arrivage |
| Date | `date` | Date | ✅ | Calcul → `drops.eta_at` | `eta_at` | Planning |
| Créneau | `timeSlot` | select | ✅ | Calcul → `drops.sale_start_time` | `sale_start_time` | Horaire vente |

### Step 2 - Espèces et Quantités (Step2EspecesQuantites.tsx)
| Champ | Variable | Type | Requis | Destination BDD | Table | Utilisation |
|-------|----------|------|--------|-----------------|-------|-------------|
| Espèce | `speciesId` | uuid | ✅ | `drop_species.species_id` + `offers.species_id` | `drop_species`, `offers` | Filtrage, offres |
| Nom espèce | `speciesName` | text | ✅ | `offers.title` | `offers` | Affichage |
| Quantité | `quantity` | number | ✅ | `offers.total_units` + `offers.available_units` | `offers` | Stock |
| Unité | `unit` | select | ✅ | `offers.price_type` | `offers` | Calcul prix |
| Prix | `price` | number | ✅ | `offers.unit_price` | `offers` | Vente |
| Remarque | `remark` | text | ❌ | `offers.description` | `offers` | Détails |

### Step 3 - Récapitulatif (Step3Recapitulatif.tsx)
| Champ | Variable | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------|-------------|
| Photos | `photos` | url[] | ❌ | `drop_photos.photo_url` | `photo_url` | Galerie arrivage |
| Premium | `isPremium` | boolean | ❌ | `drops.is_premium` | `is_premium` | Visibilité anticipée |

### Données calculées et insérées
| Donnée | Calcul | Destination BDD | Utilisation |
|--------|--------|-----------------|-------------|
| `fisherman_id` | Lookup user → fishermen | `drops.fisherman_id` | Propriété arrivage |
| `latitude/longitude` | Depuis sale_point | `drops.latitude/longitude` | Carte |
| `visible_at` | now() | `drops.visible_at` | Visibilité premium |
| `public_visible_at` | visible_at + 30min si premium | `drops.public_visible_at` | Visibilité publique |
| `status` | 'scheduled' | `drops.status` | État arrivage |
| `port_id` | null | `drops.port_id` | Migration vers sale_points |

---

## 6. Arrivage Simple (SimpleAnnonce.tsx)

| Champ | Variable | Type | Requis | Destination BDD | Colonne/Table | Utilisation |
|-------|----------|------|--------|-----------------|---------------|-------------|
| Point de vente | `salePointId` | uuid | ✅ | `drops.sale_point_id` | `sale_point_id` | Localisation |
| Date | `date` | Date | ✅ | `drops.eta_at` | `eta_at` | Planning |
| Créneau | `timeSlot` | select | ✅ | `drops.sale_start_time` | `sale_start_time` | Horaire |
| Heure personnalisée | `customTime` | time | ❌ | Calcul → `eta_at` | - | Flexibilité |
| Description | `description` | textarea | ✅ | `drops.notes` | `notes` | Texte libre |
| Espèces (tags) | `selectedSpecies` | uuid[] | ❌ | `drop_species` | `species_id` | Tags sans prix |
| Photos | `photos` | url[] | ❌ | `drop_photos` | `photo_url` | Galerie |

**Note:** `drop_type` = 'simple' pour ces arrivages (sans offres détaillées)

---

## 7. Contacts Pêcheur (PecheurContacts.tsx)

### Import CSV
| Colonne CSV | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------------|------|--------|-----------------|---------|-------------|
| email | email | ❌* | `fishermen_contacts.email` | `email` | Envoi emails |
| phone | phone | ❌* | `fishermen_contacts.phone` | `phone` | Envoi SMS |
| first_name | text | ❌ | `fishermen_contacts.first_name` | `first_name` | Personnalisation |
| last_name | text | ❌ | `fishermen_contacts.last_name` | `last_name` | Personnalisation |
| contact_group | text | ❌ | `fishermen_contacts.contact_group` | `contact_group` | Segmentation |

*Au moins email OU phone requis

### Ajout Manuel
| Champ | Variable | Type | Requis | Destination BDD | Colonne | Utilisation |
|-------|----------|------|--------|-----------------|---------|-------------|
| Email | `email` | email | ❌* | `fishermen_contacts.email` | `email` | Messagerie |
| Téléphone | `phone` | phone | ❌* | `fishermen_contacts.phone` | `phone` | SMS |
| Prénom | `first_name` | text | ❌ | `fishermen_contacts.first_name` | `first_name` | Personnalisation |
| Nom | `last_name` | text | ❌ | `fishermen_contacts.last_name` | `last_name` | Personnalisation |
| Groupe | `contact_group` | text | ❌ | `fishermen_contacts.contact_group` | `contact_group` | Filtrage |
| Notes | `notes` | text | ❌ | `fishermen_contacts.notes` | `notes` | Mémo interne |

---

## 8. Champs Orphelins Identifiés

### Table `fishermen` - Colonnes potentiellement inutilisées

| Colonne | Type | Remplie via | Utilisée | Recommandation |
|---------|------|-------------|----------|----------------|
| `license_number` | text | ❌ Aucun formulaire | ❌ Non | **Supprimer ou ajouter au formulaire** |
| `boat_registration` | text | ✅ Onboarding (= siret) | ❌ Affichage seulement | **Doublon avec siret - à clarifier** |
| `fishing_zones_geojson` | jsonb | ❌ Aucun formulaire | ❌ Non | **Supprimer** (feature non implémentée) |
| `can_edit_profile` | boolean | ❌ Automatique | ✅ RLS | OK - garder |
| `default_time_slot` | text | ❌ Aucun formulaire | ❌ Non | **Supprimer ou implémenter** |
| `onboarding_data` | jsonb | ✅ Temporaire | ✅ Onboarding | OK - données transitoires |

### Table `profiles` - Colonnes vs `fishermen`
| Colonne profiles | Équivalent fishermen | Situation |
|------------------|---------------------|-----------|
| `full_name` | `company_name` | **Doublon potentiel** |
| `email` | `email` | **Doublon** - trigger sync |
| `phone` | `phone` | **Doublon potentiel** |
| `address` | `address` | **Doublon potentiel** |
| `postal_code` | `postal_code` | **Doublon potentiel** |
| `city` | `city` | **Doublon potentiel** |

**Recommandation:** Pour les pêcheurs, `fishermen` est la source de vérité. `profiles` sert uniquement aux clients standard.

---

## 9. Flux de Données Visuels

### Inscription → Pêcheur
```
Auth.tsx (signup)
    ↓
auth.users [email, password]
    ↓ (trigger: handle_new_user)
profiles [id, email]
user_roles [user_id, role='user']
    ↓
send-user-welcome-email
    ↓
PecheurPayment.tsx
    ↓ (Stripe checkout)
stripe-webhook → payments [user_id, plan, status]
               → user_roles [role='fisherman']
               → fishermen [user_id, minimal data]
    ↓
PecheurOnboarding.tsx (6 steps)
    ↓
fishermen [all fields]
fishermen_species [associations]
fisherman_sale_points [locations]
```

### Création Arrivage
```
CreateArrivageWizard.tsx
    ↓
Step1: salePointId, date, timeSlot
    ↓
Step2: species[] (id, quantity, price, unit)
    ↓
Step3: photos[], isPremium
    ↓
drops [fisherman_id, sale_point_id, eta_at, sale_start_time, ...]
drop_species [drop_id, species_id]
offers [drop_id, species_id, title, unit_price, total_units, ...]
drop_photos [drop_id, photo_url, display_order]
```

---

## 10. Validations Implémentées

| Formulaire | Validation | Type | Localisation |
|------------|------------|------|--------------|
| Auth signup | Email format | Frontend | Auth.tsx |
| Auth signup | Password min 6 chars | Frontend | Auth.tsx |
| Onboarding Step1 | SIRET 14 digits | Frontend | PecheurOnboarding.tsx |
| Onboarding Step1 | Champs obligatoires | Frontend | PecheurOnboarding.tsx |
| Onboarding Step3 | Zone + méthode requis | Frontend | PecheurOnboarding.tsx |
| Onboarding Step4 | Min 1 espèce | Frontend | PecheurOnboarding.tsx |
| Onboarding Step6 | Min 1 point vente | Frontend | PecheurOnboarding.tsx |
| EditSalePoints | Adresse géocodée | Frontend | EditSalePoints.tsx |
| EditSalePoints | Max 2 points | Backend (trigger) | BDD |
| PecheurContacts | Email format | Frontend + lib | validators.ts |
| PecheurContacts | Phone FR format | Frontend + lib | validators.ts |
| Arrivage | UUID valides | Frontend | CreateArrivageWizard.tsx |
| Arrivage | Min 1 espèce | Frontend | CreateArrivageWizard.tsx |

---

## 11. Recommandations

### Corrections Prioritaires
1. **`boat_registration`** : Clarifier utilisation ou supprimer (doublon siret)
2. **`license_number`** : Ajouter au formulaire ou supprimer
3. **`fishing_zones_geojson`** : Supprimer (non utilisé)
4. **`default_time_slot`** : Implémenter ou supprimer

### Améliorations Suggérées
1. Ajouter validation côté serveur (Edge Function) pour les données critiques
2. Synchroniser `profiles` et `fishermen` via trigger pour éviter incohérences
3. Ajouter `updated_at` automatique sur toutes les tables avec modifications fréquentes

### Nettoyage BDD
```sql
-- Migration proposée pour nettoyer les colonnes orphelines
ALTER TABLE fishermen DROP COLUMN IF EXISTS license_number;
ALTER TABLE fishermen DROP COLUMN IF EXISTS fishing_zones_geojson;
-- ALTER TABLE fishermen DROP COLUMN IF EXISTS default_time_slot; -- À confirmer
```

---

*Document généré le 2025-12-08*
*Audit réalisé par Lovable AI*
