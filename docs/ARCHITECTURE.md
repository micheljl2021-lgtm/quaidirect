# Architecture QuaiDirect

## Vue d'ensemble

QuaiDirect est une plateforme de vente directe de poisson frais reliant marins-pêcheurs artisanaux et consommateurs.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Landing │ │Arrivages│ │  Carte  │ │Dashboard│ │  Admin  │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
└───────┼──────────┼──────────┼──────────┼──────────┼────────────┘
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lovable Cloud (Supabase)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │    Auth     │ │  Database   │ │   Storage   │               │
│  │  (RLS)      │ │ (PostgreSQL)│ │  (Buckets)  │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│  ┌─────────────────────────────────────────────┐               │
│  │           Edge Functions (Deno)             │               │
│  │  - Stripe webhooks                          │               │
│  │  - Email notifications (Resend)             │               │
│  │  - AI assistant (Lovable AI)                │               │
│  └─────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
        │                                    │
        ▼                                    ▼
┌───────────────┐                  ┌───────────────┐
│    Stripe     │                  │  Google Maps  │
│  (Paiements)  │                  │     API       │
└───────────────┘                  └───────────────┘
```

## Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | React + TypeScript | 18.3 |
| Build | Vite | 5.4 |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui (Radix) | - |
| State Management | TanStack Query | 5.x |
| Routing | React Router | 6.x |
| Backend | Supabase (Lovable Cloud) | - |
| Payments | Stripe | - |
| Maps | Google Maps API | - |
| Monitoring | Sentry | 10.x |

## Structure du Projet

```
src/
├── assets/              # Images, logos
├── components/
│   ├── ui/              # Composants shadcn/ui
│   ├── admin/           # Composants admin dashboard
│   ├── arrivage-wizard/ # Wizard création arrivage
│   ├── dashboard/       # Composants dashboard pêcheur
│   └── onboarding/      # Steps onboarding pêcheur
├── hooks/               # Custom React hooks
├── integrations/
│   └── supabase/        # Client et types Supabase
├── lib/                 # Utilitaires (constants, validators)
├── pages/               # Pages/routes de l'application
└── types/               # Types TypeScript partagés

supabase/
├── config.toml          # Configuration Supabase
├── functions/           # Edge Functions (28 fonctions)
└── migrations/          # Migrations SQL

docs/                    # Documentation
tests/                   # Tests Vitest
public/                  # Assets statiques, SW, manifest
```

## Flux d'Authentification

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Visitor   │────▶│    User     │────▶│  Fisherman  │
│  (public)   │     │ (connecté)  │     │  (premium)  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │                   │                   │
      ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ - Landing   │     │ - Compte    │     │ - Dashboard │
│ - Arrivages │     │ - Panier    │     │ - Arrivages │
│ - Carte     │     │ - Premium   │     │ - Contacts  │
│ - Recettes  │     │   Dashboard │     │ - IA Marin  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Rôles Utilisateur

| Rôle | Description | Accès |
|------|-------------|-------|
| `visitor` | Non connecté | Pages publiques |
| `user` | Client connecté | Profil, commandes |
| `premium` | Client premium | Alertes prioritaires, favoris |
| `fisherman` | Pêcheur vérifié | Dashboard pêcheur complet |
| `admin` | Administrateur | Dashboard admin |

## Schéma Base de Données (Tables Principales)

```
┌──────────────────┐       ┌──────────────────┐
│     profiles     │       │    fishermen     │
├──────────────────┤       ├──────────────────┤
│ id (uuid, PK)    │       │ id (uuid, PK)    │
│ email            │       │ user_id (FK)     │
│ full_name        │       │ boat_name        │
│ phone            │       │ siret            │
│ address          │       │ fishing_methods  │
└──────────────────┘       │ zone_id (FK)     │
                           │ verified_at      │
                           └────────┬─────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
          ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
          │    drops    │  │  contacts   │  │ sale_points │
          ├─────────────┤  ├─────────────┤  ├─────────────┤
          │ id (PK)     │  │ id (PK)     │  │ id (PK)     │
          │ fisherman_id│  │ fisherman_id│  │ fisherman_id│
          │ eta_at      │  │ email       │  │ label       │
          │ sale_point  │  │ phone       │  │ address     │
          │ status      │  │ group       │  │ lat/lng     │
          └──────┬──────┘  └─────────────┘  └─────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌─────────────┐   ┌─────────────┐
