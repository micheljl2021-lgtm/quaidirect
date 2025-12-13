# Routage QuaiDirect - Documentation Officielle

> **Date**: 2025-12-08  
> **Statut**: Corrigé et vérifié

---

## 1. Routes Publiques (Sans Authentification)

| Route | Composant | Description |
|-------|-----------|-------------|
| `/` | `Landing` | Page d'accueil |
| `/arrivages` | `Arrivages` | Liste des arrivages publics |
| `/carte` | `Carte` | Carte interactive des points de vente |
| `/drop/:id` | `DropDetail` | Détail d'un arrivage |
| `/panier` | `Panier` | Page des paniers à commander |
| `/panier/success` | `PanierSuccess` | Confirmation commande panier |
| `/recettes` | `Recettes` | Catalogue de recettes |
| `/recettes/:id` | `RecetteDetail` | Détail d'une recette |
| `/comment-ca-marche` | `CommentCaMarche` | Guide utilisateur |
| `/cgv` | `CGV` | Conditions générales de vente |
| `/mentions-legales` | `MentionsLegales` | Mentions légales |
| `/pecheurs/:slug` | `FisherProfile` | Profil public pêcheur |
| `/boutique/:slug` | `FisherProfile` | Alias profil pêcheur (SEO) |

### Routes SEO Locales

| Route | Composant | Description |
|-------|-----------|-------------|
| `/poisson-frais-hyeres` | `PoissonFraisHyeres` | Landing SEO Hyères |
| `/poisson-frais-toulon` | `PoissonFraisToulon` | Landing SEO Toulon |
| `/poisson-frais-la-rochelle` | `PoissonFraisLaRochelle` | Landing SEO La Rochelle |

---

## 2. Routes Authentification

| Route | Composant | Description |
|-------|-----------|-------------|
| `/auth` | `Auth` | Connexion / Inscription |
| `/reset-password` | `ResetPassword` | Réinitialisation mot de passe |
| `/secure/profile/edit` | `SecureProfileEdit` | Édition profil via token sécurisé |

---

## 3. Routes Client (Authentifié)

| Route | Composant | Rôle requis |
|-------|-----------|-------------|
| `/compte` | `Compte` | `user` |
| `/dashboard/user` | `UserDashboard` | `user` |

---

## 4. Routes Client Premium

| Route | Composant | Rôle requis |
|-------|-----------|-------------|
| `/premium` | `PremiumPaywall` | `user` |
| `/premium/success` | `PremiumSuccess` | `user` |
| `/dashboard/premium` | `PremiumDashboard` | `premium` |
| `/premium/reglages` | `PremiumSettings` | `premium` |

---

## 5. Routes Pêcheur

### Inscription & Paiement

| Route | Composant | Description |
|-------|-----------|-------------|
| `/devenir-pecheur` | `DevenirPecheur` | Landing inscription pêcheur |
| `/pecheur/payment` | `PecheurPayment` | Paiement abonnement |
| `/pecheur/payment-success` | `PecheurPaymentSuccess` | Confirmation paiement |
| `/pecheur/onboarding` | `PecheurOnboarding` | Formulaire onboarding 6 étapes |
| `/pecheur/onboarding/confirmation` | `OnboardingConfirmation` | Confirmation fin onboarding |

### Dashboard Pêcheur (Authentifié + Rôle `fisherman`)

| Route | Composant | Description |
|-------|-----------|-------------|
| `/dashboard/pecheur` | `PecheurDashboard` | Tableau de bord principal |
| `/pecheur/nouvel-arrivage` | `CreateArrivage` | Création arrivage (simple) |
| `/pecheur/nouvel-arrivage-v2` | `CreateArrivageWizard` | Création arrivage (wizard 3 étapes) |
| `/pecheur/modifier-arrivage/:dropId` | `EditArrivage` | Modification arrivage |
| `/pecheur/dupliquer-arrivage/:dropId` | `DuplicateArrivage` | Duplication arrivage |
| `/pecheur/annonce-simple` | `SimpleAnnonce` | Annonce rapide |
| `/pecheur/edit-profile` | `EditFisherProfile` | Édition profil pêcheur |
| `/pecheur/points-de-vente` | `EditSalePoints` | Gestion points de vente |
| `/pecheur/contacts` | `PecheurContacts` | Gestion contacts clients |
| `/pecheur/preferences` | `PecheurPreferences` | Préférences espèces/zones |
| `/pecheur/ia-marin` | `MarineAIRefactored` | Assistant IA du Marin |
| `/pecheur/support` | `PecheurSupport` | Support & demandes admin |

