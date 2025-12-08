# Modèle d'Abonnements & Notifications - QuaiDirect

> **Date**: 2025-12-08  
> **Statut**: Spécification complète pour implémentation

---

## 1. Vue d'Ensemble

QuaiDirect propose deux écosystèmes d'abonnements distincts :
- **Pêcheurs** : Accès aux outils de vente directe
- **Clients** : Accès prioritaire aux arrivages et notifications

---

## 2. Abonnements Pêcheurs (Implémenté ✅)

### 2.1 Plans Disponibles

| Plan | Prix | Période | Stripe Price ID |
|------|------|---------|-----------------|
| Basic | 150€ | Annuel | `price_BASIC_150_YEAR` |
| Pro | 199€ | Annuel | `price_PRO_199_YEAR` |

### 2.2 Fonctionnalités par Plan

| Fonctionnalité | Basic | Pro |
|----------------|-------|-----|
| Emails illimités | ✅ | ✅ |
| Partage WhatsApp | ✅ | ✅ |
| IA textes/descriptions | ✅ | ✅ |
| Multi-points de vente | 1 | 2 |
| IA météo/marée | ❌ | ✅ |
| IA tarification | ❌ | ✅ |
| Statistiques CA | ❌ | ✅ |
| Support prioritaire | ❌ | ✅ |

### 2.3 Packs SMS (Optionnels)

| Pack | Quantité | Prix | Prix/SMS |
|------|----------|------|----------|
| Starter | 500 SMS | 49€ | 0.098€ |
| Business | 2000 SMS | 149€ | 0.0745€ |
| Enterprise | 5000 SMS | 299€ | 0.0598€ |

---

## 3. Abonnements Clients (À Implémenter)

### 3.1 Niveaux Proposés

| Niveau | Prix | Période | Description |
|--------|------|---------|-------------|
| **Follower** | Gratuit | - | Compte de base, suit des pêcheurs |
| **Premium** | 25€ | Annuel | Notifications prioritaires |
| **Premium+** | 40€ | Annuel | Notifications + SMS + Cagnotte |

### 3.2 Fonctionnalités par Niveau

| Fonctionnalité | Follower | Premium | Premium+ |
|----------------|----------|---------|----------|
| Voir arrivages publics | ✅ | ✅ | ✅ |
| Suivre pêcheurs favoris | ✅ | ✅ | ✅ |
| Suivre ports favoris | ✅ | ✅ | ✅ |
| Notifications Push | ❌ | ✅ | ✅ |
| Notifications Email | ❌ | ✅ | ✅ |
| Notifications SMS | ❌ | ❌ | ✅ |
| Accès anticipé (30min) | ❌ | ✅ | ✅ |
| Badge Premium visible | ❌ | ✅ | ✅ |
| Contribution cagnotte SMS | ❌ | ❌ | ✅ |

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

Les abonnés Premium+ contribuent à une cagnotte qui finance les SMS des pêcheurs.

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

## 5. Schéma Base de Données

### 5.1 Nouveau Type Enum

```sql
CREATE TYPE client_subscription_level AS ENUM (
  'follower',    -- Gratuit
  'premium',     -- 25€/an
  'premium_plus' -- 40€/an
);
```

### 5.2 Modification Table `payments`

```sql
ALTER TABLE payments 
ADD COLUMN subscription_level client_subscription_level DEFAULT 'follower';

ALTER TABLE payments 
ADD COLUMN sms_pool_contribution_cents INTEGER DEFAULT 0;

COMMENT ON COLUMN payments.subscription_level IS 
  'Niveau d''abonnement client (follower/premium/premium_plus)';

COMMENT ON COLUMN payments.sms_pool_contribution_cents IS 
  'Montant en centimes versé à la cagnotte SMS (Premium+ uniquement)';
```

### 5.3 Table `sms_pool` (Cagnotte)

```sql
CREATE TABLE sms_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_credited_cents INTEGER NOT NULL DEFAULT 0,
  total_used_cents INTEGER NOT NULL DEFAULT 0,
  last_credited_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT positive_balance CHECK (balance_cents >= 0)
);

-- Index pour recherche rapide
CREATE INDEX idx_sms_pool_fisherman ON sms_pool(fisherman_id);

-- RLS
ALTER TABLE sms_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view their own pool"
  ON sms_pool FOR SELECT
  USING (fisherman_id IN (
    SELECT id FROM fishermen WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all pools"
  ON sms_pool FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage pools"
  ON sms_pool FOR ALL
  USING (true);
```

### 5.4 Table `sms_pool_contributions`

```sql
CREATE TABLE sms_pool_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  contributor_user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  contribution_month DATE NOT NULL,
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT positive_amount CHECK (amount_cents > 0)
);

-- Index pour reporting
CREATE INDEX idx_contributions_fisherman ON sms_pool_contributions(fisherman_id);
CREATE INDEX idx_contributions_month ON sms_pool_contributions(contribution_month);
CREATE INDEX idx_contributions_contributor ON sms_pool_contributions(contributor_user_id);

-- RLS
ALTER TABLE sms_pool_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view their contributions"
  ON sms_pool_contributions FOR SELECT
  USING (fisherman_id IN (
    SELECT id FROM fishermen WHERE user_id = auth.uid()
  ));

CREATE POLICY "Contributors can view their own"
  ON sms_pool_contributions FOR SELECT
  USING (contributor_user_id = auth.uid());

CREATE POLICY "Admins can view all"
  ON sms_pool_contributions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

### 5.5 Table `notification_preferences`

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_frequency TEXT DEFAULT 'instant', -- 'instant', 'daily', 'weekly'
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());
```

