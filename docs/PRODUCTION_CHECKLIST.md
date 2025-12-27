# QuaiDirect - Checklist Pré-Production

## Actions Manuelles Requises

### 🔴 CRITIQUE - À faire AVANT le lancement

#### 1. Configuration Stripe Webhook
Le webhook Stripe doit être configuré manuellement dans le Dashboard Stripe :

1. Aller sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquer "Add endpoint"
3. Configurer :
   - **URL** : `https://topqlhxdflykejrlbuqx.supabase.co/functions/v1/stripe-webhook`
   - **Events** à sélectionner :
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Copier le **Signing secret** généré
5. Dans Lovable Cloud > Secrets, mettre à jour `STRIPE_WEBHOOK_SECRET` avec cette valeur

#### 2. Activation "Leaked Password Protection"
Protection contre les mots de passe compromis :

1. Aller dans Supabase Dashboard > Authentication > Settings
2. Section "Security"
3. Activer **"Enable Leaked Password Protection"**
4. Sauvegarder

#### 3. Restriction Google Maps API Key
Limiter la clé API au domaine de production :

1. Aller sur [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Cliquer sur votre clé API Google Maps
3. Section "Application restrictions" :
   - Sélectionner "HTTP referrers (web sites)"
   - Ajouter : `quaidirect.fr/*`
   - Ajouter : `*.quaidirect.fr/*`
4. Section "API restrictions" :
   - Sélectionner "Restrict key"
   - Cocher uniquement :
     - Maps JavaScript API
     - Geocoding API
     - Places API
5. Sauvegarder

---

### 🟡 IMPORTANT - Vérifications post-configuration

#### 4. Test Paiement Complet
Effectuer un paiement test bout-en-bout :

1. Créer un compte utilisateur test
2. Aller sur `/pecheur/payment`
3. Effectuer un paiement avec carte test Stripe (`4242 4242 4242 4242`)
4. Vérifier :
   - [ ] Redirection vers `/pecheur/payment-success`
   - [ ] Email de bienvenue reçu
   - [ ] Entrée créée dans table `payments`
   - [ ] Rôle `fisherman` ajouté dans `user_roles`
   - [ ] Accès au dashboard pêcheur fonctionnel

#### 5. Test Emails
Vérifier que tous les emails transactionnels fonctionnent :

- [ ] Email bienvenue utilisateur (inscription)
- [ ] Email bienvenue pêcheur (après paiement)
- [ ] Email confirmation paiement (renouvellement)
- [ ] Email réponse support admin

#### 6. Test Carte Interactive
Vérifier le bon fonctionnement de la carte :

- [ ] Carte s'affiche correctement sur `/carte`
- [ ] Géolocalisation utilisateur fonctionne
- [ ] Points de vente affichés avec adresses
- [ ] Arrivages visibles sur la carte
- [ ] Pas d'erreurs console liées à Google Maps

---

### 🟢 Optionnel - Optimisations recommandées

#### 7. Configuration Sentry
Pour le monitoring des erreurs en production :

1. Créer un projet sur [Sentry.io](https://sentry.io)
2. Récupérer le DSN
3. Ajouter `VITE_SENTRY_DSN` dans les variables d'environnement Lovable

#### 8. Configuration Analytics
Si vous souhaitez suivre l'usage :

1. Créer une propriété Google Analytics 4
2. Ajouter le script de tracking dans `index.html`

---

## Secrets Requis (Lovable Cloud)

| Secret | Description | Obligatoire |
|--------|-------------|-------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | ✅ |
| `RESEND_API_KEY` | Clé API Resend pour emails | ✅ |
| `LOVABLE_API_KEY` | Clé API Lovable AI | ✅ |
| `INTERNAL_FUNCTION_SECRET` | Secret interne Edge Functions | ✅ |
| `VITE_GOOGLE_MAPS_API_KEY` | Clé API Google Maps | ✅ |
| `VITE_SENTRY_DSN` | DSN Sentry (optionnel) | ⚪ |

---

## Contacts Support

- **Email support** : support@quaidirect.fr
- **Email CEO** : CEO@quaidirect.fr

---

*Document mis à jour le 2025-12-03*