---

## 6. Routes Admin

| Route | Composant | Rôle requis |
|-------|-----------|-------------|
| `/dashboard/admin` | `AdminDashboard` | `admin` |

### Onglets Admin Dashboard

| Onglet | Composant | Description |
|--------|-----------|-------------|
| Vue d'ensemble | `OverviewTab` | Statistiques globales |
| Arrivages | `ImprovedDropsTab` | Gestion arrivages |
| Pêcheurs | `ImprovedFishermenTab` | Validation & gestion pêcheurs |
| Utilisateurs | `ImprovedUsersTab` | Gestion utilisateurs |
| Abonnements Premium | `PremiumSubscriptionsTab` | Suivi abonnements premium |
| Abonnements Pêcheurs | `FishermanSubscriptionsTab` | Suivi abonnements pêcheurs |
| Contacts | `ContactsTab` | Contacts pêcheurs (oversight) |
| Support | `SupportRequestsTab` | Demandes de support |
| Ventes & Paniers | `SalesTab` | Suivi ventes |
| Offres | `OffersTab` | Gestion offres |
| Réservations | `ReservationsTab` | Suivi réservations |

---

## 7. Routes Utilitaires

| Route | Composant | Description |
|-------|-----------|-------------|
| `/demo-tracabilite` | `DemoTracabilite` | Démo traçabilité produit |
| `*` | `NotFound` | Page 404 |

---

## 8. Corrections Appliquées

### Routes Renommées (Documentation → Code Réel)

| Documentation Ancienne | Route Réelle | Statut |
|-----------------------|--------------|--------|
| `/arrivage/:id` | `/drop/:id` | ✅ Corrigé |
| `/premium/paywall` | `/premium` | ✅ Corrigé |
| `/premium/dashboard` | `/dashboard/premium` | ✅ Corrigé |
| `/pecheur/profil/modifier` | `/pecheur/edit-profile` | ✅ Corrigé |
| `/admin` | `/dashboard/admin` | ✅ Corrigé |
| `/pecheur/dashboard` | `/dashboard/pecheur` | ✅ Corrigé |
| `/ambassadeur-partenaire` | Masqué (feature cachée) | ⚠️ |

### Redirections Configurées

| Source | Destination | Raison |
|--------|-------------|--------|
| `/boutique/:slug` | `FisherProfile` | SEO - Alias profil |

---

## 9. Protection des Routes

### Composant `ProtectedFisherRoute`

Protège les routes nécessitant le rôle `fisherman` :
- Vérifie `loading` state avant redirection
- Vérifie authentification (`user`)
- Vérifie rôle (`fisherman`)
- Vérifie paiement (`onboarding_payment_status`)
- Redirige vers `/pecheur/payment` si non payé

### Pattern de Protection Recommandé

```tsx
// Dans useEffect des pages protégées
const { user, loading } = useAuth();

useEffect(() => {
  if (loading) return; // Attendre fin du chargement
  if (!user) {
    navigate('/auth');
    return;
  }
  // Vérifications supplémentaires...
}, [user, loading, navigate]);
```

---

## 10. Arborescence Visuelle

```
/
├── (Public)
│   ├── /arrivages
│   ├── /carte
│   ├── /drop/:id
│   ├── /panier
│   ├── /recettes
│   ├── /pecheurs/:slug
│   └── /boutique/:slug
│
├── /auth
│   └── /reset-password
│
├── /dashboard
│   ├── /user (client)
│   ├── /premium (client premium)
│   ├── /pecheur (pêcheur)
│   └── /admin (administrateur)
│
├── /pecheur
│   ├── /payment
│   ├── /onboarding
│   ├── /nouvel-arrivage
│   ├── /nouvel-arrivage-v2
│   ├── /edit-profile
│   ├── /points-de-vente
│   ├── /contacts
│   ├── /preferences
│   ├── /ia-marin
│   └── /support
│
├── /premium
│   ├── /success
│   └── /reglages
│
└── (SEO)
    ├── /poisson-frais-hyeres
    ├── /poisson-frais-toulon
    └── /poisson-frais-la-rochelle
```

---

## 11. Points d'Attention

1. **Cohérence des dashboards**: Tous les dashboards utilisent le préfixe `/dashboard/`
2. **Routes pêcheur**: Toutes sous `/pecheur/` sauf le dashboard
3. **Feature cachée**: Ambassadeur désactivé dans l'UI (routes conservées en code)
4. **SEO**: Routes locales pour référencement géographique
5. **Tokens sécurisés**: `/secure/profile/edit` accessible sans auth via token temporaire
