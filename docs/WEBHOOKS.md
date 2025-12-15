# QuaiDirect - Documentation Webhooks

## Vue d'ensemble

Ce document décrit tous les webhooks et fonctions de notification utilisés dans QuaiDirect.

## Catégories de fonctions Edge

### Fonctions Frontend (CORS `*`)

Ces fonctions sont appelées directement depuis le navigateur et nécessitent un CORS permissif pour fonctionner avec les previews Lovable :

| Fonction | Description |
|----------|-------------|
| `create-checkout` | Création session Stripe checkout |
| `create-basket-checkout` | Checkout panier client |
| `customer-portal` | Accès portail Stripe |
| `check-subscription` | Vérification abonnement |
| `marine-ai-assistant` | Assistant IA pêcheur |
| `send-fisherman-message` | Envoi messages groupés |
| `generate-fisherman-description` | Génération description IA |
| `generate-fisherman-seo-content` | Contenu SEO pêcheur |
| `get-public-sale-points` | Points de vente publics |

### Fonctions Webhook/Internes (CORS restrictif)

Ces fonctions sont appelées par Stripe, des triggers DB, ou d'autres fonctions :

| Fonction | Appelé par |
|----------|------------|
| `stripe-webhook` | Stripe (événements) |
| `send-drop-notification` | Trigger DB (nouveau drop) |
| `send-reservation-notification` | stripe-webhook |
| `send-fisherman-welcome-email` | stripe-webhook |
| `send-basket-order-notification` | stripe-webhook |
| `send-basket-customer-email` | stripe-webhook |
| `send-payment-confirmation-email` | stripe-webhook |
| `send-trial-ending-reminder` | stripe-webhook |
| `approve-fisherman-access` | Admin dashboard |

## Stripe Webhook Principal

**Fichier:** `supabase/functions/stripe-webhook/index.ts`

**URL:** `https://topqlhxdflykejrlbuqx.supabase.co/functions/v1/stripe-webhook`

### Events Stripe gérés

| Event | Description | Actions |
|-------|-------------|---------|
| `checkout.session.completed` | Paiement réussi | Création commande, rôles, emails |
| `invoice.paid` | Facture payée | Update status, email confirmation |
| `invoice.payment_failed` | Échec paiement | Update status → past_due |
| `customer.subscription.created` | Nouvel abonnement | (géré via checkout) |
| `customer.subscription.updated` | Modification abonnement | Update période, cancel_at |
| `customer.subscription.deleted` | Annulation abonnement | Remove rôle, update status |
| `customer.subscription.trial_will_end` | Fin essai dans 3 jours | Email rappel |

### Flow checkout.session.completed

```
┌─────────────────────────────────────────────────────────────────┐
│                    checkout.session.completed                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────┴───────────────┐
              │      metadata.payment_type     │
              └───────────────┬───────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
   sms_pack          basket_id exists        fisherman_onboarding
       │                      │                      │
       ▼                      ▼                      ▼
 ┌───────────┐         ┌───────────┐         ┌───────────────────┐
 │ Insert    │         │ Insert    │         │ Upsert fishermen  │
 │ sms_packs │         │ basket_   │         │ Insert payments   │
 │ Update    │         │ orders    │         │ Insert user_roles │
 │ sms_usage │         └─────┬─────┘         └─────────┬─────────┘
 └───────────┘               │                         │
                             ▼                         ▼
                    ┌────────────────┐        ┌────────────────────┐
                    │ send-basket-   │        │ send-fisherman-    │
                    │ order-notif    │        │ welcome-email      │
                    │ send-basket-   │        └────────────────────┘
                    │ customer-email │
                    │ send-reserv-   │
                    │ ation-notif    │
                    └────────────────┘
```

## Fonctions Email

### 1. send-fisherman-welcome-email

**Déclencheur:** `checkout.session.completed` (fisherman_onboarding)

**Payload:**
```typescript
{
  userEmail: string;
  boatName?: string;
  plan: 'basic' | 'pro';
}
```

**Contenu:**
- Bienvenue + période d'essai 7 jours
- Avantages du plan (différenciés Basic/Pro)
- Prochaines étapes
- Lien dashboard

### 2. send-payment-confirmation-email

**Déclencheur:** `invoice.paid`

**Payload:**
```typescript
{
  userEmail: string;
  boatName?: string;
  plan: 'basic' | 'pro';
  amountPaid: number;          // en centimes
  invoiceUrl?: string;
  nextBillingDate: string;     // ISO date
}
```

**Contenu:**
- Confirmation montant payé
- Détails abonnement
- Lien facture
- Prochaine facturation

### 3. send-trial-ending-reminder

**Déclencheur:** `customer.subscription.trial_will_end`

**Payload:**
```typescript
{
  userEmail: string;
  boatName?: string;
  plan: 'basic' | 'pro';
  trialEndDate: string;        // ISO date
  customerPortalUrl: string;
}
```

**Contenu:**
- Rappel fin essai
- Options (continuer/annuler)
- Liens portail Stripe

### 4. send-basket-order-notification

**Déclencheur:** `checkout.session.completed` (basket order)

**Payload:**
```typescript
{
  orderId: string;  // UUID de basket_orders
}
```

**Contenu:**
- Nouvelle commande panier
- Détails client
- Lieu et heure retrait
- Lien dashboard

### 5. send-basket-customer-email

**Déclencheur:** `checkout.session.completed` (basket order)

**Payload:**
```typescript
{
  orderId: string;  // UUID de basket_orders
}
```

**Contenu:**
- Confirmation commande
- Détails panier
- Informations retrait
- Contact pêcheur

### 6. send-premium-welcome-email

**Déclencheur:** `checkout.session.completed` (premium client)

