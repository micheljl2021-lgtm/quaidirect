# Rôles et Autorisations - QuaiDirect

**Date** : 1er Décembre 2024  
**Version** : 1.0

---

## 👥 Système de Rôles

QuaiDirect utilise un système de **rôles multiples** via l'enum `app_role` et la table `user_roles`. Un utilisateur peut avoir **plusieurs rôles simultanément**.

### Enum `app_role`

```sql
CREATE TYPE app_role AS ENUM (
  'visitor',   -- Visiteur non authentifié (anonyme)
  'user',      -- Client authentifié standard
  'premium',   -- Client avec abonnement premium actif
  'fisherman', -- Pêcheur avec profil validé
  'admin'      -- Administrateur plateforme
);
```

### Hiérarchie des Rôles (Priorité Décroissante)

1. **admin** - Accès complet à toutes les fonctionnalités
2. **fisherman** - Accès dashboard pêcheur + toutes features client
3. **premium** - Accès dashboard premium + features client standard
4. **user** - Accès dashboard client standard
5. **visitor** - Accès pages publiques uniquement (non stocké en DB)

**Note** : Un utilisateur peut être `fisherman` + `premium` + `user` simultanément. La redirection se fait vers le dashboard du rôle le plus élevé.

---

## 🔐 Fonction d'Autorisation : `has_role()`

```sql
CREATE OR REPLACE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

**Usage dans RLS Policies** :
```sql
CREATE POLICY "Premium users can view drops early"
  ON drops FOR SELECT
  USING (has_role(auth.uid(), 'premium') AND now() >= visible_at);
