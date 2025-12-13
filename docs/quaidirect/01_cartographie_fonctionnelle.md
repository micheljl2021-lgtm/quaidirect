# Cartographie Fonctionnelle - QuaiDirect

**Date** : 1er Décembre 2024  
**Version** : 1.0

---

## 🗺️ Architecture Générale

QuaiDirect est structuré autour de **5 types d'utilisateurs** avec des dashboards et parcours dédiés :

1. **Visiteur Anonyme** - Consultation publique des arrivages
2. **Client Standard** - Achat de paniers, consultation avancée
3. **Client Premium** - Alertes ciblées, accès prioritaire
4. **Pêcheur** - Gestion arrivages, contacts, IA du Marin
5. **Admin** - Validation pêcheurs, modération, support

---

## 📄 Inventaire Complet des Pages (30 Pages)

### Pages Publiques (Sans Authentification)

| Route | Composant | Titre | Rôles | Fonctionnalité Principale |
|-------|-----------|-------|-------|---------------------------|
| `/` | Landing.tsx | Accueil QuaiDirect | Tous | Page d'accueil avec mission, CTA, compteurs |
| `/auth` | Auth.tsx | Connexion/Inscription | Tous | Formulaire auth + Google OAuth |
| `/reset-password` | ResetPassword.tsx | Réinitialisation MDP | Tous | Réinitialiser mot de passe oublié |
| `/arrivages` | Arrivages.tsx | Arrivages Disponibles | Tous | Liste publique des arrivages actifs |
| `/carte` | Carte.tsx | Carte Interactive | Tous | Carte Google Maps avec ports et arrivages |
| `/recettes` | Recettes.tsx | Recettes de Poisson | Tous | Catalogue de recettes par espèce |
| `/recettes/:id` | RecetteDetail.tsx | Détail Recette | Tous | Détail d'une recette (ingrédients, étapes) |
| `/arrivage/:id` | DropDetail.tsx | Détail Arrivage | Tous | Détail public d'un arrivage spécifique |
| `/boutique/:slug` | FisherProfile.tsx | Profil Pêcheur Public | Tous | Micro-site SEO d'un pêcheur |
| `/comment-ca-marche` | CommentCaMarche.tsx | Comment ça marche ? | Tous | Guide d'utilisation plateforme |
| `/panier` | Panier.tsx | Paniers Disponibles | Tous | 3 paniers génériques (25€/45€/75€) |
| `/cgv` | CGV.tsx | Conditions Générales | Tous | CGV légales |
| `/mentions-legales` | MentionsLegales.tsx | Mentions Légales | Tous | Mentions légales |

### Pages Client Authentifié

| Route | Composant | Titre | Rôles | Fonctionnalité Principale |
|-------|-----------|-------|-------|---------------------------|
| `/dashboard/user` | UserDashboard.tsx | Dashboard Client | user | Commandes, historique, profil |
| `/compte` | Compte.tsx | Mon Compte | user | Gestion profil, paramètres |

### Pages Client Premium

| Route | Composant | Titre | Rôles | Fonctionnalité Principale |
|-------|-----------|-------|-------|---------------------------|
| `/premium/paywall` | PremiumPaywall.tsx | Abonnement Premium | user | Offres Premium (25€/an ou 2,50€/mois) |
| `/premium/dashboard` | PremiumDashboard.tsx | Dashboard Premium | premium | Dashboard client premium |
| `/premium/reglages` | PremiumSettings.tsx | Réglages Premium | premium | Ports favoris, espèces préférées |
| `/premium/success` | PremiumSuccess.tsx | Paiement Réussi | premium | Confirmation abonnement premium |

### Pages Pêcheur