│   offers    │   │ drop_photos │
├─────────────┤   ├─────────────┤
│ id (PK)     │   │ id (PK)     │
│ drop_id (FK)│   │ drop_id (FK)│
│ species_id  │   │ photo_url   │
│ unit_price  │   │ order       │
│ quantity    │   └─────────────┘
└─────────────┘
```

## Workflow Paiement Stripe

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Stripe    │     │   Backend   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ 1. Sélectionne    │                   │
       │    panier/abo     │                   │
       │───────────────────┼──────────────────▶│
       │                   │                   │
       │                   │ 2. create-checkout│
       │                   │◀──────────────────│
       │                   │                   │
       │ 3. Checkout URL   │                   │
       │◀──────────────────┼───────────────────│
       │                   │                   │
       │ 4. Paiement       │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │                   │ 5. Webhook        │
       │                   │   (checkout.      │
       │                   │    completed)     │
       │                   │──────────────────▶│
       │                   │                   │
       │                   │ 6. Update DB      │
       │                   │   - payments      │
       │                   │   - user_roles    │
       │                   │   - Send email    │
       │                   │                   │
       │ 7. Redirect       │                   │
       │   Success Page    │                   │
       │◀──────────────────┼───────────────────│
       │                   │                   │
```

### Types d'Abonnements

| Plan | Prix | Trial | Stripe Price ID |
|------|------|-------|-----------------|
| Fisherman Basic | 150€/an | 7 jours | `price_BASIC_150_YEAR` |
| Fisherman Pro | 199€/an | 7 jours | `price_PRO_199_YEAR` |
| Client Premium | 25€/an | - | `price_PREMIUM_ANNUAL_25` |
| Client Premium | 2.50€/mois | - | `price_PREMIUM_MONTHLY_2_50` |

### Paniers Client (One-time)

| Panier | Prix | Commission | Net Pêcheur |
|--------|------|------------|-------------|
| Découverte | 25€ | 6% (1.50€) | 23.50€ |
| Famille | 45€ | 6% (2.70€) | 42.30€ |
| Gourmet | 75€ | 6% (4.50€) | 70.50€ |

## Monitoring & Performance

### Sentry Integration
- Error tracking automatique
- Performance monitoring (Web Vitals)
- DSN configuré via `VITE_SENTRY_DSN`

### Optimisations Implémentées
- Code splitting avec lazy loading (15+ composants)
- React Query avec cache optimisé (5-30 min staleTime)
- Service Worker avec stratégies de cache différenciées
- Compression gzip/brotli en production
- Preconnect vers domaines critiques

## Sécurité

### Row Level Security (RLS)
Toutes les tables sensibles ont des politiques RLS :
- `profiles` : Lecture/écriture propre utilisateur
- `fishermen` : Lecture publique (vue), écriture propriétaire
- `drops` : Lecture publique, écriture pêcheur propriétaire
- `payments` : Lecture/écriture propre utilisateur

### Edge Functions Protection
- CORS restreint à `quaidirect.fr`
- `INTERNAL_FUNCTION_SECRET` pour webhooks
- Validation Zod des inputs
- Rate limiting sur endpoints critiques

## Variables d'Environnement

| Variable | Description | Source |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | URL Supabase | Auto (Lovable Cloud) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique | Auto |
| `VITE_GOOGLE_MAPS_API_KEY` | API Google Maps | Secret Lovable |
| `VITE_SENTRY_DSN` | DSN Sentry | Secret Lovable |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | Secret Lovable |
| `RESEND_API_KEY` | API Resend (emails) | Secret Lovable |