```

---

## 📊 Matrice des Droits par Rôle

### Pages et Accès

| Page | Visitor | User | Premium | Fisherman | Admin |
|------|---------|------|---------|-----------|-------|
| **Pages Publiques** | | | | | |
| Landing (/) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Arrivages (/arrivages) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Carte (/carte) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Recettes (/recettes) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Détail Arrivage (/arrivage/:id) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Profil Pêcheur (/boutique/:slug) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comment ça marche | ✅ | ✅ | ✅ | ✅ | ✅ |
| CGV, Mentions Légales | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Authentification** | | | | | |
| Auth (/auth) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reset Password | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Client Standard** | | | | | |
| Dashboard User (/dashboard/user) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Mon Compte (/compte) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Panier (/panier) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Achat Panier (Stripe) | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Client Premium** | | | | | |
| Premium Paywall | ❌ | ✅ | ✅ | ✅ | ✅ |
| Dashboard Premium | ❌ | ❌ | ✅ | ✅ | ✅ |
| Réglages Premium | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Pêcheur** | | | | | |
| Devenir Pêcheur | ✅ | ✅ | ✅ | ✅ | ✅ |
| Paiement Pêcheur | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard Pêcheur | ❌ | ❌ | ❌ | ✅ | ✅ |
| Créer Arrivage | ❌ | ❌ | ❌ | ✅ | ✅ |
| Modifier Arrivage | ❌ | ❌ | ❌ | ✅ (own) | ✅ |
| Dupliquer Arrivage | ❌ | ❌ | ❌ | ✅ (own) | ✅ |
| Modifier Profil Pêcheur | ❌ | ❌ | ❌ | ✅ (own) | ✅ |
| Gérer Points de Vente | ❌ | ❌ | ❌ | ✅ (own) | ✅ |
| Contacts Clients | ❌ | ❌ | ❌ | ✅ (own) | ✅ |
| IA du Marin | ❌ | ❌ | ❌ | ✅ | ✅ |
| Support Admin | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Admin** | | | | | |
| Dashboard Admin | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🗄️ Accès Base de Données par Rôle

### Tables Publiques (Lecture Anonyme)

| Table | Visitor | User | Premium | Fisherman | Admin |
|-------|---------|------|---------|-----------|-------|
| `ports` | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| `species` | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| `zones_peche` | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| `zones_especes` | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| `recipes` | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| `recipe_ingredients` | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| `recipe_species` | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| `client_baskets` | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| `public_fishermen` (vue) | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |

**Légende** : 👁️ = Lecture seule, ✏️ = Lecture + Écriture, 🔒 = Aucun accès

---

### Tables Arrivages (Accès Progressif)

| Table | Visitor | User | Premium | Fisherman | Admin |
|-------|---------|------|---------|-----------|-------|
| **drops** | | | | | |
| - Public (après public_visible_at) | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| - Premium (après visible_at) | 🔒 | 🔒 | 👁️ | 👁️ | 👁️ |
| - Own drops | 🔒 | 🔒 | 🔒 | ✏️ | 👁️ |
| - All drops | 🔒 | 🔒 | 🔒 | 🔒 | ✏️ |
| **drop_species** | | | | | |
| - Public | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| - Premium window | 🔒 | 🔒 | 👁️ | 👁️ | 👁️ |
| - Own | 🔒 | 🔒 | 🔒 | ✏️ | ✏️ |
| **drop_photos** | | | | | |
| - Public | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| - Own | 🔒 | 🔒 | 🔒 | ✏️ | ✏️ |
| **offers** | | | | | |
| - Public | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| - Premium window | 🔒 | 🔒 | 👁️ | 👁️ | 👁️ |
| - Own | 🔒 | 🔒 | 🔒 | ✏️ | ✏️ |
| **offer_photos** | | | | | |
| - Public | 👁️ | 👁️ | 👁️ | 👁️ | 👁️ |
| - Own | 🔒 | 🔒 | 🔒 | ✏️ | ✏️ |

---

### Tables Utilisateur (Données Personnelles)

| Table | Visitor | User | Premium | Fisherman | Admin |
|-------|---------|------|---------|-----------|-------|
| **profiles** | 🔒 | ✏️ (own) | ✏️ (own) | ✏️ (own) | 👁️ |
| **user_roles** | 🔒 | 👁️ (own) | 👁️ (own) | 👁️ (own) | ✏️ |
| **notifications** | 🔒 | ✏️ (own) | ✏️ (own) | ✏️ (own) | ✏️ |
| **push_subscriptions** | 🔒 | ✏️ (own) | ✏️ (own) | ✏️ (own) | 🔒 |
| **follow_ports** | 🔒 | ✏️ (own) | ✏️ (own) | ✏️ (own) | 👁️ |
| **follow_species** | 🔒 | ✏️ (own) | ✏️ (own) | ✏️ (own) | 👁️ |
| **basket_orders** | 🔒 | ✏️ (own) | ✏️ (own) | 👁️ (if fisherman) | 👁️ |
| **payments** | 🔒 | 👁️ (own) | 👁️ (own) | 👁️ (own) | 👁️ |

---

### Tables Pêcheur (Données Professionnelles)

| Table | Visitor | User | Premium | Fisherman | Admin |
|-------|---------|------|---------|-----------|-------|
| **fishermen** | 🔒 | 🔒 | 🔒 | ✏️ (own) | ✏️ |
| **fishermen_species** | 🔒 | 🔒 | 🔒 | ✏️ (own) | ✏️ |
| **fisherman_sale_points** | 🔒 | 🔒 | 🔒 | ✏️ (own) | ✏️ |
| **fishermen_contacts** | 🔒 | 🔒 | 🔒 | ✏️ (own) | 👁️ |
| **fishermen_messages** | 🔒 | 🔒 | 🔒 | ✏️ (own) | 👁️ |
| **fishermen_followers** | 🔒 | ✏️ (create) | ✏️ (create) | 👁️ (own followers) | 👁️ |
| **fishermen_sms_usage** | 🔒 | 🔒 | 🔒 | 👁️ (own) | 👁️ |
| **fishermen_sms_packs** | 🔒 | 🔒 | 🔒 | 👁️ (own) | 👁️ |
| **drop_templates** | 🔒 | 🔒 | 🔒 | ✏️ (own) | 🔒 |
| **fishermen_species_presets** | 🔒 | 🔒 | 🔒 | ✏️ (own) | 🔒 |
| **ai_conversations** | 🔒 | 🔒 | 🔒 | ✏️ (own) | 👁️ |
| **secure_edit_tokens** | 🔒 | 🔒 | 🔒 | 🔒 | ✏️ |
| **profile_edit_logs** | 🔒 | 🔒 | 🔒 | 👁️ (own) | 👁️ |
| **support_requests** | 🔒 | 🔒 | 🔒 | ✏️ (own) | ✏️ |

---

### Tables Admin Only

| Table | Visitor | User | Premium | Fisherman | Admin |
|-------|---------|------|---------|-----------|-------|
| **audits** | 🔒 | 🔒 | 🔒 | 🔒 | 👁️ |
| **fisherman_whitelist** | 🔒 | 🔒 | 🔒 | 🔒 | ✏️ |
| **request_type_definitions** | 🔒 | 🔒 | 🔒 | 🔒 | ✏️ |

---

## 🔄 Flux d'Attribution des Rôles

### 1. Visiteur → Client Standard (`user`)

```
1. Visiteur accède à /auth
2. S'inscrit avec email + mot de passe ou Google OAuth
3. Supabase Auth crée compte dans auth.users
4. Trigger auto-création : INSERT INTO user_roles (user_id, role) VALUES (new_user_id, 'user')
5. Redirection vers /dashboard/user
```

**Condition** : Inscription email validée (si `auto_confirm_email = false` en prod).

---

### 2. Client Standard → Client Premium (`premium`)

```
1. User accède à /premium/paywall
2. Choisit plan (Mensuel 2,50€ ou Annuel 25€)
3. Clique "S'abonner" → POST /create-checkout { priceId }
4. Stripe Checkout Session ouverte
5. Paiement réussi → Stripe envoie webhook "checkout.session.completed"
6. stripe-webhook traite événement :
   - INSERT INTO payments (user_id, plan: 'premium_annual', status: 'active')
   - INSERT INTO user_roles (user_id, role: 'premium') ON CONFLICT DO NOTHING
   - Appelle send-premium-welcome-email (avec x-internal-secret)
