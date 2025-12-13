# Inventaire Fonctionnalités, Onglets et Liens - QuaiDirect

**Date** : 1er Décembre 2024  
**Version** : 1.0

---

## 🎯 Modules Fonctionnels

QuaiDirect est structuré en **8 modules principaux** couvrant l'ensemble du parcours utilisateur.

---

## 1. 🏠 Module Landing & Découverte

### Fonctionnalités

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Landing Page** | Page d'accueil avec mission, CTA, compteurs dynamiques | Tous | `/` |
| **Compteurs Dynamiques** | Affichage en temps réel : pêcheurs vérifiés, arrivages vendus, utilisateurs actifs | Tous | `/` (section statistiques) |
| **Testimonials** | 2 témoignages clients authentiques | Tous | `/` (section témoignages) |
| **Partnership Section** | Logo "Pêche Durable" + texte mission soutien pêcheurs artisanaux | Tous | `/` (section partenaires) |
| **CTA Principaux** | "Voir les arrivages", "Devenir pêcheur", "S'abonner Premium" | Tous | `/` (hero section) |

### Liens de Navigation

- **Header** : Logo QuaiDirect (cliquable → `/`)
- **Menu** : Arrivages, Carte, Recettes, Comment ça marche, Devenir Pêcheur
- **Footer** : CGV, Mentions Légales, Contact (CEO@quaidirect.fr), By Jean-Louis Michel

---

## 2. 🐟 Module Arrivages & Carte

### Fonctionnalités

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Liste Arrivages** | Liste publique des arrivages disponibles avec filtres | Tous | `/arrivages` |
| **Carte Interactive** | Google Maps avec marqueurs ports (bleu) et points de vente (orange) | Tous | `/carte` |
| **Géolocalisation Auto** | Centrage automatique sur position utilisateur | Tous | `/carte` (avec permission navigateur) |
| **Détail Arrivage** | Page détaillée : photos, espèces, prix, lieu/heure retrait, notes | Tous | `/arrivage/:id` |
| **Profil Pêcheur Public** | Micro-site SEO avec description, photos, arrivages, réseaux sociaux | Tous | `/boutique/:slug` |
| **Accès Progressif Premium** | Premium : 30 min early access ; Public : après `public_visible_at` | Premium vs Tous | N/A (logique RLS) |

### Composants Clés

- **UnifiedArrivalCard.tsx** : Carte arrivage standardisée (photo, espèces, prix, lieu, stock, CTA)
- **GoogleMapComponent.tsx** : Carte Google Maps avec marqueurs personnalisés
- **PhotoCarousel.tsx** : Carrousel photos arrivages

### Liens

- Header → "Arrivages" (`/arrivages`)
- Header → "Carte" (`/carte`)
- Landing → "Voir les arrivages" (CTA) → `/arrivages`

---

## 3. 🛒 Module Paniers & Paiements Clients

### Fonctionnalités

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Page Paniers** | 3 paniers standardisés : Découverte 25€, Famille 45€, Gourmet 75€ | Tous | `/panier` |
| **Checkout Stripe** | Paiement one-time avec commission 8% (ex: 45€ → client paie 48,60€) | User+ | Edge Function `create-basket-checkout` |
| **Formulaire Commande** | Sélection pêcheur, drop, lieu/heure retrait, notes spéciales | User+ | `/panier` (modal) |
| **Confirmation Commande** | Page de succès avec récap, lieu/heure retrait, QR code (futur) | User+ | `/panier/success` |
| **Notification Pêcheur** | Email automatique au pêcheur lors de nouvelle commande | Fisherman | Edge Function `send-basket-order-notification` |

### Produits Stripe

| Panier | Price ID | Prix Panier | Commission (8%) | Prix Total Client |
|--------|----------|-------------|-----------------|-------------------|
| Découverte | `price_1SYEYvH0VhS1yyE0l4DkD2PG` | 25€ | 2€ | 27€ |
| Famille | `price_1SYEZ9H0VhS1yyE0OFQzbTZG` | 45€ | 3,60€ | 48,60€ |
| Gourmet | `price_1SYEZJH0VhS1yyE04442C45I` | 75€ | 6€ | 81€ |

### Liens

- Header → "Panier" (futur) ou Landing CTA
- Footer → "Panier" (si implémenté)

---

## 4. 👤 Module Client Standard & Premium

### 4.1 Client Standard (`user`)

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Dashboard Client** | Vue d'ensemble : commandes en cours, historique, profil | User+ | `/dashboard/user` |
| **Mon Compte** | Gestion profil, email, mot de passe, abonnements | User+ | `/compte` |
| **Historique Commandes** | Liste commandes paniers avec statut (paid, completed, refunded) | User+ | `/dashboard/user` (onglet) |

