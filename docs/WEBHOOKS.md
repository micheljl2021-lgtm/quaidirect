# QuaiDirect - Documentation Webhooks

## Vue d'ensemble

Ce document décrit tous les webhooks et fonctions de notification utilisés dans QuaiDirect.

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
- Bienvenue + période d'essai 30 jours
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

- **2025-12-06:** 
  - Correction logique plan (fisherman_basic/fisherman_pro au lieu de fisherman_annual)
  - Unification appels via `supabase.functions.invoke()` 
  - Ajout fallback sale_points dans send-basket-order-notification
  - Harmonisation CORS headers
