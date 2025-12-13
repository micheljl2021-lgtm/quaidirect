# Audit Stripe - QuaiDirect

**Date** : 1er Décembre 2024  
**Version** : 1.0

---

## 💳 Vue d'Ensemble Stripe

QuaiDirect utilise **Stripe** comme processeur de paiement unique pour :
1. **Abonnements Pêcheurs** : Basic (99€/an) et Pro (199€/an)
2. **Abonnements Clients Premium** : 25€/an ou 2,50€/mois
3. **Paniers Clients** : Paiements one-time (25€ / 45€ / 75€) avec commission 8%
4. **Packs SMS** : Paiements one-time optionnels (49€ / 149€ / 299€)

---

## 🔑 Produits Stripe Configurés

### Abonnements Pêcheurs

| Produit | Price ID | Montant | Type | Description |
|---------|----------|---------|------|-------------|
| Basic | `price_1SYfUYH0VhS1yyE0d3c5GQLA` | 99€ | Annuel | Emails illimités, WhatsApp, IA textes |
| Pro | `price_1SYgOuH0VhS1yyE0XINPVQdm` | 199€ | Annuel | Basic + IA avancée, multi-points, stats |

### Abonnements Clients Premium

| Produit | Price ID | Montant | Type | Description |
|---------|----------|---------|------|-------------|
| Premium Mensuel | `price_1SZ489H0VhS1yyE0Nc9KZhy1` | 2,50€ | Mensuel | Support pêcheurs, alertes espèces |
| Premium Annuel | `price_1SZ48UH0VhS1yyE0iYmXen3H` | 25€ | Annuel | Support pêcheurs, alertes espèces |
| Premium+ Mensuel | `price_1SZ48yH0VhS1yyE0bijfw3y7` | 4€ | Mensuel | Premium + fonctionnalités avancées |
| Premium+ Annuel | `price_1SZ49DH0VhS1yyE06HJyLC65` | 40€ | Annuel | Premium + fonctionnalités avancées |

### Paniers Clients (One-time)

| Produit | Price ID | Montant | Type | Description |
|---------|----------|---------|------|-------------|
| Panier Découverte | `price_1SYEYvH0VhS1yyE0l4DkD2PG` | 25€ | One-time | ~1.5kg, 2-3 espèces |
| Panier Famille | `price_1SYEZ9H0VhS1yyE0OFQzbTZG` | 45€ | One-time | ~3kg, 4-5 espèces |
| Panier Gourmet | `price_1SYEZJH0VhS1yyE04442C45I` | 75€ | One-time | ~4kg, espèces premium |

**Note** : Commission plateforme de **8%** ajoutée au montant du panier côté client. Exemple : Panier 40€ → Client paie 43,20€ (40€ + 3,20€ commission) → Pêcheur reçoit 40€.

---

## 🔐 Secrets Stripe Gérés

| Secret | Localisation | Exposition | Usage |
|--------|--------------|------------|-------|
| `STRIPE_SECRET_KEY` | Supabase Secrets | ❌ Backend seul | Edge Functions, webhooks |
| `STRIPE_WEBHOOK_SECRET` | Supabase Secrets | ❌ Backend seul | Vérification signatures webhook |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | .env (auto-généré) | ⚠️ Frontend | Client Supabase (non lié Stripe) |

**Statut Sécurité** : ✅ Aucune clé Stripe exposée côté frontend. Toutes les opérations Stripe passent par Edge Functions sécurisées.

---

## 📡 Edge Functions Stripe (6 Endpoints)

### 1. `create-fisherman-payment`

**Route** : `/functions/v1/create-fisherman-payment`  
**Méthode** : POST  
**Auth** : ✅ `verify_jwt = true`  
**CORS** : ✅ Restreint à `quaidirect.fr`

**Payload** :
```json
{
  "priceId": "price_1SYfUYH0VhS1yyE0d3c5GQLA",
  "plan": "basic"
}
```

**Fonction** : Crée une session Stripe Checkout pour abonnement pêcheur (Basic/Pro).

**Flux** :
1. Récupère `user_id` authentifié
2. Crée/récupère Stripe Customer
3. Crée Checkout Session avec `mode: 'subscription'`
4. Stocke `plan` en metadata
5. Retourne `sessionId` pour redirection frontend