**Payload:**
```typescript
{
  userEmail: string;
  userName?: string;
  plan: string;
}
```

### 7. send-reservation-notification

**Déclencheur:** `stripe-webhook` après basket order (via `checkout.session.completed`)

**Payload:**
```typescript
{
  fishermanUserId: string;  // UUID du user pêcheur
  orderId: string;          // UUID de basket_orders
  basketId: string;         // UUID du panier
}
```

**Actions:**
1. Récupère les détails de la commande (`basket_orders` avec joins)
2. Crée une notification en base pour le pêcheur (`notifications` table)
3. Récupère les push subscriptions du pêcheur
4. **Envoie un email au pêcheur** via Resend

**Email envoyé:**
- **Expéditeur:** `QuaiDirect <support@quaidirect.fr>`
- **Destinataire:** Email du pêcheur (via `auth.admin.getUserById`)
- **Sujet:** `🎣 Nouvelle réservation : {basketName}`
- **Contenu:**
  - Nom du client (échappé XSS)
  - Nom du panier réservé
  - Prix total formaté (€)
  - Bouton CTA vers `/dashboard/pecheur`

**Sécurité:**
- Protection XSS via `escapeHtml()` sur les données client
- Authentification via `x-internal-secret`
- Gestion gracieuse des erreurs email (continue si échec)

### 8. send-drop-notification

**Déclencheur:** Trigger DB sur insertion dans `drops`

**Payload:**
```typescript
{
  dropId: string;  // UUID du drop
}
```

**Actions:**
1. Récupère les détails du drop avec pêcheur et espèces
2. Récupère la localisation (port OU sale_point avec fallback)
3. Notifie les followers du pêcheur par email

**Localisation (ordre de priorité):**
1. `drops.sale_point_id` → `fisherman_sale_points.label`
2. `drops.port_id` → `ports.name`
3. Fallback: "Point de vente"

## Secrets Requis

| Secret | Utilisé par |
|--------|-------------|
| `STRIPE_SECRET_KEY` | stripe-webhook |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook |
| `INTERNAL_FUNCTION_SECRET` | Toutes fonctions email |
| `RESEND_API_KEY` | Toutes fonctions email |
| `SUPABASE_SERVICE_ROLE_KEY` | stripe-webhook, notifications |

## Configuration Stripe Dashboard

### URL Webhook
```
https://topqlhxdflykejrlbuqx.supabase.co/functions/v1/stripe-webhook
```

### Events à activer
- ✅ `checkout.session.completed`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`

### Secret Webhook
Après création du webhook, copier le **Signing secret** et le mettre à jour dans les secrets Lovable Cloud sous `STRIPE_WEBHOOK_SECRET`.

## Sécurité

### Authentification inter-fonctions

Toutes les fonctions email sont protégées par `INTERNAL_FUNCTION_SECRET`:

```typescript
const internalSecret = req.headers.get('x-internal-secret');
const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');

if (!expectedSecret || internalSecret !== expectedSecret) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
}
```

### Appels entre fonctions

Utiliser `supabase.functions.invoke()` (recommandé):

```typescript
await supabaseClient.functions.invoke('send-fisherman-welcome-email', {
  body: { userEmail, boatName, plan },
  headers: { 'x-internal-secret': internalSecret }
});
```

### Règles CORS

| Type de fonction | CORS Origin | Raison |
|------------------|-------------|--------|
| Frontend | `*` | Permet appels depuis preview Lovable |
| Webhook/Interne | `https://quaidirect.fr` | Sécurité production |

**Note:** En production, les fonctions frontend peuvent être restreintes à `https://quaidirect.fr` et `https://*.lovable.app` pour une sécurité accrue.

**Fonctions avec CORS `*` (harmonisé 2025-12-06):**
- `create-checkout`
- `create-basket-checkout`
- `customer-portal`
- `check-subscription`
- `marine-ai-assistant`
- `send-fisherman-message`

## Plans et Rôles

### Mapping plan → rôle

| Plan | Rôle user_roles |
|------|-----------------|
| `fisherman_basic` | `fisherman` |
| `fisherman_pro` | `fisherman` |
| `premium` | `premium` |
| `premium_monthly` | `premium` |
| `premium_annual` | `premium` |

### Détection type de plan

```typescript
// Pour distinguer fisherman vs premium
const isFishermanPlan = paymentData.plan?.startsWith('fisherman_');
const roleToRemove = isFishermanPlan ? 'fisherman' : 'premium';
```

## Debugging

### Logs Edge Functions

```bash
# Via Lovable Cloud
# Accéder aux logs depuis l'interface

# Rechercher les erreurs
[STRIPE-WEBHOOK] ERROR ...
[SEND-BASKET-ORDER-NOTIFICATION] ERROR ...
```

### Vérifier un webhook

1. Aller dans Stripe Dashboard → Developers → Webhooks
2. Cliquer sur l'endpoint
3. Voir les tentatives récentes
4. Vérifier response code et body

### Replay un event

Depuis Stripe Dashboard, cliquer "Resend" sur un event pour le rejouer.

## Changelog

- **2025-12-06 (Session CORS + Notifications):**
  - Harmonisation CORS `*` pour 6 fonctions frontend (create-checkout, customer-portal, etc.)
  - `send-drop-notification`: ajout support `fisherman_sale_points` avec fallback location intelligent
  - `send-reservation-notification`: ajout envoi email au pêcheur via Resend + protection XSS
  - Documentation mise à jour: catégories fonctions, règles CORS, section send-reservation-notification

- **2025-12-06:** 
  - Correction logique plan (fisherman_basic/fisherman_pro au lieu de fisherman_annual)
  - Unification appels via `supabase.functions.invoke()` 
  - Ajout fallback sale_points dans send-basket-order-notification
  - Harmonisation CORS headers
