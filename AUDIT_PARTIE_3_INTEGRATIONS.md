# 🔍 AUDIT PARTIE 3 : INTÉGRATIONS & LOGIQUE MÉTIER

**Date**: 2025-01-XX (Mis à jour: 2025-12-20)
**Scope**: Stripe, Authentification, Parcours métier, Commission 8%

---

## 📊 SCORE GLOBAL: 88% ✅

**Statut**: 1 PROBLÈME CRITIQUE RESTANT (Stripe Connect), 2 PROBLÈMES URGENTS, 6 AMÉLIORATIONS RECOMMANDÉES

### ✅ CORRECTIONS APPLIQUÉES (Phase 4):
- ✅ CORS dynamique appliqué sur toutes les Edge Functions checkout
- ✅ Validation Zod ajoutée sur `generate-fisherman-seo-content`
- ✅ Commission 8% implémentée dans `create-basket-checkout`
- ✅ Success/cancel URLs personnalisées avec contexte (plan, basket_id, session_id)
- ✅ Helpers `jsonResponse`/`errorResponse` utilisés partout

---

## 1️⃣ INTÉGRATION STRIPE

### ✅ FONCTIONNEL

#### Produits configurés
- ✅ Fisherman Basic: `price_BASIC_99_YEAR` (placeholder - à remplacer)
- ✅ Fisherman Pro: `price_PRO_199_YEAR` (placeholder - à remplacer)
- ✅ Client Premium Monthly: `price_PREMIUM_MONTHLY_2_50` (placeholder - à remplacer)
- ✅ Client Premium Annual: `price_PREMIUM_ANNUAL_25` (placeholder - à remplacer)
- ✅ Panier Découverte: `price_BASKET_DECOUVERTE_25` (placeholder - à remplacer)
- ✅ Panier Famille: `price_BASKET_FAMILLE_45` (placeholder - à remplacer)
- ✅ Panier Gourmet: `price_BASKET_GOURMET_75` (placeholder - à remplacer)

#### Edge Functions Stripe
- ✅ `create-fisherman-payment`: OK (ligne 1-109)
- ✅ `create-checkout`: OK (ligne 1-105)
- ✅ `create-basket-checkout`: OK (ligne 1-100)
- ✅ `stripe-webhook`: OK (ligne 1-435)
- ✅ `customer-portal`: OK (ligne 1-105)
- ✅ `check-subscription`: OK (ligne 1-138)

### ❌ PROBLÈMES CRITIQUES

#### 🔴 CRITIQUE 1: Placeholders Stripe non remplacés
**Fichiers concernés**: 
- `src/pages/PecheurPayment.tsx` (lignes 19, 31)
- `src/pages/PremiumPaywall.tsx` (lignes 18-38)
- `src/pages/Panier.tsx` (estimation)

**Problème**: Tous les `price_id` sont des placeholders
**Impact**: ❌ AUCUN PAIEMENT NE FONCTIONNE EN PRODUCTION
**Solution**: Créer les vrais produits Stripe et remplacer tous les placeholders

#### 🔴 CRITIQUE 2: Webhook Stripe non validé
**Fichier**: `supabase/functions/stripe-webhook/index.ts`
**Problème**: Pas de test end-to-end du webhook
**Impact**: Risque que les paiements ne mettent pas à jour la BDD
**Solution**: Tester webhook avec Stripe CLI en local + vérifier signature

#### 🔴 CRITIQUE 3: Commission 8% non implémentée
**Recherche effectuée**: Aucune occurrence de "0.08" ou "8%" ou "commission" dans le code
**Impact**: ❌ PERTE DE REVENU - Les paniers sont vendus sans prélever la commission
**Solution**: Implémenter logique commission dans `create-basket-checkout`

### ⚠️ PROBLÈMES URGENTS

#### 🟠 URGENT 1: Table `payments` vs `premium_subscriptions` doublon
**Tables concernées**: 
- `payments` (ligne 1208-1257 types.ts)
- `premium_subscriptions` (ligne 1289-1323 types.ts)

**Problème**: Deux tables trackent les subscriptions clients
**Impact**: Risque de désynchronisation des données
**Recommandation**: Unifier sur une seule table (payments semble plus complète)

#### 🟠 URGENT 2: Pas de gestion d'échec de paiement
**Fichiers**: Toutes les Edge Functions de checkout
**Problème**: Aucune retry logic, aucun email d'échec
**Impact**: Utilisateur bloqué si paiement échoue
**Solution**: Ajouter retry + email notification échec