### 4.2 Client Premium (`premium`)

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Premium Paywall** | Page abonnement : 2 plans (Mensuel 2,50€, Annuel 25€, Premium+ 4€/40€) | User | `/premium/paywall` |
| **Checkout Premium** | Paiement récurrent Stripe | User | Edge Function `create-checkout` |
| **Dashboard Premium** | Vue d'ensemble : alertes actives, arrivages matchés, favoris | Premium | `/premium/dashboard` |
| **Réglages Premium** | Configuration : 2 ports favoris, espèces préférées | Premium | `/premium/reglages` |
| **Accès Prioritaire** | Visibilité arrivages 30 min avant public | Premium | N/A (RLS logic) |
| **Notifications Ciblées** | Alertes automatiques si arrivage matche ports/espèces favoris | Premium | N/A (Edge Function `send-drop-notification`) |
| **Badge Premium** | Badge visible sur profil utilisateur | Premium | Tous dashboards |
| **Email Bienvenue** | Email automatique après paiement avec lien config | Premium | Edge Function `send-premium-welcome-email` |

### Produits Stripe Premium

| Plan | Price ID | Montant | Type |
|------|----------|---------|------|
| Premium Mensuel | `price_1SZ489H0VhS1yyE0Nc9KZhy1` | 2,50€ | Mensuel |
| Premium Annuel | `price_1SZ48UH0VhS1yyE0iYmXen3H` | 25€ | Annuel |
| Premium+ Mensuel | `price_1SZ48yH0VhS1yyE0bijfw3y7` | 4€ | Mensuel |
| Premium+ Annuel | `price_1SZ49DH0VhS1yyE06HJyLC65` | 40€ | Annuel |

### Liens

- Header → "Premium" (dropdown si connecté)
- Landing → "Découvrir Premium" (CTA) → `/premium/paywall`
- Dashboard User → "Passer Premium" → `/premium/paywall`

---

## 5. 🎣 Module Pêcheur (Dashboard Complet)

### 5.1 Inscription & Onboarding

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Landing Pêcheur** | Présentation avantages, plans Basic/Pro | Tous | `/devenir-pecheur` |
| **Page Paiement** | 2 plans : Basic 99€/an, Pro 199€/an avec comparaison features | Visitor | `/pecheur/payment` |
| **Checkout Pêcheur** | Paiement annuel récurrent Stripe | Visitor | Edge Function `create-fisherman-payment` |
| **Confirmation Paiement** | Page succès avec redirection onboarding | Fisherman | `/pecheur/payment-success` |
| **Onboarding 6 Étapes** | Formulaire structuré : Société, Liens, Zones/Méthodes, Espèces, Photos, Points de vente | Fisherman | `/pecheur/onboarding` |
| **Confirmation Onboarding** | Page fin onboarding avec redirection dashboard | Fisherman | `/pecheur/onboarding/confirmation` |
| **Email Validation Admin** | Email automatique admin après paiement pour validation pêcheur | Admin | Edge Function `send-fisherman-approved-email` |

### 5.2 Dashboard Pêcheur (Hub Central)

**Route** : `/dashboard/pecheur`

| Section | Description | Lien |
|---------|-------------|------|
| **Compte Premium Actif** | Bannière statut abonnement (Basic/Pro), date renouvellement | N/A (affichage) |
| **Créer Arrivage** | Bouton principal → Wizard 3 étapes | `/pecheur/nouvel-arrivage-v2` |
| **Mes Arrivages** | Liste arrivages avec actions : Modifier, Dupliquer, Terminer | N/A (liste inline) |
| **Configurer Storefront** | Édition profil pêcheur public (description, photos, zone, socials) | `/pecheur/profil/modifier` |
| **Gérer Points de Vente** | CRUD 2 points de vente max (adresse, géocodage, carte) | `/pecheur/points-vente/modifier` |
| **Carnet Contacts** | Gestion contacts clients (import CSV, groupes, historique) | `/pecheur/contacts` |
| **IA du Marin** | Assistant IA maritime (13 domaines : météo, prix, stats, admin, etc.) | `/pecheur/ia-marin` |
| **Contacter l'Admin** | Créer demandes support avec catégories prédéfinies | `/pecheur/support` |
| **Statut Ambassadeur** | Badge + ranking si pêcheur dans top 10 premiers payants | `/pecheur/ambassadeur` |

