# Inventaire API Keys & Secrets - QuaiDirect

**Date** : 23 Décembre 2024  
**Version** : 2.0

---

## 🔑 Vue d'Ensemble

QuaiDirect gère **20 secrets** stockés de manière sécurisée dans **Supabase Secrets Manager**. Aucune clé API n'est exposée en clair dans le code source ou le bundle frontend.

> **Mise à jour Décembre 2024** : Ajout de Firebase (FCM) pour les notifications push, suppression des secrets inutilisés (API_ENTREPRISE_TOKEN, PIXABAY_API_KEY), mise en place d'un fallback email automatique.

---

## 📋 Tableau Complet des Secrets

| # | Nom du Secret | Service | Exposition | Stockage | Sensibilité | Utilisé Par |
|---|---------------|---------|------------|----------|-------------|-------------|
| 1 | `STRIPE_SECRET_KEY` | Stripe | ❌ Backend | Supabase Secrets | 🔴 CRITIQUE | 6 Edge Functions Stripe |
| 2 | `STRIPE_WEBHOOK_SECRET` | Stripe | ❌ Backend | Supabase Secrets | 🔴 CRITIQUE | stripe-webhook |
| 3 | `RESEND_API_KEY` | Resend | ❌ Backend | Supabase Secrets | 🔴 CRITIQUE | 7 Edge Functions Email |
| 4 | `OPENAI_API_KEY` | OpenAI | ❌ Backend | Supabase Secrets | 🔴 CRITIQUE | marine-ai-assistant (legacy) |
| 5 | `LOVABLE_API_KEY` | Lovable AI | ❌ Backend | Supabase Secrets | 🔴 CRITIQUE | marine-ai-assistant, generate-* |
| 6 | `VITE_GOOGLE_MAPS_API_KEY` | Google Maps | ⚠️ Frontend | Supabase Secrets | 🟡 HAUTE | GoogleMapComponent.tsx |
| 7 | `serveur_google_map_clee_api` | Google Maps | ❌ Backend | Supabase Secrets | 🟡 HAUTE | geocode-address, google-geocode-port |
| 8 | `PAPPERS_API_TOKEN` | Pappers | ❌ Backend | Supabase Secrets | 🟢 MOYENNE | get-company-info |
| 9 | `INTERNAL_FUNCTION_SECRET` | QuaiDirect | ❌ Backend | Supabase Secrets | 🟡 HAUTE | Protection webhooks internes |
| 10 | `VAPID_PUBLIC_KEY` | Web Push | ⚠️ Frontend | Supabase Secrets | 🟢 BASSE | Push notifications |
| 11 | `VAPID_PRIVATE_KEY` | Web Push | ❌ Backend | Supabase Secrets | 🟡 HAUTE | send-drop-notification, send-reservation-notification |
| 12 | `FIREBASE_SERVICE_ACCOUNT` | Firebase | ❌ Backend | Supabase Secrets | 🔴 CRITIQUE | send-fcm-notification |
| 13 | `VITE_FIREBASE_API_KEY` | Firebase | ⚠️ Frontend | Supabase Secrets | 🟡 HAUTE | Initialisation Firebase JS SDK |
| 14 | `VITE_VAPID_PUBLIC_KEY` | Web Push | ⚠️ Frontend | Supabase Secrets | 🟢 BASSE | Obtention token FCM navigateur |
| 15 | `SUPABASE_URL` | Supabase | ⚠️ Frontend+Backend | Auto-généré | 🟢 BASSE | Toutes Edge Functions |
| 16 | `SUPABASE_ANON_KEY` | Supabase | ⚠️ Frontend+Backend | Auto-généré | 🟢 BASSE | Client Supabase |
| 17 | `SUPABASE_SERVICE_ROLE_KEY` | Supabase | ❌ Backend | Auto-généré | 🔴 CRITIQUE | 14 Edge Functions (bypass RLS) |
| 18 | `TWILIO_ACCOUNT_SID` | Twilio | ❌ Backend | Supabase Secrets | 🟡 HAUTE | send-sms |
| 19 | `TWILIO_AUTH_TOKEN` | Twilio | ❌ Backend | Supabase Secrets | 🔴 CRITIQUE | send-sms |
| 20 | `TWILIO_PHONE_NUMBER` | Twilio | ❌ Backend | Supabase Secrets | 🟢 BASSE | send-sms |

