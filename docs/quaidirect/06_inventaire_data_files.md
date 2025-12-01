# Inventaire Data Files - QuaiDirect

**Date** : 1er Décembre 2024  
**Version** : 1.0

---

## 📁 Structure Générale

Le projet QuaiDirect contient **plusieurs types de fichiers de données** répartis dans différents répertoires. Cet inventaire couvre les migrations SQL, fichiers de configuration, et autres fichiers contenant données sensibles ou structurelles.

---

## 🗄️ Migrations SQL Supabase

**Localisation** : `supabase/migrations/`

### Inventaire des Migrations (19 Fichiers)

| # | Fichier | Date | Description | Sensibilité |
|---|---------|------|-------------|-------------|
| 1 | `20251130_unify_payment_tables.sql` | 30/11/2024 | Migration données `premium_subscriptions` → `payments`, suppression table redondante, ajout indexes | 🟡 HAUTE |
| 2 | `20251201_fix_rls_policies_critical.sql` | 01/12/2024 | Corrections RLS critiques : 8 tables (profiles, fishermen, payments, ai_conversations, fishermen_contacts, fishermen_messages, basket_orders, notifications) | 🔴 CRITIQUE |
| 3 | `20251201_fix_public_fishermen_view.sql` | 01/12/2024 | Refonte vue `public_fishermen` : exclusion PII (email, phone, address, SIRET) | 🔴 CRITIQUE |
| 4 | `20251201_migrate_whitelist_to_db.sql` | 01/12/2024 | Création table `fisherman_whitelist` + migration emails hardcodés depuis code | 🟡 HAUTE |
| 5 | `20251201_add_rls_zones_tables.sql` | 01/12/2024 | Ajout policies RLS publiques sur `zones_peche` et `zones_especes` | 🟢 MOYENNE |
| 6 | `..._initial_schema.sql` | (Initiales) | Création tables principales : drops, fishermen, species, ports, etc. | 🔴 CRITIQUE |
| 7 | `..._add_user_roles.sql` | (Initiales) | Création système rôles : enum `app_role`, table `user_roles`, fonction `has_role()` | 🔴 CRITIQUE |
| 8 | `..._add_rls_policies.sql` | (Initiales) | Première vague policies RLS sur toutes tables | 🔴 CRITIQUE |
| 9 | `..._add_sale_points.sql` | (Initiales) | Création table `fisherman_sale_points` (2 max par pêcheur) | 🟢 MOYENNE |
| 10 | `..._add_contacts_messaging.sql` | (Initiales) | Création tables `fishermen_contacts`, `fishermen_messages` | 🟡 HAUTE |
| 11 | `..._add_baskets.sql` | (Initiales) | Création tables `client_baskets`, `basket_orders` | 🟢 MOYENNE |
| 12 | `..._add_payments.sql` | (Initiales) | Création table `payments` (avant dédoublonnement) | 🟡 HAUTE |
| 13 | `..._add_premium_subscriptions.sql` | (Initiales) | Création table `premium_subscriptions` (avant unification) | 🟡 HAUTE |
| 14 | `..._add_ai_conversations.sql` | (Initiales) | Création table `ai_conversations` (historique IA du Marin) | 🟢 MOYENNE |
| 15 | `..._add_sms_system.sql` | (Initiales) | Création tables `fishermen_sms_usage`, `fishermen_sms_packs` | 🟢 MOYENNE |
| 16 | `..._add_support_system.sql` | (Initiales) | Création tables `support_requests`, `request_type_definitions`, `secure_edit_tokens`, `profile_edit_logs` | 🟡 HAUTE |
| 17 | `..._add_notifications.sql` | (Initiales) | Création tables `notifications`, `notifications_queue`, `push_subscriptions` | 🟢 MOYENNE |
| 18 | `..._add_zones_peche.sql` | (Initiales) | Création tables `zones_peche`, `zones_especes` (géographie intelligente) | 🟢 MOYENNE |
| 19 | `..._add_drop_templates.sql` | (Initiales) | Création table `drop_templates` (templates rapides arrivages) | 🟢 BASSE |

**Notes** :
- Fichiers `..._` représentent migrations initiales (noms exacts non fournis)
- Toutes migrations sont **exécutées automatiquement** par Supabase en ordre chronologique
- **Ne jamais modifier migrations déjà déployées** (créer nouvelle migration pour corrections)

---

## ⚙️ Fichiers de Configuration