| Route | Composant | Titre | Rôles | Fonctionnalité Principale |
|-------|-----------|-------|-------|---------------------------|
| `/devenir-pecheur` | DevenirPecheur.tsx | Devenir Pêcheur | Tous | Landing inscription pêcheur |
| `/pecheur/payment` | PecheurPayment.tsx | Abonnement Pêcheur | visitor | Plans Basic (99€) / Pro (199€) |
| `/pecheur/payment-success` | PecheurPaymentSuccess.tsx | Paiement Réussi | fisherman | Confirmation paiement pêcheur |
| `/pecheur/onboarding` | PecheurOnboarding.tsx | Onboarding Pêcheur | fisherman | Formulaire onboarding (6 étapes) |
| `/pecheur/onboarding/confirmation` | OnboardingConfirmation.tsx | Onboarding Terminé | fisherman | Confirmation fin onboarding |
| `/dashboard/pecheur` | PecheurDashboard.tsx | Dashboard Pêcheur | fisherman | Hub central pêcheur (8 sections) |
| `/pecheur/nouvel-arrivage-v2` | CreateArrivageWizard.tsx | Créer Arrivage (Wizard) | fisherman | Wizard 3 étapes création arrivage |
| `/pecheur/creer-arrivage` | CreateArrivage.tsx | Créer Arrivage (Legacy) | fisherman | Formulaire création arrivage simple |
| `/pecheur/modifier-arrivage/:id` | EditArrivage.tsx | Modifier Arrivage | fisherman | Édition arrivage existant |
| `/pecheur/dupliquer-arrivage/:id` | DuplicateArrivage.tsx | Dupliquer Arrivage | fisherman | Duplication arrivage avec pré-remplissage |
| `/pecheur/profil/modifier` | EditFisherProfile.tsx | Modifier Profil | fisherman | Édition profil pêcheur (storefront) |
| `/pecheur/points-vente/modifier` | EditSalePoints.tsx | Gérer Points de Vente | fisherman | Gestion 2 points de vente max |
| `/pecheur/contacts` | PecheurContacts.tsx | Contacts Clients | fisherman | Carnet contacts, import CSV |
| `/pecheur/preferences` | PecheurPreferences.tsx | Préférences | fisherman | Paramètres pêcheur |
| `/pecheur/support` | PecheurSupport.tsx | Support Admin | fisherman | Créer demandes support |
| `/pecheur/ia-marin` | MarineAIRefactored.tsx | IA du Marin | fisherman | Assistant IA maritime (13 domaines) |
| `/pecheur/ambassadeur` | PecheurAmbassadorStatus.tsx | Statut Ambassadeur | fisherman | Statut ambassadeur si top 10 |
| `/ambassadeur-partenaire` | AmbassadorPartner.tsx | Ambassadeur Partenaire | Tous | Page dédiée ambassadeur fondateur |

### Pages Admin

| Route | Composant | Titre | Rôles | Fonctionnalité Principale |
|-------|-----------|-------|-------|---------------------------|
| `/admin` | AdminDashboard.tsx | Dashboard Admin | admin | 8 onglets de gestion globale |

### Pages Système

| Route | Composant | Titre | Rôles | Fonctionnalité Principale |
|-------|-----------|-------|-------|---------------------------|
| `/panier/success` | PanierSuccess.tsx | Commande Réussie | user | Confirmation achat panier |
| `/secure/profile/edit` | SecureProfileEdit.tsx | Édition Sécurisée | Tous (avec token) | Modification profil via token temporaire |
| `/demo/tracabilite` | DemoTracabilite.tsx | Démo Traçabilité | Tous | Page démo traçabilité |
| `/poisson-frais-hyeres` | PoissonFraisHyeres.tsx | SEO Hyères | Tous | Landing SEO locale Hyères |
| `/poisson-frais-toulon` | PoissonFraisToulon.tsx | SEO Toulon | Tous | Landing SEO locale Toulon |
| `/poisson-frais-la-rochelle` | PoissonFraisLaRochelle.tsx | SEO La Rochelle | Tous | Landing SEO locale La Rochelle |
| `/annonce-simple` | SimpleAnnonce.tsx | Annonce Simple | fisherman | Création annonce simplifiée |
| `*` | NotFound.tsx | 404 Non Trouvé | Tous | Page d'erreur 404 |

---

## 🔐 Matrice d'Accès par Rôle

| Page | Visiteur | User | Premium | Fisherman | Admin |
|------|----------|------|---------|-----------|-------|
| Landing, Arrivages, Carte, Recettes | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auth, Reset Password | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard User, Compte | ❌ | ✅ | ✅ | ✅ | ✅ |
| Premium Pages | ❌ | Paywall | ✅ | ✅ | ✅ |
| Pêcheur Pages | ❌ | ❌ | ❌ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🚶 Parcours Utilisateurs Principaux

### 1. Parcours Client Standard → Achat Panier

```
Landing (/) 
  → Voir Arrivages (/arrivages)
  → Détail Arrivage (/arrivage/:id)
  → Choisir Panier (/panier)
  → Créer Compte (/auth)
  → Paiement Stripe
  → Confirmation (/panier/success)
```

### 2. Parcours Client → Premium

```
Landing (/)
  → Créer Compte (/auth)
  → Dashboard User (/dashboard/user)
  → Découvrir Premium (/premium/paywall)
  → Paiement Stripe
  → Confirmation (/premium/success)
  → Configurer Préférences (/premium/reglages)
  → Dashboard Premium (/premium/dashboard)
```

### 3. Parcours Pêcheur → Création Arrivage

```
Landing (/)
  → Devenir Pêcheur (/devenir-pecheur)
  → Choisir Plan (Basic/Pro) (/pecheur/payment)
  → Paiement Stripe (99€ ou 199€)
  → Confirmation (/pecheur/payment-success)
  → Onboarding 6 étapes (/pecheur/onboarding)
  → Validation Admin (backend)
  → Dashboard Pêcheur (/dashboard/pecheur)
  → Créer Arrivage Wizard (/pecheur/nouvel-arrivage-v2)
  → Publication → Notification Clients
```