---

## 🛡️ Détail par Secret

### 1. STRIPE_SECRET_KEY
- **Service** : Stripe Payments
- **Type** : Secret API
- **Format** : `sk_live_***` (51+ caractères)
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🔴 CRITIQUE
- **Usage** :
  - `create-checkout/index.ts`
  - `create-basket-checkout/index.ts`
  - `create-fisherman-payment/index.ts`
  - `purchase-sms-pack/index.ts`
  - `stripe-webhook/index.ts`
  - `customer-portal/index.ts`
- **Recommandations** :
  - ✅ Stockée en Supabase Secrets
  - ✅ Jamais exposée frontend
  - ⚠️ Vérifier utilisation de Live Key en production (pas Test Key)
  - ⚠️ Activer alertes Stripe Dashboard sur transactions suspectes

---

### 2. STRIPE_WEBHOOK_SECRET
- **Service** : Stripe Webhooks
- **Type** : Signing Secret
- **Format** : `whsec_***` (64 caractères)
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🔴 CRITIQUE
- **Usage** :
  - `stripe-webhook/index.ts` (vérification signature)
- **Recommandations** :
  - ✅ Utilisée pour `stripe.webhooks.constructEvent()`
  - ✅ Bloque webhooks non-signés
  - ⚠️ Vérifier endpoint webhook configuré dans Stripe Dashboard : `https://topqlhxdflykejrlbuqx.supabase.co/functions/v1/stripe-webhook`

---

### 3. RESEND_API_KEY
- **Service** : Resend (Email Transactionnel)
- **Type** : API Key
- **Format** : `re_***` (40+ caractères)
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🔴 CRITIQUE
- **Usage** :
  - `send-fisherman-message/index.ts` (emails groupés pêcheurs)
  - `send-premium-welcome-email/index.ts` (email bienvenue premium)
  - `send-fisherman-approved-email/index.ts` (email validation pêcheur)
  - `send-basket-order-notification/index.ts` (notification commande panier)
  - `send-support-response/index.ts` (réponses support admin)
  - `send-billing-portal-link/index.ts` (lien portail facturation)
  - `send-drop-notification/index.ts` (fallback email si FCM échoue)
- **Sender Address** : `support@quaidirect.fr`
- **Recommandations** :
  - ✅ Domaine `quaidirect.fr` vérifié dans Resend Dashboard
  - ✅ SPF/DKIM/DMARC configurés pour délivrabilité
  - ⚠️ Monitorer quotas Resend (100 emails/jour en Free, upgrade si besoin)

---

### 4. OPENAI_API_KEY (Legacy)
- **Service** : OpenAI GPT
- **Type** : API Key
- **Format** : `sk-***` (51 caractères)
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🔴 CRITIQUE
- **Usage** :
  - `marine-ai-assistant/index.ts` (assistant IA pêcheurs) - **REMPLACÉ PAR LOVABLE_API_KEY**
  - Historiquement utilisé, désormais Lovable AI en priorité
- **Recommandations** :
  - ⚠️ Clé legacy, peut être désactivée si migration complète vers Lovable AI
  - ⚠️ Si conservée : monitorer usage OpenAI Dashboard pour éviter dépassements quota

---

