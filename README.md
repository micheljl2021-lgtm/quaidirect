# QuaiDirect - Plateforme de vente directe pour pêcheurs artisanaux

QuaiDirect est une web-app qui permet aux marins-pêcheurs artisanaux de **vendre leur pêche en direct à quai**, en circuit ultra-court, sans intermédiaire.

## 🎯 Objectifs

- Permettre aux pêcheurs de publier leurs arrivages **en quelques secondes**
- Offrir aux clients un accès aux **paniers de poissons frais** (25€ / 45€ / 75€)
- **100% traçable**, circuit ultra-court, pêche responsable

## 🛠 Technologies utilisées

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **Paiements**: Stripe (subscriptions, one-time payments)
- **Cartographie**: Google Maps API
- **Emails**: Resend

## 📦 Installation

```bash
# Cloner le repository
git clone https://github.com/micheljl2021-lgtm/secretarit.git
cd secretarit

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

## 🔐 Variables d'environnement

Créer un fichier `.env` à la racine avec :

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Variables backend (Supabase Edge Functions)

Ces secrets sont configurés dans Supabase Dashboard :

- `STRIPE_SECRET_KEY` - Clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret du webhook Stripe
- `RESEND_API_KEY` - Clé API Resend pour les emails
- `OPENAI_API_KEY` - Clé API OpenAI (IA du Marin)
- `LOVABLE_API_KEY` - Clé API Lovable AI
- `INTERNAL_FUNCTION_SECRET` - Secret pour les appels internes

## 🧪 Tests

### Infrastructure de tests

Le projet utilise :
- **Vitest** - Framework de test
- **React Testing Library** - Tests de composants React
- **MSW** (Mock Service Worker) - Mock des API

### Lancer les tests

```bash
# Tests unitaires
npm run test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage
```

### Structure des tests

```
tests/
├── setup.ts               # Configuration globale des tests
├── utils.tsx              # Utilitaires de rendu avec providers
├── mocks/
│   ├── supabase.ts        # Mocks du client Supabase
│   └── handlers.ts        # Handlers MSW pour les API
├── components/
│   ├── ArrivageCard.test.tsx
│   ├── PhotoUpload.test.tsx
│   └── admin/
│       └── ImprovedFishermenTab.test.tsx
├── pages/
│   ├── Carte.test.tsx
│   ├── Arrivages.test.tsx
│   ├── PecheurDashboard.messaging.test.tsx
│   ├── PecheurPreferences.test.tsx
│   ├── PecheurPayment.test.tsx
│   └── PecheurPaymentSuccess.test.tsx
└── flows/                 # Tests de flux E2E
    ├── user-to-fisherman.test.tsx   # Flux User → PRO+ → Pêcheur
    ├── arrivages.test.tsx           # Arrivages standard & premium
    ├── messaging.test.tsx           # Messagerie pêcheur
    └── fisherman-preferences.test.tsx # Préférences & photos

supabase/functions/
├── send-fisherman-message/__tests__/
│   └── index.test.ts
└── stripe-webhook/__tests__/
    └── fisherman-onboarding.test.ts
```

### Tests de flux principaux

#### 1. Flux User → Pêcheur PRO+
```bash
npx vitest run tests/flows/user-to-fisherman.test.tsx
```
Teste: création compte, paiement Stripe, onboarding, validation admin.

#### 2. Arrivages (Standard & Premium)
```bash
npx vitest run tests/flows/arrivages.test.tsx
```
Teste: création arrivages, photos, affichage prix (ou "Prix sur place" si non défini).

#### 3. Messagerie
```bash
npx vitest run tests/flows/messaging.test.tsx
```
Teste: envoi aux contacts sélectionnés uniquement (jamais à tous par défaut).

#### 4. Préférences Pêcheur (Photos)
```bash
npx vitest run tests/flows/fisherman-preferences.test.tsx
```
Teste: upload, preview, suppression, persistance des photos.

### Simuler Stripe en mode TEST

1. Utiliser les clés de test Stripe (`sk_test_...`, `pk_test_...`)
2. Cartes de test :
   - Succès: `4242 4242 4242 4242`
   - Échec: `4000 0000 0000 0002`
3. Configurer le webhook en mode test vers `/functions/v1/stripe-webhook`

## 📁 Structure du projet

```
src/
├── components/           # Composants réutilisables
│   ├── ui/              # Composants shadcn/ui
│   ├── admin/           # Composants du dashboard admin
│   ├── arrivage-wizard/ # Wizard de création d'arrivage
│   └── onboarding/      # Étapes d'onboarding pêcheur
├── pages/               # Pages de l'application
├── hooks/               # Hooks React personnalisés
├── lib/                 # Utilitaires et fonctions
├── integrations/        # Intégrations (Supabase)
└── test/                # Infrastructure de tests

supabase/
├── functions/           # Edge Functions
│   ├── create-fisherman-payment/
│   ├── stripe-webhook/
│   ├── send-fisherman-message/
│   └── ...
└── config.toml          # Configuration Supabase
```

## 🚀 Fonctionnalités principales

### Côté Pêcheur
- **Création d'arrivages** (standard & premium)
- **Gestion des points de vente** (2 max par pêcheur)
- **Messagerie** vers contacts clients
- **IA du Marin** (assistant IA spécialisé)
- **Micro-site public** avec SEO optimisé

### Côté Client
- **Consultation des arrivages** sur carte et liste
- **Commande de paniers** (Découverte 25€, Famille 45€, Gourmet 75€)
- **Abonnement Premium** pour alertes prioritaires

### Côté Admin
- **Validation des pêcheurs**
- **Suivi des paiements/abonnements**
- **Gestion des demandes support**

## 💳 Flux d'abonnement Pêcheur

1. L'utilisateur choisit un plan (Basic 150€/an ou Pro 199€/an)
2. Redirection vers Stripe Checkout (30 jours d'essai)
3. Webhook Stripe → création du paiement en base
4. Redirection vers formulaire d'onboarding
5. Validation admin → accès au dashboard pêcheur

## 🔒 Sécurité

- **RLS (Row Level Security)** sur toutes les tables sensibles
- **Vérification JWT** sur les Edge Functions protégées
- **CORS** restreint aux domaines autorisés
- **Tokens sécurisés** pour les modifications de profil

## 📧 Emails transactionnels

- Bienvenue utilisateur
- Bienvenue pêcheur (après paiement)
- Rappel fin d'essai (3 jours avant)
- Confirmation de paiement
- Validation du compte pêcheur par admin
- Notifications d'arrivage

## 🗺 Cartographie

La carte interactive affiche :
- **Ports** avec arrivages actifs
- **Points de vente** des pêcheurs
- **Position utilisateur** (géolocalisation)

## 📱 PWA

L'application est installable comme PWA avec :
- Manifest.json configuré
- Service Worker pour le cache
- Icônes et splash screens

## 🤝 Contribution

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

Propriétaire - QuaiDirect © 2024

## 📞 Contact

- **CEO**: Jean-Louis Michel
- **Email**: CEO@quaidirect.fr
- **Site**: [quaidirect.fr](https://quaidirect.fr)