**Success URL** : `https://quaidirect.fr/pecheur/payment-success?session_id={CHECKOUT_SESSION_ID}`  
**Cancel URL** : `https://quaidirect.fr/pecheur/payment`

---

### 2. `create-checkout`

**Route** : `/functions/v1/create-checkout`  
**Méthode** : POST  
**Auth** : ✅ `verify_jwt = true`  
**CORS** : ✅ Restreint à `quaidirect.fr`

**Payload** :
```json
{
  "priceId": "price_1SZ48UH0VhS1yyE0iYmXen3H"
}
```

**Fonction** : Crée une session Stripe Checkout pour abonnement client premium.

**Flux** :
1. Récupère `user_id` authentifié
2. Crée/récupère Stripe Customer avec `user.email`
3. Crée Checkout Session avec `mode: 'subscription'`
4. Stocke `user_id` en metadata
5. Retourne `sessionId`

**Success URL** : `https://quaidirect.fr/premium/success?session_id={CHECKOUT_SESSION_ID}`  
**Cancel URL** : `https://quaidirect.fr/premium/paywall`

---

### 3. `create-basket-checkout`

**Route** : `/functions/v1/create-basket-checkout`  
**Méthode** : POST  
**Auth** : ✅ `verify_jwt = true`  
**CORS** : ✅ Restreint à `quaidirect.fr`

**Payload** :
```json
{
  "priceId": "price_1SYEZ9H0VhS1yyE0OFQzbTZG",
  "fishermanId": "uuid-pecheur",
  "dropId": "uuid-arrivage",
  "pickupLocation": "Port de Hyères",
  "pickupTime": "2024-12-02T08:00:00Z",
  "notes": "Sans têtes SVP"
}
```

**Fonction** : Crée une session Stripe Checkout pour achat panier avec **commission 8%**.

**Flux** :
1. Récupère `user_id` authentifié
2. Récupère prix panier depuis Stripe API
3. **Calcule commission 8%** : `commission = basketPrice * 0.08`
4. **Calcule prix total** : `totalPrice = basketPrice + commission`
5. Crée Checkout Session avec `price_data` incluant commission
6. Stocke en metadata : `basket_price_cents`, `commission_cents`, `total_price_cents`, `fisherman_id`, `drop_id`
7. Retourne `sessionId`

**Success URL** : `https://quaidirect.fr/panier/success?session_id={CHECKOUT_SESSION_ID}`  
**Cancel URL** : `https://quaidirect.fr/panier`

**Exemple Calcul Commission** :
```
Panier Famille = 45€ (4500 centimes)
Commission 8% = 3,60€ (360 centimes)
Prix Total Client = 48,60€ (4860 centimes)
→ Pêcheur reçoit 45€
→ Plateforme retient 3,60€
```

---

### 4. `purchase-sms-pack`

**Route** : `/functions/v1/purchase-sms-pack`  
**Méthode** : POST  
**Auth** : ✅ `verify_jwt = true`  
**CORS** : ✅ Restreint à `quaidirect.fr`

**Payload** :
```json
{
  "packType": "pack_500"
}
```

**Fonction** : Crée une session Stripe Checkout pour achat pack SMS (optionnel).

**Packs disponibles** :
- `pack_500` : 500 SMS → 49€
- `pack_2000` : 2000 SMS → 149€
- `pack_5000` : 5000 SMS → 299€

**Flux** :
1. Récupère `user_id` et `fisherman_id` associé
2. Mappe `packType` à quantité SMS et prix
3. Crée produit Stripe dynamique avec `price_data`
4. Crée Checkout Session avec `mode: 'payment'`
5. Stocke en metadata : `fisherman_id`, `pack_type`, `sms_quantity`
6. Retourne `sessionId`

**Success URL** : `https://quaidirect.fr/dashboard/pecheur?sms_pack_success=true`  
**Cancel URL** : `https://quaidirect.fr/dashboard/pecheur`

---

### 5. `stripe-webhook`

**Route** : `/functions/v1/stripe-webhook`  
**Méthode** : POST  
**Auth** : ❌ `verify_jwt = false` (webhook Stripe)  
**CORS** : ✅ Restreint à `quaidirect.fr`  
**Protection** : ✅ Vérification signature `STRIPE_WEBHOOK_SECRET`