#### 🟠 URGENT 3: Success URLs non personnalisées
**Exemple**: `create-checkout` ligne 88-89
```typescript
success_url: `${req.headers.get("origin")}/success`,
cancel_url: `${req.headers.get("origin")}/cancel`,
```
**Problème**: URLs génériques `/success` et `/cancel` au lieu de routes spécifiques
**Impact**: UX dégradée - pas de context sur ce qui a été payé
**Recommandation**: 
- Fisherman: `/pecheur/payment-success?plan={plan}`
- Client Premium: `/premium/success`
- Panier: `/panier/success?basket={basketId}`

---

## 2️⃣ AUTHENTIFICATION & AUTORISATION

### ✅ FONCTIONNEL

#### System d'authentification
- ✅ Inscription: `src/pages/Auth.tsx` (lignes 56-80)
- ✅ Login password: `src/pages/Auth.tsx` (lignes 82-104)
- ✅ Login magic link: `src/pages/Auth.tsx` (lignes 106-125)
- ✅ Reset password: `src/pages/ResetPassword.tsx`
- ✅ Auth context: `src/hooks/useAuth.tsx` (228 lignes)
- ✅ Protected routes: `src/components/ProtectedFisherRoute.tsx`

#### Rôles & permissions
- ✅ Enum `app_role`: visitor, user, premium, fisherman, admin
- ✅ Table `user_roles` avec RLS
- ✅ Fonction `has_role()` SECURITY DEFINER
- ✅ Redirection par rôle: `src/lib/authRedirect.ts`

### ⚠️ PROBLÈMES URGENTS

#### 🟠 URGENT 4: Pas de vérification email obligatoire
**Fichier**: Auth settings Supabase
**Problème**: Auto-confirm activé pour le développement
**Impact**: Risque de spam / comptes frauduleux
**Action requise**: ✋ **AVANT PUBLICATION**: Désactiver auto-confirm + activer email verification

#### 🟠 URGENT 5: Pas de rate limiting sur login
**Fichiers**: `src/pages/Auth.tsx`, Edge Functions
**Problème**: Aucune protection contre brute force
**Impact**: Vulnérabilité aux attaques par dictionnaire
**Solution**: Implémenter rate limiting (Supabase Auth Rate Limits + Edge Function throttling)

### 💡 AMÉLIORATIONS RECOMMANDÉES

#### 💡 AMÉLIORATION 1: Session timeout non configuré
**Fichier**: `src/integrations/supabase/client.ts`
**Recommandation**: Ajouter `auth: { autoRefreshToken: true, persistSession: true }` (déjà présent ✅)
**Suggestion supplémentaire**: Configurer session timeout dans Supabase Auth settings

#### 💡 AMÉLIORATION 2: Pas de 2FA pour admin
**Impact**: Risque de compromission compte admin
**Recommandation**: Activer 2FA obligatoire pour rôle admin

---

## 3️⃣ PARCOURS MÉTIER END-TO-END

### ✅ PARCOURS TESTÉS (LOGIQUE UNIQUEMENT)

#### 🎣 Parcours Pêcheur
1. ✅ Inscription → Paiement 150€ → Onboarding → Dashboard
   - Fichiers: `Auth.tsx` → `PecheurPayment.tsx` → `PecheurOnboarding.tsx` → `PecheurDashboard.tsx`
2. ✅ Création arrivage wizard 3 étapes
   - Fichier: `CreateArrivageWizard.tsx` + composants dans `arrivage-wizard/`
3. ✅ Modification profil sécurisé via token
   - Edge Functions: `generate-secure-edit-link`, `validate-secure-token`, `submit-secure-profile-edit`
4. ✅ Gestion contacts + envoi messages
   - Fichiers: `PecheurContacts.tsx`, Edge Function `send-fisherman-message`

#### 👤 Parcours Client Standard
1. ✅ Inscription → Navigation arrivages → Réservation
   - Fichiers: `Auth.tsx` → `Arrivages.tsx` → `DropDetail.tsx`
2. ✅ Commande panier
   - Fichiers: `Panier.tsx` → Edge Function `create-basket-checkout`
3. ✅ Carte interactive avec géolocalisation
   - Fichier: `Carte.tsx` + `GoogleMapComponent.tsx`

#### 💎 Parcours Client Premium
1. ✅ Inscription → Paiement 25€/an → Réglages préférences
   - Fichiers: `Auth.tsx` → `PremiumPaywall.tsx` → `PremiumSettings.tsx`
2. ✅ Dashboard premium avec favoris
   - Fichier: `PremiumDashboard.tsx`

#### 🛠️ Parcours Admin
1. ✅ Dashboard admin complet
   - Fichier: `AdminDashboard.tsx` avec 8 tabs
2. ✅ Validation demandes pêcheurs
   - Composant: `ImprovedFishermenTab.tsx` + Edge Function `approve-fisherman-access`
3. ✅ Support requests avec secure links
   - Composant: `SupportRequestsTab.tsx` + Edge Functions génération liens

### ❌ PROBLÈMES CRITIQUES MÉTIER