7. Redirection /premium/success
8. User redirigé vers /premium/reglages (configuration ports/espèces)
```

**Condition** : Abonnement Stripe actif (`status = 'active'` dans `payments` table).

**Révocation** : Webhook `customer.subscription.deleted` → DELETE FROM user_roles WHERE role = 'premium'.

---

### 3. Visiteur/User → Pêcheur (`fisherman`)

```
1. User accède à /devenir-pecheur
2. Clique "Rejoindre" → Redirection /pecheur/payment
3. Choisit plan (Basic 99€ ou Pro 199€)
4. Clique "Payer" → POST /create-fisherman-payment { priceId, plan: 'basic' }
5. Stripe Checkout Session ouverte
6. Paiement réussi → Stripe envoie webhook "checkout.session.completed"
7. stripe-webhook traite événement :
   - INSERT INTO payments (user_id, plan: 'fisherman_basic', status: 'active')
   - INSERT INTO user_roles (user_id, role: 'fisherman') ON CONFLICT DO NOTHING
   - INSERT INTO fishermen (user_id, onboarding_payment_status: 'paid', ...)
   - Appelle approve-fisherman-access (validation admin + email)
8. Redirection /pecheur/payment-success
9. Redirection /pecheur/onboarding (formulaire 6 étapes)
10. Pêcheur complète onboarding → UPDATE fishermen SET onboarding_step = 6, verified_at = now()
11. Trigger auto_assign_fisherman_role confirme rôle fisherman
12. Redirection /dashboard/pecheur
```

**Condition** : 
- Abonnement Stripe actif
- `fishermen.onboarding_payment_status = 'paid'`
- `fishermen.verified_at IS NOT NULL` (après validation admin ou auto-validation)

**Whitelist Bypass** : Si email présent dans `fisherman_whitelist` table, accès immédiat sans paiement.

---

### 4. Attribution Rôle Admin (`admin`)

**Méthode Manuelle** : Via fonction SQL admin uniquement.

```sql
-- Exécuter en tant que postgres ou service_role
SELECT add_test_user_role('admin@quaidirect.fr', 'admin'::app_role);
```

**Pas d'auto-attribution** : Aucun flux automatique ne donne le rôle admin. Doit être assigné manuellement par un super-admin existant ou via console Supabase.

---

## 🔐 Vérifications Frontend vs Backend

### Frontend (Routes Protégées)

**Fichier** : `src/lib/authRedirect.ts`

```typescript
export function getRedirectPathByRole(roles: string[]): string {
  if (roles.includes('admin')) return '/admin';
  if (roles.includes('fisherman')) return '/dashboard/pecheur';
  if (roles.includes('premium')) return '/premium/dashboard';
  if (roles.includes('user')) return '/dashboard/user';
  return '/';
}
```

**Usage** : Après login, l'utilisateur est redirigé vers le dashboard correspondant à son rôle le plus élevé.

---

**Composant** : `ProtectedFisherRoute.tsx`

```typescript
const ProtectedFisherRoute = ({ children }) => {
  const { user } = useAuth();
  const [isPaid, setIsPaid] = useState(null);
  
  useEffect(() => {
    // 1. Check whitelist
    const { data: whitelistData } = await supabase
      .from('fisherman_whitelist')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();
    
    if (whitelistData) {
      setIsPaid(true);
      return;
    }
    
    // 2. Check payment status
    const { data } = await supabase
      .from('fishermen')
      .select('onboarding_payment_status')
      .eq('user_id', user.id)
      .maybeSingle();
    
    setIsPaid(data?.onboarding_payment_status === 'paid');
  }, [user]);
  
  if (!user) return <Navigate to="/auth" />;
  if (isPaid === false) return <Navigate to="/pecheur/payment" />;
  
  return <>{children}</>;
};
```

**Protection** : Vérifie paiement pêcheur ou présence whitelist avant accès routes pêcheurs.

---

### Backend (RLS Policies)

**Exemple** : Table `drops` - Accès progressif selon rôle

```sql
-- Policy 1: Visiteurs anonymes (public window)
CREATE POLICY "Anonymous visitors can view published drops"
  ON drops FOR SELECT
  USING (
    status IN ('scheduled', 'landed')
    AND now() >= COALESCE(public_visible_at, visible_at + INTERVAL '30 minutes')
  );

