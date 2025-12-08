# Audit des Champs Orphelins - QuaiDirect

> **Date**: 2025-12-08  
> **Statut**: Audit complet

---

## 1. Colonnes Non Utilisées (Table `fishermen`)

| Colonne | Type | Statut | Recommandation |
|---------|------|--------|----------------|
| `license_number` | TEXT | ❌ Jamais utilisé | **SUPPRIMER** |
| `fishing_zones_geojson` | JSONB | ❌ Jamais utilisé | **SUPPRIMER** |
| `can_edit_profile` | BOOLEAN | ❌ Non exploité | **SUPPRIMER** |
| `client_message` | TEXT | ⚠️ Non affiché | Vérifier usage prévu |

### 1.1 Détails

#### `license_number`
- **Origine**: Probablement prévu pour numéro de licence de pêche
- **Problème**: Aucun formulaire ne collecte cette donnée
- **Impact suppression**: Aucun

#### `fishing_zones_geojson`
- **Origine**: Prévu pour zones de pêche en format GeoJSON
- **Problème**: Le système utilise `fishing_zones` (tableau de strings) à la place
- **Impact suppression**: Aucun

#### `can_edit_profile`
- **Origine**: Flag pour contrôler l'édition du profil
- **Problème**: La logique d'édition utilise le système de tokens sécurisés (`secure_edit_tokens`)
- **Impact suppression**: Aucun

---

## 2. Doublons Potentiels

### 2.1 `boat_registration` vs `siret`

| Champ | Utilisation Actuelle | Clarification |
|-------|---------------------|---------------|
| `siret` | Numéro SIRET entreprise (14 chiffres) | ✅ Correct |
| `boat_registration` | Stocke aussi le SIRET dans certains cas | ⚠️ Confusion |

**Recommandation**: 
- Garder `boat_registration` pour l'immatriculation du bateau (ex: `PLM 12345`)
- Ajouter un commentaire SQL pour clarifier la différence
- Vérifier les données existantes pour corriger les doublons

### 2.2 Duplication `profiles` ↔ `fishermen`

| Champ | `profiles` | `fishermen` | Recommandation |
|-------|-----------|-------------|----------------|
| `email` | ✅ | ✅ | `fishermen` = source de vérité |
| `phone` | ✅ | ✅ | `fishermen` = source de vérité |
| `address` | ✅ | ✅ | `fishermen` = source de vérité |
| `city` | ✅ | ✅ | `fishermen` = source de vérité |
| `postal_code` | ✅ | ✅ | `fishermen` = source de vérité |

**Recommandation**: Créer un trigger de synchronisation `fishermen` → `profiles` ou supprimer les colonnes dupliquées de `profiles`.

---

## 3. Tables/Colonnes Sous-Utilisées

### 3.1 Table `premium_subscriptions`

**Statut**: ❌ N'existe pas dans le schéma actuel

La documentation mentionne cette table mais elle n'existe pas. Les abonnements premium sont gérés via la table `payments` avec `plan = 'premium'`.

### 3.2 Colonnes `fishermen` peu exploitées

| Colonne | Remplie | Affichée | Action |
|---------|---------|----------|--------|
| `passion_quote` | Rarement | Profil public | Garder |
| `work_philosophy` | Rarement | Profil public | Garder |
| `years_experience` | Rarement | Non affiché | Vérifier usage |
| `default_time_slot` | Jamais | Non utilisé | **SUPPRIMER ou implémenter** |

---

## 4. Migrations Recommandées

### 4.1 Migration 1 : Suppression colonnes orphelines

```sql
-- Migration: drop_orphan_columns_fishermen
-- Description: Supprime les colonnes jamais utilisées de la table fishermen

ALTER TABLE fishermen DROP COLUMN IF EXISTS license_number;
ALTER TABLE fishermen DROP COLUMN IF EXISTS fishing_zones_geojson;
ALTER TABLE fishermen DROP COLUMN IF EXISTS can_edit_profile;
```

### 4.2 Migration 2 : Clarification boat_registration

```sql
-- Migration: clarify_boat_registration
-- Description: Ajoute un commentaire pour clarifier la différence avec siret

COMMENT ON COLUMN fishermen.boat_registration IS 
  'Numéro d''immatriculation du bateau (ex: PLM 12345). Distinct du SIRET qui est le numéro d''entreprise.';

COMMENT ON COLUMN fishermen.siret IS 
  'Numéro SIRET de l''entreprise (14 chiffres). Distinct de l''immatriculation bateau.';
```

### 4.3 Migration 3 : Nettoyage default_time_slot

```sql
-- Option A: Supprimer si non prévu
ALTER TABLE fishermen DROP COLUMN IF EXISTS default_time_slot;

-- Option B: Implémenter dans l'UI de création d'arrivage
-- (préférer cette option pour améliorer l'UX pêcheur)
```

---

## 5. Colonnes Utilisées Correctement ✅

| Table | Colonne | Formulaire | Usage |
|-------|---------|------------|-------|
| `fishermen` | `siret` | Onboarding Step 1 | Validation entreprise |
| `fishermen` | `boat_name` | Onboarding Step 1 | Identifiant principal |
| `fishermen` | `fishing_methods` | Onboarding Step 3 | Profil public |
| `fishermen` | `fishing_zones` | Onboarding Step 3 | Filtrage espèces |
| `fishermen` | `photo_url` | Onboarding Step 5 | Profil public |
| `drops` | `sale_point_id` | Wizard Step 1 | Localisation arrivage |
| `drops` | `sale_start_time` | Wizard Step 1 | Horaire vente |
| `offers` | `unit_price` | Wizard Step 2 | Prix affichés |
| `drop_photos` | `photo_url` | Wizard Step 2 | Galerie arrivage |

---

## 6. Checklist Nettoyage

- [ ] Supprimer `license_number`
- [ ] Supprimer `fishing_zones_geojson`
- [ ] Supprimer `can_edit_profile`
- [ ] Décider sort de `default_time_slot`
- [ ] Ajouter commentaires SQL sur `boat_registration` et `siret`
- [ ] Vérifier données existantes avant suppression
- [ ] Créer backup des colonnes avant suppression

---

## 7. Impact Estimé

| Action | Risque | Effort |
|--------|--------|--------|
| Suppression 3 colonnes | Aucun | 5 min |
| Clarification boat_registration | Aucun | 2 min |
| Décision default_time_slot | Faible | 10 min |
| Synchronisation profiles/fishermen | Moyen | 30 min |

**Total estimé**: 1h de travail avec tests
