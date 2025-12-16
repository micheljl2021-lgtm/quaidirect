# 🔧 Checklist de Configuration QuaiDirect

## Variables d'Environnement Frontend (VITE_*)

Ces variables doivent être configurées dans Lovable Cloud > Settings > Environment Variables.

| Variable | Requis | Description |
|----------|--------|-------------|
| `VITE_SUPABASE_URL` | ✅ Oui | URL de votre projet Supabase/Lovable |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ Oui | Clé publique anon Supabase |
| `VITE_GOOGLE_MAPS_API_KEY` | ✅ Oui | Clé API Google Maps (avec restrictions HTTP) |
| `VITE_VAPID_PUBLIC_KEY` | ✅ Oui | Clé publique VAPID pour push notifications |
| `VITE_SENTRY_DSN` | ⚠️ Recommandé | DSN Sentry pour le monitoring d'erreurs |

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

### Push Notifications
| Variable | Requis | Description |
|----------|--------|-------------|
| `VAPID_PRIVATE_KEY` | ✅ Oui | Clé privée VAPID (côté serveur) |
| `VAPID_PUBLIC_KEY` | ✅ Oui | Clé publique VAPID (doit correspondre à VITE_VAPID_PUBLIC_KEY) |

## Comment générer les clés VAPID

```bash
npx web-push generate-vapid-keys
```

Cela génère une paire de clés :
- La clé **publique** va dans `VITE_VAPID_PUBLIC_KEY` (frontend) ET `VAPID_PUBLIC_KEY` (backend)
- La clé **privée** va dans `VAPID_PRIVATE_KEY` (backend uniquement)

## Vérification de la configuration

### 1. Tester les SMS
- Aller sur `/dashboard/pecheur`
- Onglet "SMS"
- Vérifier que le quota s'affiche correctement

### 2. Tester les Push Notifications
- Activer les notifications depuis le dashboard
- Vérifier la console pour `[Push]` logs

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
→ Vérifier `VITE_VAPID_PUBLIC_KEY` et que le Service Worker est enregistré

### "Emails non envoyés"
→ Vérifier `RESEND_API_KEY` dans les secrets Edge Functions
