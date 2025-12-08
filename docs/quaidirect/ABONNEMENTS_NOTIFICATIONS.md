# Modèle d'Abonnements & Notifications - QuaiDirect

> **Date**: 2025-12-08  
> **Statut**: ✅ Implémenté

---

## 1. Vue d'Ensemble

QuaiDirect propose deux écosystèmes d'abonnements distincts :
- **Pêcheurs** : Accès aux outils de vente directe + SMS inclus
- **Clients** : Accès prioritaire aux arrivages et notifications

---

## 2. Abonnements Pêcheurs ✅

### 2.1 Plans Disponibles

| Plan | Prix | Période | Stripe Price ID |
|------|------|---------|-----------------|
| **Pêcheur** | 150€ | Annuel | `price_1SZYAXH0VhS1yyE0FqJ0imbu` |
| **Pêcheur PRO** | 199€ | Annuel | `price_1SYgOuH0VhS1yyE0XINPVQdm` |

### 2.2 Fonctionnalités par Plan

| Fonctionnalité | Pêcheur | Pêcheur PRO |
|----------------|---------|-------------|
| Fiche pêcheur + points de vente | ✅ | ✅ |
| Emails illimités | ✅ | ✅ |
| **SMS/mois (pendant 1 an)** | 100 | 100 |
| **SMS bonus à l'inscription** | ❌ | 500 |
| **Total SMS 1ère année** | 1 200 | 1 700 |
| Partage WhatsApp | ✅ | ✅ |
| IA textes/descriptions | ✅ | ✅ |
| Multi-points de vente | 1 | 2 |
| IA météo/marée | ❌ | ✅ |
| IA tarification | ❌ | ✅ |
| Statistiques CA | ❌ | ✅ |
| Support prioritaire | ❌ | ✅ |

### 2.3 Packs SMS Optionnels

Achetables après inscription pour recharger le solde SMS :

| Pack | Quantité | Prix | Prix/SMS |
|------|----------|------|----------|
| **SMS Pack** | 500 SMS | 40€ | 0.08€ |
| **SMS+ Pack** | 1000 SMS | 70€ | 0.07€ |

**Note** : Ces packs sont des achats one-time, pas des abonnements.

---

## 3. Abonnements Clients ✅

### 3.1 Niveaux Disponibles

| Niveau | Prix Mensuel | Prix Annuel | Description |
|--------|--------------|-------------|-------------|
| **Follower** | Gratuit | Gratuit | Compte de base |
| **Premium** | 2,50€ | 25€ | Notifications prioritaires |
| **Premium+** | 4€ | 40€ | Notifications + SMS + Cagnotte |

### 3.2 Fonctionnalités par Niveau

| Fonctionnalité | Follower | Premium | Premium+ |
|----------------|----------|---------|----------|
| Voir arrivages publics | ✅ | ✅ | ✅ |
| Suivre pêcheurs favoris | ✅ | ✅ | ✅ |
| Suivre ports favoris | ✅ | ✅ | ✅ |
| 🔔 Notifications Push | ❌ | ✅ | ✅ |
| 📧 Notifications Email | ❌ | ✅ | ✅ |
| 📱 Notifications SMS | ❌ | ❌ | ✅ |
| ⚡ Accès anticipé (30min) | ❌ | ✅ | ✅ |
| ✨ Badge Premium visible | ❌ | ✅ | ✅ |
| 💰 Contribution cagnotte SMS | ❌ | ❌ | ✅ |

### 3.3 Canaux de Notification

```
┌─────────────────────────────────────────────────────────────┐
│                    NOUVEL ARRIVAGE                          │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
      ┌────────┐      ┌────────┐      ┌────────┐
      │  PUSH  │      │ EMAIL  │      │  SMS   │
      └────────┘      └────────┘      └────────┘
           │               │               │
           ▼               ▼               ▼
      Premium+         Premium+        Premium+
       Premium          Premium          ONLY
       (tous)           (tous)
```

---

## 4. Système de Cagnotte SMS

### 4.1 Concept

Les abonnés **Premium+** contribuent à une cagnotte qui finance les SMS des pêcheurs qu'ils suivent.

### 4.2 Flux Financier

```
┌──────────────────┐
│ Client Premium+  │
│   40€/an         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Répartition      │
│ • 25€ → Platform │
│ • 15€ → Cagnotte │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Cagnotte SMS     │
│ (fisherman_id)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Pêcheur reçoit   │
│ ~1.25€/mois/     │
│ client Premium+  │
└──────────────────┘
```

### 4.3 Règles de Distribution

1. **Répartition mensuelle** : Le 1er de chaque mois
2. **Calcul** : 15€/an ÷ 12 mois = 1.25€/mois par client Premium+
3. **Attribution** : Réparti entre les pêcheurs suivis par le client
4. **Solde minimum** : Crédit utilisable dès 5€ accumulés

---

## 5. Schéma Base de Données ✅

### 5.1 Type Enum

```sql
CREATE TYPE client_subscription_level AS ENUM (
  'follower',     -- Gratuit
  'premium',      -- 25€/an ou 2.50€/mois
  'premium_plus'  -- 40€/an ou 4€/mois
);
```

### 5.2 Colonnes Ajoutées à `payments`