### 5.3 Gestion Arrivages

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Wizard Création** | 3 étapes : Lieu/Horaire, Espèces/Quantités, Récapitulatif | Fisherman | `/pecheur/nouvel-arrivage-v2` |
| **Templates Rapides** | Présets espèces : Mix Grillade, Poisson Blanc, Familles | Fisherman | `/pecheur/nouvel-arrivage-v2` (Step 2) |
| **Duplicata Arrivage** | Duplication avec pré-remplissage, modification date/heure uniquement | Fisherman | `/pecheur/dupliquer-arrivage/:id` |
| **Édition Arrivage** | Modification arrivage existant (port, espèces, photos, notes) | Fisherman | `/pecheur/modifier-arrivage/:id` |
| **Upload Photos** | Upload multiple photos arrivage (fishermen-photos bucket) | Fisherman | Wizard Step 3 ou Edit |
| **Terminer Arrivage** | Changement statut `scheduled` → `completed` | Fisherman | Dashboard inline |
| **Notification Clients** | Envoi automatique notifications push followers lors création arrivage | Premium Followers | Edge Function `send-drop-notification` |

### 5.4 Gestion Contacts & Messaging

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Import Contacts CSV** | Upload fichier CSV avec colonnes : email, phone, first_name, last_name | Fisherman | `/pecheur/contacts` |
| **Groupes Contacts** | Organisation contacts par groupes personnalisés (ex: Particuliers, Restos) | Fisherman | `/pecheur/contacts` |
| **Envoi Emails Groupés** | 3 templates : Invitation initiale, Annonce arrivage, Message personnalisé | Fisherman | Dashboard inline (modal) |
| **Historique Messages** | Log tous messages envoyés (date, destinataires, type, statut) | Fisherman | `/pecheur/contacts` (onglet) |
| **Notification Admin Support** | Suivi demandes support avec statut (pending, in_progress, resolved) | Fisherman | `/pecheur/support` |

### 5.5 Édition Profil & Storefront

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Champs Éditables** | Description courte/longue, photos, zone pêche, réseaux sociaux | Fisherman | `/pecheur/profil/modifier` |
| **Champs Verrouillés** | SIRET, nom bateau, immatriculation, type de pêche (non modifiables post-validation) | Fisherman | N/A (display-only) |
| **Génération IA Description** | Bouton régénération description courte via Lovable AI | Fisherman | `/pecheur/profil/modifier` |
| **Enrichissement SEO** | Admin peut enrichir profil via `generate-fisherman-seo-content` | Admin | Edge Function (appelée depuis admin) |

### 5.6 Packs SMS Optionnels

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Affichage Quotas SMS** | Compteur SMS payés restants (paid_sms_balance) | Fisherman | Dashboard (widget) |
| **Achat Pack SMS** | 3 packs : 500 SMS (49€), 2000 (149€), 5000 (299€) | Fisherman | Edge Function `purchase-sms-pack` |
| **Checkout Pack** | Paiement one-time Stripe | Fisherman | Modal depuis dashboard |

### Produits Stripe Pêcheur

| Plan/Pack | Price ID | Montant | Type | Description |
|-----------|----------|---------|------|-------------|
| Basic | `price_1SYfUYH0VhS1yyE0d3c5GQLA` | 99€ | Annuel | Emails illimités, WhatsApp, IA textes |
| Pro | `price_1SYgOuH0VhS1yyE0XINPVQdm` | 199€ | Annuel | Basic + IA avancée, multi-points, stats, support prioritaire |
| Pack 500 SMS | Dynamique | 49€ | One-time | 500 SMS (~0,098€/SMS) |
| Pack 2000 SMS | Dynamique | 149€ | One-time | 2000 SMS (~0,0745€/SMS) |
| Pack 5000 SMS | Dynamique | 299€ | One-time | 5000 SMS (~0,0598€/SMS) |

### Liens

- Header → "Devenir Pêcheur" → `/devenir-pecheur`
- Landing → "Rejoindre" (CTA pêcheurs) → `/devenir-pecheur`
- Dashboard Pêcheur → 8 sections avec liens internes

---

## 6. 🤖 Module IA du Marin

### Fonctionnalités

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Chat Interface** | Interface conversationnelle temps réel avec streaming | Fisherman | `/pecheur/ia-marin` |
| **13 Domaines d'Expertise** | Météo, fuel, stratégie pêche, zones, copilote, admin, arrivages, carnet pêche, maintenance, sécurité, communication clients, finance, stress | Fisherman | N/A (dans chat) |
| **Quick Actions** | Boutons rapides : Météo demain, Meilleure zone aujourd'hui, Optimiser fuel | Fisherman | `/pecheur/ia-marin` |
| **Historique Conversations** | Sauvegarde conversations dans `ai_conversations` table (JSONB messages) | Fisherman | Backend auto-save |
| **Lovable AI Gateway** | Modèle unique `google/gemini-2.5-flash` via Lovable API | Fisherman | Edge Function `marine-ai-assistant` |