### 4. Parcours Admin → Validation Pêcheur

```
Login Admin (/auth)
  → Dashboard Admin (/admin)
  → Onglet "Pêcheurs" (ImprovedFishermenTab)
  → Voir Demandes Pendantes
  → Valider Profil Pêcheur
  → Email Automatique (send-fisherman-approved-email)
  → Pêcheur reçoit accès dashboard
```

---

## 🧭 Arborescence des Menus

### Header Navigation (Tous)

```
Logo QuaiDirect (cliquable → /)
  ├─ Arrivages (/arrivages)
  ├─ Carte (/carte)
  ├─ Recettes (/recettes)
  ├─ Comment ça marche (/comment-ca-marche)
  ├─ Devenir Pêcheur (/devenir-pecheur)
  └─ [Si connecté] Mon Compte (dropdown)
      ├─ Dashboard (role-based redirect)
      ├─ Paramètres (/compte)
      └─ Déconnexion
```

### Footer Links (Tous)

```
À Propos
  ├─ Comment ça marche (/comment-ca-marche)
  ├─ Devenir Pêcheur (/devenir-pecheur)
  └─ Ambassadeur Partenaire (/ambassadeur-partenaire)

Légal
  ├─ CGV (/cgv)
  ├─ Mentions Légales (/mentions-legales)
  └─ Contact (CEO@quaidirect.fr)

By Jean-Louis Michel
```

### Dashboard Pêcheur (Fisherman Only)

```
Dashboard Pêcheur (/dashboard/pecheur)
  ├─ Créer Arrivage (/pecheur/nouvel-arrivage-v2)
  ├─ Mes Arrivages (liste avec actions)
  │   ├─ Modifier (/pecheur/modifier-arrivage/:id)
  │   ├─ Dupliquer (/pecheur/dupliquer-arrivage/:id)
  │   └─ Terminer (update status)
  ├─ Configurer Storefront (/pecheur/profil/modifier)
  ├─ Gérer Points de Vente (/pecheur/points-vente/modifier)
  ├─ Carnet Contacts (/pecheur/contacts)
  ├─ IA du Marin (/pecheur/ia-marin)
  ├─ Support Admin (/pecheur/support)
  └─ [Si ambassadeur] Statut (/pecheur/ambassadeur)
```

### Dashboard Admin (Admin Only)

```
Dashboard Admin (/admin)
  ├─ Vue d'Ensemble (OverviewTab)
  ├─ Arrivages (ImprovedDropsTab)
  ├─ Pêcheurs (ImprovedFishermenTab)
  ├─ Utilisateurs (ImprovedUsersTab)
  ├─ Abonnements Premium (PremiumSubscriptionsTab)
  ├─ Contacts Pêcheurs (ContactsTab)
  ├─ Demandes Support (SupportRequestsTab)
  └─ Ventes & Paniers (SalesTab)
```

---

## 📊 Statistiques Pages

- **Total Pages** : 47 pages (dont 30 pages applicatives principales)
- **Pages Publiques** : 13 pages
- **Pages Client** : 4 pages
- **Pages Pêcheur** : 16 pages
- **Pages Admin** : 1 page (multi-onglets)
- **Pages SEO Locales** : 3 pages
- **Routes Protégées** : 21 routes nécessitant authentification

---

## 🔄 Redirections Automatiques par Rôle

Implémenté via `src/lib/authRedirect.ts` - fonction `getRedirectPathByRole()` :

| Rôle | Redirection par Défaut |
|------|------------------------|
| `admin` | `/admin` |
| `fisherman` | `/dashboard/pecheur` |
| `premium` | `/premium/dashboard` |
| `user` | `/dashboard/user` |
| Aucun rôle | `/` (Landing) |

**Utilisation** : Après login réussi, l'utilisateur est automatiquement redirigé vers son dashboard approprié selon son rôle le plus élevé.

---

## 🎨 Composants Réutilisables Clés

- **Header.tsx** : Navigation globale avec logo cliquable
- **Footer.tsx** : Pied de page avec attribution "By Jean-Louis Michel"
- **ArrivageCard.tsx / UnifiedArrivalCard.tsx** : Cartes arrivages (homepage, dashboard, liste)
- **GoogleMapComponent.tsx** : Carte Google Maps avec marqueurs ports/sale points
- **PhotoCarousel.tsx** : Carrousel photos arrivages
- **FisherProfilePreview.tsx** : Prévisualisation profil pêcheur
- **ProtectedFisherRoute.tsx** : HOC protection routes pêcheurs avec vérification paiement

---

**Prochaine Section** : [Audit Stripe](./02_audit_stripe.md)