-- Policy 2: Premium users (30 min early access)
CREATE POLICY "Premium users can view drops from visible_at"
  ON drops FOR SELECT
  USING (
    has_role(auth.uid(), 'premium')
    AND now() >= visible_at
  );

-- Policy 3: Fishermen (own drops)
CREATE POLICY "Fishermen can view their own drops"
  ON drops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fishermen
      WHERE fishermen.id = drops.fisherman_id
        AND fishermen.user_id = auth.uid()
    )
  );

-- Policy 4: Admin (all drops)
CREATE POLICY "Admins can view all drops"
  ON drops FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

**Protection** : RLS enforce au niveau PostgreSQL, impossible de bypass côté frontend.

---

## 🛡️ Failles de Sécurité Corrigées

### 1. ✅ Emails Hardcodés dans ProtectedFisherRoute

**Problème Initial** :
```typescript
const FISHERMAN_WHITELIST = [
  'email1@example.com',
  'email2@example.com'
];
```

**Correction** :
- Migration vers table `fisherman_whitelist` en base de données
- Query dynamique au lieu de liste hardcodée
- Modification whitelist sans redéploiement

---

### 2. ✅ RLS Policies Manquantes sur Tables Sensibles

**Tables Corrigées** :
- `profiles` : Ajout policy users can view/update own
- `fishermen_contacts` : Ajout policy fishermen only own
- `fishermen_messages` : Ajout policy fishermen only own
- `ai_conversations` : Ajout policy fishermen only own
- `basket_orders` : Ajout policy users view own, fishermen view their orders
- `payments` : Ajout policy users view own
- `zones_peche`, `zones_especes` : Ajout policies public read

---

### 3. ✅ Vue `public_fishermen` Exposant PII

**Problème Initial** : Vue exposait email, téléphone, adresse, SIRET

**Correction** : Vue restreinte aux colonnes publiques uniquement :
```sql
CREATE OR REPLACE VIEW public_fishermen AS
SELECT
  id, user_id, boat_name, boat_registration, company_name,
  bio, description, generated_description, 
  photo_url, photo_boat_1, photo_boat_2, photo_dock_sale,
  fishing_methods, fishing_zones, fishing_zones_geojson, main_fishing_zone,
  slug, default_time_slot, display_name_preference,
  passion_quote, work_philosophy, years_experience,
  website_url, instagram_url, facebook_url,
  seo_title, seo_meta_description, seo_keywords, seo_long_content,
  seo_hours_location, seo_how_to_order,
  verified_at, is_ambassador, ambassador_slot,
  default_sale_point_id, zone_id,
  created_at, updated_at, seo_enriched_at
FROM fishermen;
-- Exclus: email, phone, address, postal_code, city, siret, license_number
```

---

### 4. ✅ Admin Verification sur approve-fisherman-access

**Ajout** : Vérification rôle admin avant approbation pêcheur

```typescript
// approve-fisherman-access/index.ts
const { data: roles } = await supabaseClient
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id);

const isAdmin = roles?.some(r => r.role === 'admin');

if (!isAdmin) {
  return new Response(JSON.stringify({ error: 'Unauthorized: Admin only' }), {
    status: 403,
    headers: corsHeaders
  });
}
```

---

## 📊 Statistiques Autorisations

- **Rôles Totaux** : 5 rôles (visitor, user, premium, fisherman, admin)
- **Tables avec RLS** : 45/45 (100%)
- **Policies RLS Totales** : 152 policies
- **Fonctions RLS** : 1 fonction (`has_role()`)
- **Routes Protégées** : 21 routes nécessitant auth
- **Edge Functions avec Auth** : 22/28 (79%) nécessitent `verify_jwt = true`

---

**Prochaine Section** : [Inventaire Fonctionnalités](./05_inventaire_fonctionnalites_onglets_liens.md)