### Domaines IA Détaillés

1. **Météo & Marées** : Bulletins maritimes, prévisions, fenêtres favorables
2. **Gestion Carburant** : Optimisation routes, calcul conso, conseils économie
3. **Stratégie de Pêche** : Techniques (filet, ligne, casier), profondeurs, substrats
4. **Sélection Zones** : Recommandations zones selon météo/saison/quotas
5. **Copilote Temps Réel** : Assistance opérationnelle pendant sorties
6. **Admin & Réglementation** : Quotas, déclarations, paperasse obligatoire
7. **Gestion Arrivages** : Génération descriptions produits, suggestions prix
8. **Carnet de Pêche** : Analyse performances, prises historiques, statistiques
9. **Maintenance Bateau** : Guides entretien, diagnostics pannes
10. **Sécurité & Prévention** : Alertes risques, protocoles sécurité
11. **Communication Clients** : Templates emails, multilinguisme, argumentation vente
12. **Optimisation Financière** : Suggestions prix, analyse marges, stratégies tarifaires
13. **Gestion Stress & Planning** : Organisation journées, équilibre vie/travail

### Liens

- Dashboard Pêcheur → "IA du Marin" → `/pecheur/ia-marin`

---

## 7. 👨‍💼 Module Admin (8 Onglets)

### Dashboard Admin : `/admin`

| Onglet | Composant | Fonctionnalités | Rôles |
|--------|-----------|-----------------|-------|
| **Vue d'Ensemble** | OverviewTab.tsx | - Compteurs : pêcheurs vérifiés, utilisateurs, premium actifs, arrivages<br>- Graphiques activité<br>- Alertes importantes | Admin |
| **Arrivages** | ImprovedDropsTab.tsx | - Liste tous arrivages (filtre statut)<br>- Détails : pêcheur, port, espèces, dates<br>- Actions : Voir détail, Modifier, Supprimer | Admin |
| **Pêcheurs** | ImprovedFishermenTab.tsx | - Liste pêcheurs (filtre vérifiés/pendants)<br>- Validation demandes (approuver/rejeter)<br>- Enrichir profil SEO (bouton "Enrichir profil")<br>- Générer lien modification sécurisé | Admin |
| **Utilisateurs** | ImprovedUsersTab.tsx | - Liste utilisateurs avec emails, rôles, dates<br>- Filtrage par rôle<br>- Modification rôles (ajouter/retirer) | Admin |
| **Abonnements Premium** | PremiumSubscriptionsTab.tsx | - Liste abonnements premium avec statut<br>- Détails : plan, dates période, stripe_subscription_id<br>- Filtrage actifs/annulés | Admin |
| **Contacts Pêcheurs** | ContactsTab.tsx | - Liste tous contacts importés par tous pêcheurs<br>- Colonnes : email, phone, groupe, pêcheur, date import<br>- Export CSV global | Admin |
| **Demandes Support** | SupportRequestsTab.tsx | - Liste demandes support pêcheurs<br>- Filtrage par statut/catégorie<br>- Actions contextuelles :<br>  • SEND_PROFILE_EDIT_LINK → Envoyer lien modification<br>  • SEND_BILLING_PORTAL → Envoyer lien portail facturation<br>  • Generic → Répondre par email custom<br>- Changement statut (pending, in_progress, resolved) | Admin |
| **Ventes & Paniers** | SalesTab.tsx | - Liste commandes paniers (basket_orders)<br>- Détails : client, pêcheur, panier, prix, lieu/heure retrait<br>- Statut : paid, completed, refunded<br>- Filtres par statut | Admin |

### Fonctionnalités Admin Critiques

| Fonctionnalité | Description | Edge Function | Accès |
|----------------|-------------|---------------|-------|
| **Validation Pêcheur** | Approuver demande → Assigne rôle fisherman, envoie email validation | `approve-fisherman-access` | Admin only |
| **Génération Lien Sécurisé** | Créer token temporaire (24h, single-use) pour modification profil pêcheur sans auth | `generate-secure-edit-link` | Admin only |
| **Réponse Support** | Envoyer email réponse à demande support avec message custom | `send-support-response` | Admin only |
| **Lien Portail Facturation** | Générer lien Stripe Customer Portal pour gestion abonnement pêcheur | `send-billing-portal-link` | Admin only |
| **Enrichissement SEO** | Appeler IA pour générer contenu SEO profil pêcheur (title, meta, keywords, long content) | `generate-fisherman-seo-content` | Admin only |