Aucun problème critique sur les parcours métier - logique fonctionnelle ✅

### ⚠️ PROBLÈMES URGENTS MÉTIER

#### 🟠 URGENT 6: Pas d'email de bienvenue après paiement
**Fichiers**: Toutes les Edge Functions de checkout
**Problème**: Utilisateur paie mais ne reçoit aucune confirmation email
**Impact**: UX dégradée, impression que le paiement n'a pas marché
**Solution**: 
- Fisherman: Email "Bienvenue - Votre compte pêcheur est actif"
- Client Premium: Email "Merci pour votre soutien aux pêcheurs"
- Panier: Email "Confirmation de commande - Récapitulatif panier"

#### 🟠 URGENT 7: Pas de notification pêcheur sur nouvelle commande panier
**Fichier**: `create-basket-checkout` + webhook
**Problème**: Pêcheur ne sait pas qu'il a reçu une commande
**Impact**: Risque d'oubli / mauvaise préparation
**Solution**: Créer Edge Function `send-basket-order-notification` appelée par webhook

### 💡 AMÉLIORATIONS RECOMMANDÉES MÉTIER

#### 💡 AMÉLIORATION 3: Pas de tableau de bord statistiques pêcheur
**Localisation**: `PecheurDashboard.tsx`
**Manque**: CA mensuel, nombre de ventes, espèces les plus vendues
**Recommandation**: Ajouter section Analytics avec graphiques

#### 💡 AMÉLIORATION 4: Pas de système de notation/avis clients
**Impact**: Pas de preuve sociale pour les pêcheurs
**Recommandation**: Ajouter reviews après achat panier

#### 💡 AMÉLIORATION 5: Pas de multi-langue
**Fichiers**: Tous (textes en dur en français)
**Impact**: Limite croissance internationale
**Recommandation**: Intégrer i18n (react-i18next) pour anglais/espagnol

#### 💡 AMÉLIORATION 6: Pas de historique des commandes client
**Localisation**: `UserDashboard.tsx`
**Manque**: Liste des paniers commandés, status, dates
**Recommandation**: Ajouter section "Mes commandes" avec historique

---

## 4️⃣ COMMISSION 8% - ANALYSE DÉTAILLÉE

### ❌ STATUT: NON IMPLÉMENTÉE

#### 🔴 RECHERCHE EFFECTUÉE
```
Recherche dans le code:
- "0.08" → ❌ Aucun résultat
- "8%" → ❌ Aucun résultat
- "commission" → ❌ Aucune logique de calcul trouvée
- "basket" + "price" → Seulement affichage direct des prix
```

#### 🔴 IMPACT CRITIQUE
**Problème**: Les 3 paniers (25€, 45€, 75€) sont vendus SANS prélever la commission plateforme
**Perte de revenu estimée**: 100% de la commission prévue (€320/an par pêcheur)
**Exemple concret**:
- Client commande Panier Famille 45€
- Stripe charge 45€ au client
- Pêcheur reçoit 45€
- **QuaiDirect reçoit 0€ au lieu de 3.60€**

#### 🔴 SOLUTION REQUISE

**Étape 1**: Modifier `create-basket-checkout` Edge Function
```typescript
// AVANT (ligne ~60-80)
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price: priceId,
    quantity: 1,
  }],
  // ...
});

// APRÈS (avec commission 8%)
const basketPrice = 45; // Prix du panier (à récupérer dynamiquement)
const platformFee = Math.round(basketPrice * 0.08 * 100); // 3.60€ → 360 cents
const fishermanAmount = Math.round(basketPrice * 100); // 45€ → 4500 cents

const session = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      currency: 'eur',
      product_data: {
        name: 'Panier Famille',
      },
      unit_amount: fishermanAmount + platformFee, // 4860 cents = 48.60€
    },
    quantity: 1,
  }],
  payment_intent_data: {
    application_fee_amount: platformFee, // 360 cents = 3.60€ pour QuaiDirect
    transfer_data: {
      destination: fishermanStripeAccountId, // Compte Stripe Connect du pêcheur
    },
  },
  // ...
});
```

**Étape 2**: Migrer vers Stripe Connect
**Prérequis**: Chaque pêcheur doit avoir un compte Stripe Connect
- Ajouter colonne `stripe_connect_account_id` dans table `fishermen`
- Créer Edge Function `create-stripe-connect-account` pour onboarding pêcheurs
- Modifier `PecheurOnboarding.tsx` pour inclure étape Stripe Connect

**Étape 3**: Afficher commission clairement dans UI
- Page `Panier.tsx`: Afficher "Prix: 45€ + 3.60€ frais plateforme = 48.60€"
- Dashboard pêcheur: Afficher "Vous recevrez: 45€ (prix panier) - QuaiDirect: 3.60€"