### 5. LOVABLE_API_KEY
- **Service** : Lovable AI Gateway
- **Type** : API Key
- **Format** : Propriétaire
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🔴 CRITIQUE
- **Usage** :
  - `marine-ai-assistant/index.ts` (assistant IA pêcheurs via `google/gemini-2.5-flash`)
  - `generate-fisherman-description/index.ts` (génération descriptions profil)
  - `generate-fisherman-seo-content/index.ts` (génération contenu SEO)
  - `generate-fisherman-site-prompt/index.ts` (prompts Lovable sites)
- **Endpoint** : `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Modèle** : `google/gemini-2.5-flash`
- **Recommandations** :
  - ✅ Solution unique évite dépendance multiple providers
  - ✅ Gère quotas et rate limiting côté Lovable
  - ⚠️ Monitorer usage via dashboard Lovable si disponible

---

### 6. VITE_GOOGLE_MAPS_API_KEY
- **Service** : Google Maps JavaScript API
- **Type** : API Key (Publishable)
- **Format** : `AIza***` (39 caractères)
- **Exposition** : ⚠️ Frontend (bundle JS)
- **Stockage** : Supabase Secrets → injecté dans `.env` via `VITE_` prefix
- **Sensibilité** : 🟡 HAUTE (publiable mais doit être restreinte)
- **Usage** :
  - `src/components/GoogleMapComponent.tsx` (carte interactive)
  - `src/lib/google-maps.ts` (utilitaires carte)
- **Restrictions Actuelles** : ⚠️ **NON RESTREINTE** (Action Manuelle Requise)
- **Recommandations** :
  - 🔴 **URGENT** : Restreindre dans Google Cloud Console → APIs & Services → Credentials
  - Ajouter restriction **HTTP referrers** : `https://quaidirect.fr/*`, `https://www.quaidirect.fr/*`
  - Activer uniquement APIs nécessaires : Maps JavaScript API, Geocoding API
  - Monitorer quotas Google Cloud Console (2500 requêtes/jour gratuites Maps JS API)

---

### 7. serveur_google_map_clee_api
- **Service** : Google Geocoding API (Server-Side)
- **Type** : API Key (Server)
- **Format** : `AIza***` (39 caractères)
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🟡 HAUTE
- **Usage** :
  - `geocode-address/index.ts` (géocodage adresses points de vente)
  - `google-geocode-port/index.ts` (géocodage ports)
- **Recommandations** :
  - ✅ Clé backend séparée de frontend
  - ⚠️ Restreindre à adresses IP serveurs Supabase si possible
  - ⚠️ Monitorer quotas Geocoding API (40 000 requêtes/mois gratuites)

---

### 8. PAPPERS_API_TOKEN
- **Service** : Pappers (Données entreprises françaises)
- **Type** : API Key
- **Format** : UUID ou custom
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🟢 MOYENNE
- **Usage** :
  - `get-company-info/index.ts` (recherche SIRET entreprises pêcheurs)
- **Recommandations** :
  - ✅ Utilisé uniquement côté backend
  - ⚠️ Monitorer quotas Pappers API (varie selon plan)

---

### 9. INTERNAL_FUNCTION_SECRET
- **Service** : QuaiDirect (Protection Interne)
- **Type** : Secret Custom
- **Format** : String aléatoire (min 32 caractères recommandé)
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🟡 HAUTE
- **Usage** :
  - Protection des Edge Functions appelées uniquement par webhooks internes :
    - `send-premium-welcome-email/index.ts`
    - `send-basket-order-notification/index.ts`
  - Vérification : `req.headers.get('x-internal-secret') === INTERNAL_FUNCTION_SECRET`
- **Appelé Par** :
  - `stripe-webhook/index.ts` (passe header `x-internal-secret` lors des appels)
- **Recommandations** :
  - ✅ Empêche appels externes directs aux fonctions webhook
  - ✅ Génération aléatoire sécurisée recommandée : `openssl rand -hex 32`
  - ⚠️ Ne jamais exposer dans logs ou erreurs frontend

---