### Liens

- Header (si admin) → "Admin" → `/admin`

---

## 8. 📖 Module Contenu & SEO

### 8.1 Recettes

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Catalogue Recettes** | Liste recettes triées par espèce, difficulté, temps | Tous | `/recettes` |
| **Détail Recette** | Affichage : ingrédients, étapes, temps, portions, photos | Tous | `/recettes/:id` |

### 8.2 Pages Légales

| Page | Contenu | Rôles | URL |
|------|---------|-------|-----|
| **CGV** | Conditions Générales de Vente (cadre légal pêche maritime, vente directe) | Tous | `/cgv` |
| **Mentions Légales** | Mentions légales complètes | Tous | `/mentions-legales` |

### 8.3 Micro-Sites Pêcheurs (SEO)

| Fonctionnalité | Description | Rôles | URL |
|----------------|-------------|-------|-----|
| **Profil Public SEO** | Page optimisée SEO :<br>- `<title>`, `<meta description>`, keywords<br>- JSON-LD structured data<br>- Contenu long généré IA<br>- Section "Comment commander"<br>- Horaires/localisation<br>- Arrivages à venir<br>- Réseaux sociaux | Tous | `/boutique/:slug` |
| **Génération Contenu IA** | Admin déclenche enrichissement SEO via Edge Function<br>→ Génère automatiquement :<br>- `seo_title`<br>- `seo_meta_description`<br>- `seo_keywords[]`<br>- `seo_long_content` (500+ mots)<br>- `seo_how_to_order` (étapes JSON)<br>- `seo_hours_location` | Admin | Edge Function `generate-fisherman-seo-content` |

### 8.4 Pages SEO Locales

| Page | Cible | URL |
|------|-------|-----|
| Poisson Frais Hyères | SEO local Hyères | `/poisson-frais-hyeres` |
| Poisson Frais Toulon | SEO local Toulon | `/poisson-frais-toulon` |
| Poisson Frais La Rochelle | SEO local La Rochelle | `/poisson-frais-la-rochelle` |

### Liens

- Header → "Recettes" → `/recettes`
- Footer → "CGV", "Mentions Légales"
- Landing → "En savoir plus" → `/comment-ca-marche`

---

## 🔗 Liens Externes

### Réseaux Sociaux (Footer)

- Facebook : `/quaidirect` (placeholder)
- Instagram : `@quaidirect` (placeholder)
- Twitter : `@quaidirect` (placeholder)

### Liens Tiers

- **Stripe Dashboard** : Géré par admin pour suivi paiements
- **Resend Dashboard** : Géré par admin pour envois emails
- **Google Cloud Console** : Géré par admin pour APIs Maps/Geocoding
- **Supabase Dashboard** : Géré par admin pour base de données

---

## 📧 CTAs Principaux par Type d'Utilisateur

### Visiteur

1. **"Voir les arrivages"** → `/arrivages` (Landing hero)
2. **"Devenir Pêcheur"** → `/devenir-pecheur` (Header + Landing)
3. **"S'inscrire"** → `/auth` (Header)

### Client Standard

1. **"Commander Panier"** → `/panier` (depuis `/arrivage/:id`)
2. **"Passer Premium"** → `/premium/paywall` (depuis `/dashboard/user`)

### Client Premium

1. **"Configurer Préférences"** → `/premium/reglages` (depuis `/premium/dashboard`)
2. **"Voir Arrivages Prioritaires"** → `/arrivages` (accès early)

### Pêcheur

1. **"Créer Arrivage"** → `/pecheur/nouvel-arrivage-v2` (Dashboard)
2. **"Gérer Contacts"** → `/pecheur/contacts` (Dashboard)
3. **"Demander IA"** → `/pecheur/ia-marin` (Dashboard)

### Admin

1. **"Valider Pêcheur"** → Inline action (ImprovedFishermenTab)
2. **"Répondre Support"** → Inline action (SupportRequestsTab)

---

## 📊 Statistiques Fonctionnalités

- **Modules Totaux** : 8 modules principaux
- **Pages Applicatives** : 47 pages
- **Onglets Admin** : 8 onglets
- **Edge Functions** : 28 fonctions
- **CTAs Globaux** : 10 CTAs principaux
- **Templates Email** : 6 types (welcome, validation, notification, support, portal, custom)
- **Domaines IA** : 13 domaines d'expertise maritime

---

**Prochaine Section** : [Inventaire Data Files](./06_inventaire_data_files.md)