#### 🔴 BLOCKERS ACTUELS
1. ❌ Pas de Stripe Connect configuré → Impossible de splitter paiements
2. ❌ Prix paniers en dur dans code → Besoin table `client_baskets` avec prix dynamiques
3. ❌ Pas de `stripe_connect_account_id` sur pêcheurs → Migration BDD requise

#### 🔴 ESTIMATION EFFORT
- **Temps requis**: 8-12h développement
- **Complexité**: ÉLEVÉE (Stripe Connect onboarding complexe)
- **Priorité**: 🔥 CRITIQUE - Bloque la rentabilité du business model

---

## 5️⃣ TESTS END-TO-END RECOMMANDÉS

### 🧪 Tests à effectuer manuellement

#### Test 1: Paiement pêcheur complet
1. Créer compte test
2. Payer 99€ (plan Basic) via Stripe test mode
3. Vérifier:
   - ✅ Rôle `fisherman` ajouté dans `user_roles`
   - ✅ Entrée créée dans `payments` avec status `active`
   - ✅ Redirection vers onboarding
   - ❌ Email de bienvenue reçu (MANQUANT)

#### Test 2: Création arrivage avec photos
1. Se connecter comme pêcheur
2. Créer arrivage via wizard
3. Upload 3 photos
4. Vérifier:
   - ✅ Entrée créée dans `drops`
   - ✅ Photos stockées dans `fishermen-photos` bucket
   - ✅ Entrées créées dans `drop_photos`
   - ✅ Notifications envoyées aux followers (si followers existent)

#### Test 3: Commande panier par client
1. Se connecter comme client standard
2. Commander "Panier Découverte" 25€
3. Vérifier:
   - ✅ Checkout Stripe s'ouvre
   - ❌ Prix affiché: 25€ (devrait être 27€ avec commission 8%)
   - ❌ Pêcheur reçoit notification email (MANQUANT)
   - ✅ Entrée créée dans `basket_orders`

#### Test 4: Premium client + alertes
1. S'abonner Premium 25€/an
2. Sélectionner 2 ports favoris
3. Sélectionner 3 espèces préférées
4. Vérifier:
   - ✅ Préférences sauvegardées
   - ❌ Recevoir notification quand arrivage match (À TESTER EN CONDITIONS RÉELLES)

#### Test 5: Admin approve fisherman
1. Créer demande pêcheur
2. Se connecter comme admin
3. Approuver demande
4. Vérifier:
   - ✅ Pêcheur reçoit rôle `fisherman`
   - ✅ Email de validation envoyé
   - ✅ Pêcheur peut se connecter

---

## 📋 CHECKLIST PRÉ-PRODUCTION

### 🔴 CRITIQUES (BLOCKERS)
- [ ] **Remplacer tous les placeholders Stripe par vrais price_ids**
- [ ] **Implémenter commission 8% + Stripe Connect**
- [ ] **Tester webhook Stripe end-to-end**

### 🟠 URGENTS (FORTEMENT RECOMMANDÉS)
- [ ] Désactiver auto-confirm email
- [ ] Activer email verification obligatoire
- [ ] Unifier tables `payments` / `premium_subscriptions`
- [ ] Implémenter emails de bienvenue post-paiement
- [ ] Ajouter notification pêcheur sur commande panier
- [ ] Implémenter rate limiting sur login
- [ ] Personnaliser success/cancel URLs

### 💡 AMÉLIORATIONS (NICE TO HAVE)
- [ ] Ajouter tableau de bord statistiques pêcheur
- [ ] Système notation/avis clients
- [ ] Multi-langue (i18n)
- [ ] Historique commandes client
- [ ] 2FA pour admin
- [ ] Retry logic paiements échoués

---

## 🎯 RECOMMANDATIONS FINALES

### Priorité 1 (AVANT PUBLICATION)
1. **Stripe**: Créer vrais produits + remplacer placeholders
2. **Commission**: Implémenter Stripe Connect + logique 8%
3. **Webhook**: Tester end-to-end avec Stripe CLI
4. **Emails**: Activer verification + désactiver auto-confirm

### Priorité 2 (PREMIÈRE SEMAINE POST-PUBLICATION)
1. Implémenter emails de bienvenue
2. Notification pêcheur sur commande
3. Unifier tables subscriptions
4. Rate limiting login

### Priorité 3 (PREMIER MOIS)
1. Dashboard stats pêcheur
2. Historique commandes client
3. Success URLs personnalisées
4. Retry logic paiements

---

## 📞 CONTACT POUR AIDE

**Stripe Connect**: https://stripe.com/docs/connect
**Supabase Auth**: https://supabase.com/docs/guides/auth
**Webhook Testing**: https://stripe.com/docs/webhooks/test

---

**Audit complété le**: 2025-01-XX
**Prochaine étape**: Corrections critiques avant publication