### 10. VAPID_PUBLIC_KEY
- **Service** : Web Push Notifications (VAPID)
- **Type** : Public Key
- **Format** : Base64 URL-safe (87 caractères)
- **Exposition** : ⚠️ Frontend (bundle JS)
- **Stockage** : Supabase Secrets → injecté frontend
- **Sensibilité** : 🟢 BASSE (publiable par design)
- **Usage** :
  - `src/components/PushNotificationToggle.tsx` (inscription push subscriptions)
  - `public/sw.js` (service worker)
- **Recommandations** :
  - ✅ Clé publique, peut être exposée sans risque
  - ⚠️ Paire avec `VAPID_PRIVATE_KEY` (backend)

---

### 11. VAPID_PRIVATE_KEY
- **Service** : Web Push Notifications (VAPID)
- **Type** : Private Key
- **Format** : Base64 URL-safe (87 caractères)
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🟡 HAUTE
- **Usage** :
  - `send-drop-notification/index.ts` (envoi notifications arrivages)
  - `send-reservation-notification/index.ts` (envoi notifications réservations)
- **Recommandations** :
  - ✅ Jamais exposer côté frontend
  - ⚠️ Regénérer paire VAPID si fuite suspectée : `npx web-push generate-vapid-keys`

---

### 12. FIREBASE_SERVICE_ACCOUNT
- **Service** : Firebase Cloud Messaging (FCM)
- **Type** : Service Account JSON
- **Format** : JSON complet (inclut `private_key`, `client_email`, etc.)
- **Exposition** : ❌ Backend uniquement
- **Stockage** : Supabase Secrets Manager
- **Sensibilité** : 🔴 CRITIQUE
- **Usage** :
  - `send-fcm-notification/index.ts` (envoi notifications push via FCM)
  - `send-drop-notification/index.ts` (appelle send-fcm-notification)
- **Recommandations** :
  - 🔴 **JAMAIS exposer frontend** (permet envoi illimité de notifications)
  - ✅ Générer depuis Firebase Console → Project Settings → Service Accounts
  - ⚠️ Révoquer et regénérer si fuite suspectée

---

### 13. VITE_FIREBASE_API_KEY
- **Service** : Firebase JavaScript SDK
- **Type** : API Key (Publishable)
- **Format** : `AIza***` (39 caractères)
- **Exposition** : ⚠️ Frontend (bundle JS)
- **Stockage** : Supabase Secrets → injecté frontend via VITE_ prefix
- **Sensibilité** : 🟡 HAUTE (publiable mais restreindre si possible)
- **Usage** :
  - `src/lib/firebase.ts` (initialisation Firebase App + Messaging)
- **Note** : Un fallback hardcodé existe dans `firebase.ts` si non configuré
- **Recommandations** :
  - ⚠️ Restreindre dans Google Cloud Console si possible (HTTP referrers)
  - ✅ Nécessaire pour initialiser Firebase côté client

---

### 14. VITE_VAPID_PUBLIC_KEY
- **Service** : Web Push / Firebase Messaging
- **Type** : Public Key (VAPID)
- **Format** : Base64 URL-safe (87+ caractères)
- **Exposition** : ⚠️ Frontend (bundle JS)
- **Stockage** : Supabase Secrets → injecté frontend via VITE_ prefix
- **Sensibilité** : 🟢 BASSE (publique par design)
- **Usage** :
  - `src/lib/firebase.ts` → `getToken()` (obtention token FCM)
- **Note** : Un fallback hardcodé existe dans `firebase.ts` si non configuré
- **Recommandations** :
  - ✅ Doit correspondre à la paire VAPID configurée dans Firebase Console
  - ⚠️ Vérifier que la valeur ne contient PAS de préfixe `VITE_` dans la valeur elle-même

---

### 15-17. Variables Supabase (Auto-générées)

Ces variables sont automatiquement injectées par Lovable Cloud :

| Variable | Sensibilité | Usage |
|----------|-------------|-------|
| `SUPABASE_URL` | 🟢 BASSE | URL publique projet |
| `SUPABASE_ANON_KEY` | 🟢 BASSE | Clé publique client |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔴 CRITIQUE | Bypass RLS (backend only) |