**Événements Gérés** :

#### A. `checkout.session.completed`

**Actions selon type de paiement** :

1. **Abonnement Pêcheur** (`mode: 'subscription'` + metadata `plan`)
   - Crée/update entrée `payments` table
   - Assigne rôle `fisherman` dans `user_roles`
   - Crée profil `fishermen` avec `onboarding_payment_status = 'paid'`
   - Appelle `approve-fisherman-access` Edge Function

2. **Abonnement Premium Client** (`mode: 'subscription'` + metadata `user_id`)
   - Crée/update entrée `payments` table
   - Assigne rôle `premium` dans `user_roles`
   - ✅ **Appelle `send-premium-welcome-email`** avec `x-internal-secret` header

3. **Panier Client** (metadata `basket_id` ou `priceId` de panier)
   - Crée entrée `basket_orders` avec `status = 'paid'`
   - Stocke `fisherman_id`, `drop_id`, `total_price_cents`, `pickup_location`, `pickup_time`, `notes`
   - ✅ **Appelle `send-basket-order-notification`** avec `x-internal-secret` header pour notifier pêcheur

4. **Pack SMS** (metadata `pack_type`)
   - Crée entrée `fishermen_sms_packs`
   - Update `fishermen_sms_usage` : incrémente `paid_sms_balance`

#### B. `customer.subscription.updated`
   - Update champs `payments` : `current_period_start`, `current_period_end`, `status`, `cancel_at`

#### C. `customer.subscription.deleted`
   - Update `payments` : `status = 'canceled'`, `canceled_at = now()`
   - Remove rôle `premium` ou `fisherman` de `user_roles` si applicable

**Sécurité** : ✅ Vérification obligatoire signature webhook via `stripe.webhooks.constructEvent()` avant traitement.

---

### 6. `customer-portal`

**Route** : `/functions/v1/customer-portal`  
**Méthode** : POST  
**Auth** : ✅ `verify_jwt = true`  
**CORS** : ✅ Restreint à `quaidirect.fr`

**Fonction** : Génère un lien vers le Stripe Customer Portal pour gestion abonnement (annulation, changement carte, factures).

**Flux** :
1. Récupère `user_id` authentifié
2. Cherche `stripe_customer_id` dans `payments` table
3. Crée session Stripe Billing Portal
4. Retourne `url` de redirection

**Return URL** : `https://quaidirect.fr/compte` (après gestion abonnement)

---

## 🔄 Diagramme des Flux de Paiement

### Flux Abonnement Pêcheur

```
Frontend (/pecheur/payment)
  → Clic "Payer Basic 99€"
  → POST /create-fisherman-payment { priceId: "price_...", plan: "basic" }
  → Stripe Checkout Modal (redirection)
  → Paiement Client
  → Stripe envoie webhook "checkout.session.completed"
  → stripe-webhook traite événement
      → Crée payments (plan: "basic", status: "active")
      → Assigne role "fisherman" dans user_roles
      → Crée profil fishermen (onboarding_payment_status: "paid")
      → Appelle approve-fisherman-access (envoie email validation admin)
  → Redirection /pecheur/payment-success
  → Redirection /pecheur/onboarding (formulaire 6 étapes)
```

### Flux Abonnement Premium Client

```
Frontend (/premium/paywall)
  → Clic "S'abonner 25€/an"
  → POST /create-checkout { priceId: "price_..." }
  → Stripe Checkout Modal
  → Paiement Client
  → Stripe envoie webhook "checkout.session.completed"
  → stripe-webhook traite événement
      → Crée payments (plan: "premium_annual", status: "active")
      → Assigne role "premium" dans user_roles
      → Appelle send-premium-welcome-email (avec x-internal-secret)
          → Envoie email bienvenue avec lien /premium/reglages
  → Redirection /premium/success
  → Lien vers /premium/reglages (configuration ports favoris, espèces)
```

### Flux Achat Panier (avec Commission 8%)

