# 🔧 Checklist de Configuration QuaiDirect

**Mise à jour** : 23 Décembre 2024

## Variables d'Environnement Frontend (VITE_*)

Ces variables doivent être configurées dans Lovable Cloud > Settings > Environment Variables.

| Variable | Requis | Description |
|----------|--------|-------------|
| `VITE_SUPABASE_URL` | ✅ Oui | URL de votre projet Supabase/Lovable |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Oui | Clé publique anon Supabase |
| `VITE_GOOGLE_MAPS_API_KEY` | ✅ Oui | Clé API Google Maps (avec restrictions HTTP) |
| `VITE_VAPID_PUBLIC_KEY` | ⚠️ Recommandé | Clé publique VAPID pour push notifications (fallback hardcodé existe) |
| `VITE_FIREBASE_API_KEY` | ⚠️ Recommandé | Clé API Firebase pour le SDK JS (fallback hardcodé existe) |
| `VITE_SENTRY_DSN` | ⚠️ Recommandé | DSN Sentry pour le monitoring d'erreurs |

> **Note** : Les variables `VITE_VAPID_PUBLIC_KEY` et `VITE_FIREBASE_API_KEY` ont un fallback hardcodé dans `src/lib/firebase.ts`. Le système fonctionnera sans, mais il est recommandé de les configurer pour plus de flexibilité.

## Variables d'Environnement Backend (Edge Functions)

Ces variables sont configurées dans Supabase/Lovable Cloud > Edge Functions > Secrets.

### Supabase (Auto-configuré)
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Auto-injecté par Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injecté par Supabase |

### Stripe (Paiements)
| Variable | Requis | Description |
|----------|--------|-------------|
| `STRIPE_SECRET_KEY` | ✅ Oui | Clé secrète Stripe (sk_live_xxx ou sk_test_xxx) |
| `STRIPE_WEBHOOK_SECRET` | ✅ Oui | Secret du webhook Stripe (whsec_xxx) |

### Twilio (SMS)
| Variable | Requis | Description |
|----------|--------|-------------|
| `TWILIO_ACCOUNT_SID` | ✅ Oui | Account SID Twilio |
| `TWILIO_AUTH_TOKEN` | ✅ Oui | Auth Token Twilio |
| `TWILIO_PHONE_NUMBER` | ✅ Oui | Numéro d'envoi (+33XXXXXXXXX) |

### Email (Resend)
| Variable | Requis | Description |
|----------|--------|-------------|
| `RESEND_API_KEY` | ✅ Oui | Clé API Resend pour l'envoi d'emails |

### IA (Lovable AI Gateway)
| Variable | Requis | Description |
|----------|--------|-------------|
| `LOVABLE_API_KEY` | ✅ Oui | Clé API pour Lovable AI Gateway (IA du Marin) |

### Sécurité Inter-Fonctions
| Variable | Requis | Description |
|----------|--------|-------------|
| `INTERNAL_FUNCTION_SECRET` | ⚠️ Recommandé | Secret pour sécuriser les appels entre Edge Functions |

### Push Notifications (Firebase FCM)
| Variable | Requis | Description |
|----------|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | ✅ Oui | JSON complet du service account Firebase (pour envoi FCM) |
| `VAPID_PRIVATE_KEY` | ✅ Oui | Clé privée VAPID (côté serveur) |
| `VAPID_PUBLIC_KEY` | ✅ Oui | Clé publique VAPID (doit correspondre à VITE_VAPID_PUBLIC_KEY) |

### Entreprises
| Variable | Requis | Description |
|----------|--------|-------------|
| `PAPPERS_API_TOKEN` | ✅ Oui | Token API Pappers pour recherche SIRET |

## Comment générer les clés VAPID

```bash
npx web-push generate-vapid-keys
```

Cela génère une paire de clés :
- La clé **publique** va dans `VITE_VAPID_PUBLIC_KEY` (frontend) ET `VAPID_PUBLIC_KEY` (backend)
- La clé **privée** va dans `VAPID_PRIVATE_KEY` (backend uniquement)

## Comment obtenir le Firebase Service Account

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner votre projet
3. Aller dans **Project Settings** (roue dentée)
4. Onglet **Service Accounts**
5. Cliquer **Generate new private key**
6. Copier le JSON complet dans le secret `FIREBASE_SERVICE_ACCOUNT`

## Vérification de la configuration

### 1. Tester les Notifications Push
- Aller sur `/compte`
- Section "Diagnostic Notifications"
- Vérifier que tous les steps sont ✅ OK
- La "fingerprint" VAPID doit afficher le préfixe de la clé

### 2. Tester les SMS
- Aller sur `/dashboard/pecheur`
- Onglet "SMS"
- Vérifier que le quota s'affiche correctement

### 3. Tester les Paiements
- Créer un checkout test
- Vérifier les logs du webhook Stripe

### 4. Tester la Carte
- Aller sur `/carte`
- Vérifier que Google Maps s'affiche sans erreur

## Troubleshooting

### "TWILIO_NOT_CONFIGURED"
→ Les variables Twilio ne sont pas définies dans Edge Functions Secrets

### "Carte non disponible"
→ `VITE_GOOGLE_MAPS_API_KEY` manquant ou clé avec mauvaises restrictions

### "Notifications ne fonctionnent pas"
→ Lancer le diagnostic sur `/compte` pour identifier l'étape qui échoue :
- **Step VAPID** : Vérifier `VITE_VAPID_PUBLIC_KEY` (ou le fallback sera utilisé)
- **Step Firebase** : Vérifier `VITE_FIREBASE_API_KEY` et la configuration Firebase Console
- **Step Token FCM** : Vérifier permissions navigateur et service worker
- **Step Token DB** : Vérifier connexion Supabase

### "Emails non envoyés"
→ Vérifier `RESEND_API_KEY` dans les secrets Edge Functions
→ Vérifier que le domaine `quaidirect.fr` est vérifié dans Resend Dashboard

### "VAPID key shows 'fallback' in diagnostic"
→ La clé `VITE_VAPID_PUBLIC_KEY` n'est pas configurée ou est invalide
→ Le système utilise le fallback hardcodé, ce qui fonctionne mais n'est pas recommandé
→ Configurer la variable avec la bonne clé VAPID publique

## Architecture Notifications (Décembre 2024)

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                   │
│  src/lib/firebase.ts                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ getVapidKey() → VITE_VAPID_PUBLIC_KEY ou FALLBACK           │ │
│  │ getFirebaseConfig() → VITE_FIREBASE_API_KEY ou FALLBACK     │ │
│  │ getMessaging() → Initialise Firebase + obtient token FCM    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ▼                                    │
│           Token FCM stocké dans fcm_tokens (Supabase)            │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND                                    │
│  send-drop-notification/index.ts                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 1. Récupère tokens FCM de fcm_tokens                        │ │
│  │ 2. Appelle send-fcm-notification pour chaque token          │ │
│  │ 3. Si échec → Envoie email fallback via Resend              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ▼                                    │
│  send-fcm-notification/index.ts                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Utilise FIREBASE_SERVICE_ACCOUNT pour envoyer via FCM API   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```