---

## 6. Edge Functions Requises

### 6.1 `distribute-sms-pool` (CRON mensuel)

```typescript
// Exécuté le 1er de chaque mois
// 1. Récupère tous les paiements Premium+ actifs
// 2. Pour chaque paiement, calcule la contribution (15€/12 = 1.25€)
// 3. Répartit entre les pêcheurs suivis par le client
// 4. Crédite les cagnottes et enregistre les contributions
```

### 6.2 `check-client-subscription`

```typescript
// Vérifie le niveau d'abonnement client
// Retourne : { level: 'follower' | 'premium' | 'premium_plus', ... }
```

### 6.3 `send-notification` (Modification)

```typescript
// Logique de routage par niveau :
// 1. Vérifier le niveau d'abonnement du destinataire
// 2. Appliquer les canaux autorisés
// 3. Envoyer via les canaux appropriés
```

---

## 7. Intégration Stripe

### 7.1 Produits à Créer

| Produit | Type | Prix | Stripe Product ID |
|---------|------|------|-------------------|
| Client Premium Annuel | Subscription | 25€/an | `prod_CLIENT_PREMIUM` |
| Client Premium+ Annuel | Subscription | 40€/an | `prod_CLIENT_PREMIUM_PLUS` |
| Client Premium Mensuel | Subscription | 2.50€/mois | `prod_CLIENT_PREMIUM_MONTHLY` |
| Client Premium+ Mensuel | Subscription | 4€/mois | `prod_CLIENT_PREMIUM_PLUS_MONTHLY` |

### 7.2 Webhook Events

Ajouter au `stripe-webhook` :
- `customer.subscription.created` → Mettre à jour `subscription_level`
- `customer.subscription.updated` → Mettre à jour `subscription_level`
- `customer.subscription.deleted` → Rétrograder vers `follower`

---

## 8. UI/UX Recommandations

### 8.1 Page Abonnement Client

```
┌─────────────────────────────────────────────────────────────┐
│              SOUTENEZ VOS PÊCHEURS PRÉFÉRÉS                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  FOLLOWER   │  │   PREMIUM   │  │  PREMIUM+   │         │
│  │   Gratuit   │  │   25€/an    │  │   40€/an    │         │
│  │             │  │             │  │             │         │
│  │ ✓ Arrivages │  │ ✓ Tout      │  │ ✓ Tout      │         │
│  │ ✓ Favoris   │  │   Follower  │  │   Premium   │         │
│  │             │  │ ✓ Push      │  │ ✓ SMS       │         │
│  │             │  │ ✓ Email     │  │ ✓ Cagnotte  │         │
│  │             │  │ ✓ Accès     │  │             │         │
│  │             │  │   anticipé  │  │             │         │
│  │             │  │             │  │             │         │
│  │  [Actuel]   │  │ [Choisir]   │  │ [Choisir]   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Badge Premium

```tsx
// Composant à créer : ClientPremiumBadge.tsx
<Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
  {level === 'premium_plus' ? '⭐ Premium+' : '✨ Premium'}
</Badge>
```

---

## 9. Migration Existants

### 9.1 Clients Premium Actuels

Les clients ayant déjà souscrit à "Premium" (ancien modèle 25€/an) :
1. Migrer vers `subscription_level = 'premium'`
2. Conserver leurs avantages actuels
3. Proposer upgrade vers Premium+ (différence proratisée)

### 9.2 Script de Migration

```sql
-- Migrer les abonnements premium existants
UPDATE payments 
SET subscription_level = 'premium'
WHERE plan = 'premium' 
  AND status = 'active'
  AND subscription_level IS NULL;
```

---

## 10. Métriques à Suivre

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Conversion Follower → Premium | % upgrade | > 15% |
| Conversion Premium → Premium+ | % upgrade | > 30% |
| Churn Premium | % désabonnement/mois | < 5% |
| Cagnotte moyenne/pêcheur | €/mois | > 20€ |
| SMS envoyés/cagnotte | Ratio utilisation | > 70% |

---

## 11. Checklist Implémentation

- [ ] Créer enum `client_subscription_level`
- [ ] Modifier table `payments`
- [ ] Créer table `sms_pool`
- [ ] Créer table `sms_pool_contributions`
- [ ] Créer table `notification_preferences`
- [ ] Créer produits Stripe
- [ ] Modifier `stripe-webhook` pour gérer niveaux
- [ ] Créer Edge Function `check-client-subscription`
- [ ] Créer Edge Function `distribute-sms-pool`
- [ ] Modifier `send-drop-notification` pour routage par niveau
- [ ] Créer composant `ClientPremiumBadge`
- [ ] Créer page `/premium/upgrade`
- [ ] Ajouter UI préférences notifications
- [ ] Script migration existants