```
Frontend (/panier)
  → Sélection Panier Famille 45€
  → POST /create-basket-checkout {
      priceId: "price_...",
      fishermanId: "uuid-pecheur",
      dropId: "uuid-arrivage",
      pickupLocation: "Port de Hyères",
      pickupTime: "2024-12-02T08:00:00Z"
  }
  → Edge Function calcule :
      basketPrice = 45€ (4500 centimes)
      commission = 45€ × 0.08 = 3,60€ (360 centimes)
      totalPrice = 48,60€ (4860 centimes)
  → Crée Checkout Session avec totalPrice
  → Stripe Checkout Modal (client voit 48,60€)
  → Paiement Client
  → Stripe envoie webhook "checkout.session.completed"
  → stripe-webhook traite événement
      → Crée basket_orders (status: "paid", total_price_cents: 4860)
      → Appelle send-basket-order-notification (avec x-internal-secret)
          → Envoie email au pêcheur avec détails commande
  → Redirection /panier/success
  → Client reçoit confirmation avec lieu/heure retrait
```

---

## 🛡️ Sécurité Stripe

### ✅ Points Forts

1. **Clés Sécurisées** : `STRIPE_SECRET_KEY` stockée dans Supabase Secrets, jamais exposée frontend
2. **Signature Webhook** : Vérification obligatoire via `STRIPE_WEBHOOK_SECRET` avant traitement événements
3. **Auth Edge Functions** : `verify_jwt = true` sur toutes les fonctions création checkout (sauf webhook)
4. **CORS Restreints** : Toutes Edge Functions limitées à `https://quaidirect.fr`
5. **Metadata Traçable** : Chaque session contient `user_id`, `fisherman_id`, `drop_id`, `basket_id` pour audit
6. **Commission Transparente** : Metadata contient `basket_price_cents` et `commission_cents` séparément
7. **Protection Webhook Interne** : ✅ `send-premium-welcome-email` et `send-basket-order-notification` protégées par `INTERNAL_FUNCTION_SECRET`

### ⚠️ Points d'Attention

1. **Test Mode vs Live Mode** : Vérifier que production utilise bien Live Keys Stripe
2. **Webhooks Endpoint** : Configurer dans Stripe Dashboard → `https://topqlhxdflykejrlbuqx.supabase.co/functions/v1/stripe-webhook`
3. **Événements Webhook** : Activer uniquement événements nécessaires dans Stripe Dashboard :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Rate Limiting** : Implémenter rate limiting sur Edge Functions publiques si nécessaire
5. **Logs** : Activer logs Stripe Dashboard pour audit transactions et webhooks

---

## 📊 Statistiques Stripe

- **Produits Configurés** : 10 produits (2 pêcheurs, 4 premium, 3 paniers, 3 SMS packs dynamiques)
- **Edge Functions** : 6 endpoints Stripe
- **Webhooks Gérés** : 3 types d'événements
- **Tables Impactées** : 5 tables (payments, basket_orders, fishermen, fishermen_sms_packs, user_roles)
- **Commission Plateforme** : 8% sur paniers uniquement (pas sur abonnements)

---

## 💰 Modèle de Revenus Stripe

### Revenus par Pêcheur (Estimation Annuelle)

| Source | Montant/an | % du Total |
|--------|------------|------------|
| Abonnement Pêcheur (moy. 70% Basic 30% Pro) | 129€ | 12% |
| Packs SMS optionnels | 100€ | 9% |
| Clients Premium suivant pêcheur (15% × 25€) | 550€ | 50% |
| Commission paniers (8% × 4000€ ventes) | 320€ | 29% |
| **TOTAL** | **1,099€** | **100%** |

### Projection Croissance 5 Ans

| Année | Pêcheurs | CA Total | CA Cumulé |
|-------|----------|----------|-----------|
| Année 1 | 5 | 5,500€ | 5,500€ |
| Année 2 | 10 | 11,000€ | 16,500€ |
| Année 3 | 20 | 22,000€ | 38,500€ |
| Année 4 | 40 | 44,000€ | 82,500€ |
| Année 5 | 80 | 88,000€ | 170,500€ |

**Stratégie** : Croissance dépend plus de l'engagement clients premium et volume paniers que du nombre de pêcheurs, grâce au modèle de commission scalable.

---

**Prochaine Section** : [Inventaire API Keys](./03_inventaire_api_keys.md)
