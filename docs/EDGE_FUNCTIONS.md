# Edge Functions QuaiDirect

## Vue d'ensemble

QuaiDirect utilise 28 Edge Functions Deno déployées via Lovable Cloud.

## Configuration

Toutes les fonctions sont configurées dans `supabase/config.toml` avec :
- CORS restreint à `quaidirect.fr`
- JWT verification selon le cas d'usage

## Catégories de Fonctions

### 🔒 Authentification & Accès

| Fonction | Auth | Description |
|----------|------|-------------|
| `approve-fisherman-access` | Admin | Valide un compte pêcheur en attente |
| `validate-secure-token` | Public | Valide un token de modification sécurisé |
| `check-subscription` | Auth | Vérifie le statut d'abonnement d'un utilisateur |

### 💳 Paiements Stripe

| Fonction | Auth | Description |
|----------|------|-------------|
| `create-checkout` | Auth | Crée une session Stripe Checkout (abonnements) |
| `create-basket-checkout` | Auth | Crée un checkout pour achat de panier |
| `create-fisherman-payment` | Auth | Initie le paiement pêcheur (150€/199€) |
| `stripe-webhook` | Public* | Traite les webhooks Stripe |
| `customer-portal` | Auth | Génère un lien vers le portail client Stripe |

> *Protégé par `STRIPE_WEBHOOK_SECRET`

### 📧 Notifications Email (Resend)

| Fonction | Auth | Description |
|----------|------|-------------|
| `send-user-welcome-email` | Internal | Email de bienvenue nouvel utilisateur |
| `send-fisherman-welcome-email` | Internal | Email bienvenue pêcheur après paiement |
| `send-fisherman-approved-email` | Internal | Email validation compte pêcheur |
| `send-payment-confirmation-email` | Internal | Confirmation paiement récurrent |
| `send-trial-ending-reminder` | Internal | Rappel fin période d'essai (J-3) |
| `send-premium-welcome-email` | Internal | Email bienvenue client premium |
| `send-drop-notification` | Internal | Notification nouvel arrivage |
| `send-reservation-notification` | Internal | Confirmation réservation |
| `send-basket-order-notification` | Internal | Confirmation commande panier |
| `send-fisherman-message` | Auth | Envoi message groupé aux contacts |
| `send-support-response` | Admin | Réponse admin à demande support |
| `send-billing-portal-link` | Auth | Envoi lien portail facturation |

### 🤖 Intelligence Artificielle

| Fonction | Auth | Description |
|----------|------|-------------|
| `marine-ai-assistant` | Auth | Assistant IA pour pêcheurs (Lovable AI) |
| `generate-fisherman-description` | Auth | Génère description marketing pêcheur |
| `generate-fisherman-seo-content` | Admin | Génère contenu SEO enrichi |
| `generate-fisherman-site-prompt` | Admin | Génère prompt pour site externe |

### 🔧 Utilitaires

| Fonction | Auth | Description |
|----------|------|-------------|
| `geocode-address` | Auth | Géocode une adresse (Google) |
| `google-geocode-port` | Public | Géocode un port |
| `get-company-info` | Auth | Récupère infos SIRET (API entreprise) |
| `get-public-sale-points` | Public | Liste points de vente publics |
| `generate-secure-edit-link` | Admin | Génère lien modification sécurisé |
| `submit-secure-profile-edit` | Public* | Soumet modification via token |
| `check-sms-quota` | Auth | Vérifie quota SMS pêcheur |
| `purchase-sms-pack` | Auth | Achat pack SMS |
| `process-caisse` | Auth | Traitement ventes caisse |

> *Protégé par token temporaire

---

## Détails des Fonctions Critiques

### `stripe-webhook`

Traite tous les événements Stripe pour synchroniser la base de données.

**Événements supportés :**
- `checkout.session.completed` → Crée payment, assigne rôle
- `invoice.paid` → Met à jour période, envoie confirmation
- `customer.subscription.trial_will_end` → Envoie rappel
- `customer.subscription.updated` → Met à jour statut
- `customer.subscription.deleted` → Annule abonnement

**Headers requis :**
```
stripe-signature: {signature}
```

**Protection :** `STRIPE_WEBHOOK_SECRET`

---

### `create-checkout`

Crée une session Stripe Checkout avec période d'essai.

**Input :**
```typescript
{
  priceId: string;      // ID prix Stripe
  successUrl?: string;  // URL retour succès
  cancelUrl?: string;   // URL retour annulation
}
```

**Output :**
```typescript
{
  sessionId: string;
  url: string;
}
```

**Exemple d'appel :**
```typescript
const { data } = await supabase.functions.invoke('create-checkout', {
  body: {
    priceId: 'price_BASIC_150_YEAR',
    successUrl: `${window.location.origin}/pecheur/payment/success`
  }
});
window.location.href = data.url;
```

---

### `marine-ai-assistant`

Assistant IA conversationnel pour pêcheurs utilisant Lovable AI Gateway.

**Input :**
```typescript
{
  message: string;
  conversationId?: string;
  category?: 'weather' | 'fuel' | 'strategy' | 'admin' | 'arrivals' | 'finance';
}
```

**Output (streaming) :**
```typescript
{
  response: string;
  conversationId: string;
}
```

**Modèle utilisé :** `google/gemini-2.5-flash`

---

### `send-fisherman-message`

Envoie un email groupé aux contacts du pêcheur.

**Input :**
```typescript
{
  fishermanId: string;
  subject: string;
  body: string;
  templateType: 'invitation' | 'drop_announcement' | 'custom';
  contactGroup?: string;
  contactIds?: string[];  // Si envoi sélectif
  dropId?: string;        // Pour template drop_announcement
}
```

**Output :**
```typescript
{
  success: boolean;
  sentCount: number;
  messageId: string;
}
```

---

### `generate-fisherman-seo-content`

Génère contenu SEO complet pour profil pêcheur.

**Input :**
```typescript
{
  fishermanId: string;
}
```

**Output :**
```typescript
{
  seo_title: string;
  seo_meta_description: string;
  seo_keywords: string[];
  seo_long_content: string;
  seo_how_to_order: { step: number; title: string; description: string }[];
  seo_hours_location: string;
}
```

---

## Secrets Requis

| Secret | Utilisé par | Description |
|--------|-------------|-------------|
| `STRIPE_SECRET_KEY` | Fonctions Stripe | Clé API Stripe |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook | Signature webhook |
| `RESEND_API_KEY` | Fonctions email | API Resend |
| `GOOGLE_MAPS_API_KEY` | geocode-address | API Google Maps |
| `LOVABLE_API_KEY` | marine-ai-assistant | Lovable AI Gateway |
| `INTERNAL_FUNCTION_SECRET` | Webhooks internes | Protection inter-fonctions |
| `SUPABASE_SERVICE_ROLE_KEY` | Fonctions admin | Bypass RLS |

---

## Debugging

### Voir les logs

```typescript
// Via Lovable Cloud
// Onglet "Logs" dans le dashboard
```

### Tester localement

Les Edge Functions sont déployées automatiquement. Pour débugger :

1. Ajouter des `console.log()` dans la fonction
2. Déclencher la fonction
3. Consulter les logs dans Lovable Cloud

### Erreurs communes

| Erreur | Cause | Solution |
|--------|-------|----------|
| 401 Unauthorized | JWT manquant/invalide | Vérifier auth côté client |
| 403 Forbidden | RLS bloque l'accès | Vérifier politiques RLS |
| 500 Internal Error | Erreur dans la fonction | Consulter logs |
| CORS error | Domaine non autorisé | Vérifier config.toml |