---

### 18-20. Variables Twilio (SMS)

| Variable | Sensibilité | Format |
|----------|-------------|--------|
| `TWILIO_ACCOUNT_SID` | 🟡 HAUTE | `AC***` |
| `TWILIO_AUTH_TOKEN` | 🔴 CRITIQUE | String aléatoire |
| `TWILIO_PHONE_NUMBER` | 🟢 BASSE | `+33XXXXXXXXX` |

**Usage** : `send-sms/index.ts` pour l'envoi de SMS aux contacts pêcheurs.

---

## 📊 Statistiques Secrets

- **Total Secrets** : 20
- **Secrets Backend-Only** : 14 (70%)
- **Secrets Publishable** : 6 (30%)
- **Sensibilité CRITIQUE** : 8 secrets
- **Sensibilité HAUTE** : 6 secrets
- **Sensibilité MOYENNE** : 1 secret
- **Sensibilité BASSE** : 5 secrets

---

## 🆕 Système de Fallback (Décembre 2024)

### Fallback Email pour Notifications Push

Quand les notifications push FCM échouent, le système envoie automatiquement un email de secours :

1. **Edge Function** : `send-drop-notification/index.ts`
2. **Comportement** :
   - Tente d'abord l'envoi FCM via `send-fcm-notification`
   - Si échec (pas de token FCM, erreur réseau), envoie un email via Resend
   - Les deux canaux sont loggués pour diagnostic

### Fallback VAPID Key

Si `VITE_VAPID_PUBLIC_KEY` n'est pas configuré ou invalide :

1. **Fichier** : `src/lib/firebase.ts`
2. **Comportement** :
   - Utilise une clé VAPID publique hardcodée (fallback sécurisé)
   - Affiche un warning en console
   - Le diagnostic `/compte` indique "fallback" comme source

---

## 🗑️ Secrets Supprimés (Décembre 2024)

| Secret | Raison |
|--------|--------|
| `API_ENTREPRISE_TOKEN` | Pappers utilisé exclusivement, fallback jamais utilisé |
| `PIXABAY_API_KEY` | Intégration Pixabay supprimée du code |

---

## 🚨 Actions Manuelles Requises

### 1. Restreindre Google Maps API Key Frontend
**Où** : Google Cloud Console → APIs & Services → Credentials  
**Action** :
1. Sélectionner API Key `VITE_GOOGLE_MAPS_API_KEY`
2. Ajouter restriction **HTTP referrers** :
   - `https://quaidirect.fr/*`
   - `https://www.quaidirect.fr/*`
3. Limiter APIs activées à :
   - Maps JavaScript API
   - Geocoding API (si nécessaire frontend)
4. Sauvegarder

**Délai** : Avant mise en production

---

### 2. Vérifier Stripe Webhook Endpoint
**Où** : Stripe Dashboard → Developers → Webhooks  
**Action** :
1. Ajouter endpoint : `https://topqlhxdflykejrlbuqx.supabase.co/functions/v1/stripe-webhook`
2. Sélectionner événements :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
3. Copier Signing Secret → Vérifier correspondance avec `STRIPE_WEBHOOK_SECRET` en Supabase

**Délai** : Avant mise en production

---

## 🔒 Bonnes Pratiques

1. **Rotation Secrets** : Planifier rotation annuelle des clés API critiques (Stripe, Resend)
2. **Monitoring** : Activer alertes usage anormal sur dashboards fournisseurs
3. **Logs** : Ne jamais logger secrets complets (masquer à 80%)
4. **Accès** : Limiter accès Supabase Secrets aux admins uniquement
5. **Audit** : Revue trimestrielle des secrets actifs et inutilisés

---

**Prochaine Section** : [Rôles et Autorisations](./04_roles_et_autorisations.md)