| Colonne | Type | Description |
|---------|------|-------------|
| `subscription_level` | `client_subscription_level` | Niveau client (default: follower) |
| `sms_pool_contribution_cents` | `INTEGER` | Contribution cagnotte en centimes |

### 5.3 Table `sms_pool` (Cagnotte)

```sql
CREATE TABLE sms_pool (
  id UUID PRIMARY KEY,
  fisherman_id UUID NOT NULL REFERENCES fishermen(id),
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_credited_cents INTEGER NOT NULL DEFAULT 0,
  total_used_cents INTEGER NOT NULL DEFAULT 0,
  last_credited_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 Table `sms_pool_contributions`

```sql
CREATE TABLE sms_pool_contributions (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments(id),
  fisherman_id UUID REFERENCES fishermen(id),
  contributor_user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  contribution_month DATE NOT NULL,
  contributed_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.5 Table `notification_preferences`

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_frequency TEXT DEFAULT 'instant', -- instant/daily/weekly
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.6 Colonnes Ajoutées à `fishermen_sms_usage`

| Colonne | Type | Description |
|---------|------|-------------|
| `monthly_allocation` | `INTEGER` | SMS alloués/mois (default: 100) |
| `bonus_sms_at_signup` | `INTEGER` | SMS bonus inscription (PRO: 500) |

---

## 6. Stripe Products

### 6.1 Produits Pêcheurs

| Produit | Type | Prix | Stripe Price ID |
|---------|------|------|-----------------|
| Pêcheur | Subscription | 150€/an | `price_1SZYAXH0VhS1yyE0FqJ0imbu` |
| Pêcheur PRO | Subscription | 199€/an | `price_1SYgOuH0VhS1yyE0XINPVQdm` |
| SMS Pack 500 | One-time | 40€ | `price_SMS_500_40` (à créer) |
| SMS+ Pack 1000 | One-time | 70€ | `price_SMS_1000_70` (à créer) |

### 6.2 Produits Clients

| Produit | Type | Prix | Stripe Price ID |
|---------|------|------|-----------------|
| Premium Mensuel | Subscription | 2.50€/mois | `price_1SZ489H0VhS1yyE0Nc9KZhy1` |
| Premium Annuel | Subscription | 25€/an | `price_1SZ48UH0VhS1yyE0iYmXen3H` |
| Premium+ Mensuel | Subscription | 4€/mois | `price_1SZ48yH0VhS1yyE0bijfw3y7` |
| Premium+ Annuel | Subscription | 40€/an | `price_1SZ49DH0VhS1yyE06HJyLC65` |

---

## 7. Edge Functions Requises

### 7.1 `distribute-sms-pool` (CRON mensuel)

```typescript
// Exécuté le 1er de chaque mois
// 1. Récupère tous les paiements Premium+ actifs
// 2. Calcule la contribution (15€/12 = 1.25€)
// 3. Répartit entre les pêcheurs suivis
// 4. Crédite les cagnottes
```

### 7.2 `check-client-subscription`

```typescript
// Vérifie le niveau d'abonnement client
// Retourne : { level: 'follower' | 'premium' | 'premium_plus', ... }
```

### 7.3 Modification `send-drop-notification`

```typescript
// Logique de routage par niveau :
// 1. Vérifier le niveau du destinataire
// 2. Appliquer les canaux autorisés
// 3. Envoyer via Push/Email/SMS selon niveau
```

---

## 8. Webhook Stripe

Événements à gérer dans `stripe-webhook` :

| Événement | Action |
|-----------|--------|
| `customer.subscription.created` | Mettre à jour `subscription_level` |
| `customer.subscription.updated` | Mettre à jour `subscription_level` |
| `customer.subscription.deleted` | Rétrograder vers `follower` |
| `invoice.paid` (fisherman) | Créditer SMS mensuels |

---

## 9. Checklist Implémentation

- [x] Créer enum `client_subscription_level`
- [x] Modifier table `payments` (subscription_level, sms_pool_contribution_cents)
- [x] Créer table `sms_pool`
- [x] Créer table `sms_pool_contributions`
- [x] Créer table `notification_preferences`
- [x] Modifier `fishermen_sms_usage` (monthly_allocation, bonus_sms_at_signup)
- [x] Mettre à jour `PecheurPayment.tsx` (Pêcheur + Pêcheur PRO + Packs SMS)
- [x] Mettre à jour `PremiumPaywall.tsx` (3 niveaux clients)
- [ ] Créer produits Stripe pour packs SMS (price_SMS_500_40, price_SMS_1000_70)
- [ ] Créer Edge Function `check-client-subscription`
- [ ] Créer Edge Function `distribute-sms-pool`
- [ ] Modifier `send-drop-notification` pour routage par niveau
- [ ] Modifier `stripe-webhook` pour gérer niveaux clients
- [ ] Créer UI préférences notifications
- [ ] Migrer abonnements existants

---

## 10. Métriques à Suivre

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Conversion Follower → Premium | % upgrade | > 15% |
| Conversion Premium → Premium+ | % upgrade | > 30% |
| Churn Premium | % désabonnement/mois | < 5% |
| Cagnotte moyenne/pêcheur | €/mois | > 20€ |
| SMS utilisés/cagnotte | Ratio utilisation | > 70% |
| SMS envoyés pêcheurs/mois | Volume | Croissant |