### 1. `supabase/config.toml`

**Localisation** : `supabase/config.toml`  
**Type** : Configuration Supabase  
**Sensibilité** : 🟢 BASSE (pas de secrets)

**Contenu** :
- Configuration projet Supabase (project_id, region)
- Configuration Edge Functions (verify_jwt par fonction)
- Configuration Auth (auto_confirm_email, email templates)
- Configuration Storage (buckets publics/privés)

**Sections Clés** :

```toml
[project]
org_id = "..."
project_id = "topqlhxdflykejrlbuqx"

[auth]
enable_signup = true
auto_confirm_email = true  # ⚠️ Désactiver en production

[functions.create-checkout]
verify_jwt = true

[functions.stripe-webhook]
verify_jwt = false

[storage.buckets.fishermen-photos]
public = true

[storage.buckets.receipts]
public = false
```

**Recommandations** :
- ✅ Fichier versionné Git (pas de secrets)
- ⚠️ Avant production : `auto_confirm_email = false`
- ✅ Toutes Edge Functions configurées avec `verify_jwt` correct

---

### 2. `.env` (Auto-généré)

**Localisation** : `.env` (racine projet)  
**Type** : Variables d'environnement  
**Sensibilité** : 🟡 HAUTE (contient clés publishable)

**Contenu** :
```bash
VITE_SUPABASE_URL=https://topqlhxdflykejrlbuqx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbG...
VITE_SUPABASE_PROJECT_ID=topqlhxdflykejrlbuqx
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

**Notes** :
- ✅ Fichier **auto-généré** par Lovable Cloud
- ❌ **NE JAMAIS MODIFIER MANUELLEMENT**
- ✅ Exclu du versioning Git (`.gitignore`)
- ⚠️ Contient clés publishable (safe pour frontend)

---

### 3. `tailwind.config.ts`

**Localisation** : `tailwind.config.ts`  
**Type** : Configuration Tailwind CSS  
**Sensibilité** : 🟢 BASSE

**Contenu** :
- Définition couleurs design system (HSL)
- Configuration animations, spacing, fonts
- Plugins Tailwind (tailwindcss-animate)

**Recommandations** :
- ✅ Toutes couleurs en HSL (compatibilité design system)
- ✅ Variables CSS importées depuis `index.css`

---

### 4. `src/index.css`

**Localisation** : `src/index.css`  
**Type** : CSS Global + Design Tokens  
**Sensibilité** : 🟢 BASSE

**Contenu** :
- Variables CSS globales (`:root`, `.dark`)
- Design tokens : `--primary`, `--secondary`, `--accent`, etc.
- Reset CSS Tailwind (`@tailwind base`, `@tailwind components`, `@tailwind utilities`)

**Recommandations** :
- ✅ Utiliser semantic tokens au lieu de couleurs hardcodées
- ✅ Toutes couleurs en `hsl()` format

---

## 📊 Fichiers de Données Statiques

### 1. `src/lib/ports.ts`

**Localisation** : `src/lib/ports.ts`  
**Type** : Données ports maritimes  
**Sensibilité** : 🟢 BASSE (données publiques)

**Contenu** :
```typescript
export const PORTS = [
  { id: '...', name: 'Port de Hyères', city: 'Hyères', latitude: 43.0965, longitude: 6.1443 },
  { id: '...', name: 'Port de Toulon', city: 'Toulon', latitude: 43.1242, longitude: 5.9280 },
  // ...
];
```

**Usage** :
- Seed initial base de données (table `ports`)
- Fallback si requête DB échoue
- Affichage carte sans connexion backend

**Recommandations** :
- ✅ Synchroniser avec table `ports` en DB
- ⚠️ Considérer migration complète vers DB uniquement

---

### 2. `public/manifest.json`

**Localisation** : `public/manifest.json`  
**Type** : PWA Manifest  
**Sensibilité** : 🟢 BASSE

**Contenu** :
```json
{
  "name": "QuaiDirect",
  "short_name": "QuaiDirect",
  "description": "Poisson frais directement du pêcheur",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0891b2",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Recommandations** :
- ✅ Ajouter icônes PWA (`/icon-192.png`, `/icon-512.png`)
- ✅ Configurer service worker (`public/sw.js`)

---

### 3. `public/sw.js` (Service Worker)

**Localisation** : `public/sw.js`  
**Type** : Service Worker (Push Notifications)  
**Sensibilité** : 🟢 BASSE

**Contenu** :
```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png'
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
```

**Usage** :
- Réception push notifications (via VAPID)
- Affichage notifications système
- Gestion clics notifications (redirection)

---

### 4. `public/robots.txt`

**Localisation** : `public/robots.txt`  
**Type** : Instructions robots SEO  
**Sensibilité** : 🟢 BASSE

**Contenu** :
```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /pecheur/
Disallow: /premium/

Sitemap: https://quaidirect.fr/sitemap.xml
```

**Recommandations** :
- ✅ Bloquer pages privées (dashboards, admin)
- ✅ Autoriser pages publiques (arrivages, profils pêcheurs)

---

### 5. `public/sitemap.xml`

**Localisation** : `public/sitemap.xml`  
**Type** : Sitemap SEO  
**Sensibilité** : 🟢 BASSE

**Contenu** :
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://quaidirect.fr/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://quaidirect.fr/arrivages</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <!-- URLs profils pêcheurs générées dynamiquement -->
</urlset>
```

**Recommandations** :
- ⚠️ Sitemap statique, considérer génération dynamique
- ✅ Inclure toutes pages publiques importantes
- ✅ URLs profils pêcheurs (`/boutique/:slug`)

---

## 🔐 Fichiers Contenant Données Sensibles

### 1. `src/integrations/supabase/types.ts` (Auto-généré)

**Localisation** : `src/integrations/supabase/types.ts`  
**Type** : Types TypeScript Supabase  
**Sensibilité** : 🟡 HAUTE (structure DB complète)

**Contenu** :
- Types TypeScript générés depuis schéma Supabase
- Définitions Row/Insert/Update pour toutes tables
- Enums (`app_role`, `drop_status`, etc.)
- Définitions relations foreign keys

**Recommandations** :
- ❌ **NE JAMAIS MODIFIER MANUELLEMENT**
- ✅ Fichier **auto-généré** par Supabase
- ✅ Exclu du versioning Git
- ⚠️ Peut exposer structure DB → Garder en privé

---

### 2. `src/integrations/supabase/client.ts` (Auto-généré)

**Localisation** : `src/integrations/supabase/client.ts`  
**Type** : Client Supabase configuré  
**Sensibilité** : 🟢 BASSE (utilise clés publishable)

**Contenu** :
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Recommandations** :
- ❌ **NE JAMAIS MODIFIER MANUELLEMENT**
- ✅ Fichier **auto-généré** par Lovable Cloud

---

## 📈 Fichiers de Logs & Audit

### Pas de Fichiers Logs Locaux

**Notes** :
- ✅ Logs centralisés dans Supabase Dashboard (auth, DB, edge functions, storage)
- ✅ Table `audits` en DB pour logs applicatifs
- ⚠️ Considérer service externe (Sentry, LogRocket) pour logs frontend

---

## 📊 Statistiques Data Files

- **Migrations SQL** : 19 fichiers
- **Fichiers Config** : 4 fichiers (config.toml, .env, tailwind, index.css)
- **Fichiers Statiques** : 5 fichiers (ports.ts, manifest.json, sw.js, robots.txt, sitemap.xml)
- **Fichiers Sensibles** : 2 fichiers auto-générés (types.ts, client.ts)
- **Total Fichiers Données** : **30 fichiers**

---

## 🔒 Sensibilité Globale

| Niveau | Nombre | Fichiers |
|--------|--------|----------|
| 🔴 CRITIQUE | 5 | Migrations RLS, public_fishermen, initial_schema, user_roles, rls_policies |
| 🟡 HAUTE | 7 | Migrations payments, whitelist, contacts/messaging, .env, types.ts |
| 🟢 MOYENNE/BASSE | 18 | Config, static files, autres migrations |

---

## 🚨 Recommandations Finales

1. **Backup Migrations** : Sauvegarder régulièrement répertoire `supabase/migrations/`
2. **Never Edit Auto-Generated** : Ne jamais modifier `.env`, `types.ts`, `client.ts`
3. **Secrets Management** : Tous secrets dans Supabase Secrets Manager, pas en fichiers
4. **Sitemap Dynamique** : Générer sitemap.xml dynamiquement depuis profils pêcheurs
5. **PWA Icons** : Ajouter icônes manquantes (`icon-192.png`, `icon-512.png`, `badge-72.png`)

---

**Fin de la Documentation d'Audit QuaiDirect**
