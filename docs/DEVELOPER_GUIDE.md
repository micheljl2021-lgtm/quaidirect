# Guide Développeur QuaiDirect

## Setup Local

### Prérequis

- Node.js 18+
- npm ou bun
- Compte Lovable (pour le backend)

### Installation

```bash
# Cloner le projet (via Lovable ou GitHub)
git clone <repo-url>
cd quaidirect

# Installer les dépendances
npm install
# ou
bun install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:8080`

### Variables d'environnement

Le fichier `.env` est auto-généré par Lovable Cloud avec :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Les secrets additionnels (Stripe, Google Maps, Sentry) sont configurés via Lovable Cloud.

---

## Structure du Projet

```
quaidirect/
├── src/
│   ├── App.tsx              # Router principal
│   ├── main.tsx             # Point d'entrée (Sentry, QueryClient)
│   ├── index.css            # Variables CSS, design tokens
│   │
│   ├── pages/               # Pages/routes
│   │   ├── Landing.tsx
│   │   ├── Auth.tsx
│   │   ├── Arrivages.tsx
│   │   ├── Carte.tsx
│   │   ├── PecheurDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── ...
│   │
│   ├── components/
│   │   ├── ui/              # shadcn/ui (ne pas modifier)
│   │   ├── Header.tsx       # Navigation globale
│   │   ├── Footer.tsx
│   │   ├── ArrivageCard.tsx # Carte arrivage réutilisable
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useAuth.tsx      # Hook authentification
│   │   ├── useDebounce.ts   # Debounce pour recherche
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── constants.ts     # Constantes globales
│   │   ├── utils.ts         # Utilitaires (cn, formatDate)
│   │   ├── validators.ts    # Validation Zod
│   │   └── authRedirect.ts  # Logique redirection par rôle
│   │
│   └── integrations/
│       └── supabase/
│           ├── client.ts    # Client Supabase (auto-généré)
│           └── types.ts     # Types DB (auto-généré)
│
├── supabase/
│   ├── config.toml          # Config Supabase (auto-géré)
│   ├── functions/           # Edge Functions
│   └── migrations/          # Migrations SQL
│
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service Worker
│   └── ...
│
├── tests/                   # Tests Vitest
├── docs/                    # Documentation
└── package.json
```

---

## Conventions de Code

### Naming

| Type | Convention | Exemple |
|------|------------|---------|
| Composants | PascalCase | `ArrivageCard.tsx` |
| Hooks | camelCase, prefix `use` | `useAuth.tsx` |
| Utilitaires | camelCase | `formatPrice.ts` |
| Types/Interfaces | PascalCase | `FishermanProfile` |
| Constants | SCREAMING_SNAKE | `MAX_SALE_POINTS` |

### Imports

```typescript
// 1. React et libs externes
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Composants UI
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 3. Composants custom
import { ArrivageCard } from '@/components/ArrivageCard';

// 4. Hooks
import { useAuth } from '@/hooks/useAuth';

// 5. Utilitaires et types
import { cn } from '@/lib/utils';
import type { Drop } from '@/integrations/supabase/types';

// 6. Supabase
import { supabase } from '@/integrations/supabase/client';
```

### Styling

Utiliser **Tailwind CSS** avec les tokens du design system :

```tsx
// ✅ Correct - Utiliser les tokens
<div className="bg-background text-foreground">
  <Button variant="default">Action</Button>
</div>

// ❌ Incorrect - Couleurs hardcodées
<div className="bg-white text-black">
  <button className="bg-blue-500">Action</button>
</div>
```

Tokens disponibles dans `index.css` :
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--muted`, `--accent`
- `--destructive`, `--border`, `--ring`

---

## Patterns Courants

### Requête avec React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const useArrivages = () => {
  return useQuery({
    queryKey: ['arrivages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          *,
          fishermen:fisherman_id(boat_name, photo_url),
          offers(*, species:species_id(name))
        `)
        .eq('status', 'scheduled')
        .gte('sale_start_time', new Date().toISOString())
        .order('eta_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 secondes
  });
};
```

### Protection de route

```typescript
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const ProtectedPage = () => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return <Loader2 className="animate-spin" />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role !== 'fisherman') {
    return <Navigate to="/compte" replace />;
  }

  return <div>Contenu protégé</div>;
};
```

### Appel Edge Function

```typescript
import { supabase } from '@/integrations/supabase/client';

const sendMessage = async (data: MessageData) => {
  const { data: result, error } = await supabase.functions.invoke(
    'send-fisherman-message',
    {
      body: {
        fishermanId: data.fishermanId,
        subject: data.subject,
        body: data.body,
        templateType: 'custom',
      },
    }
  );

  if (error) throw error;
  return result;
};
```

### Toast notifications

```typescript
import { toast } from 'sonner';

// Succès
toast.success('Arrivage publié avec succès');

// Erreur
toast.error('Erreur lors de la publication');

// Info
toast.info('Chargement en cours...');

// Custom
toast('Action effectuée', {
  description: 'Détails supplémentaires',
  action: {
    label: 'Annuler',
    onClick: () => handleUndo(),
  },
});
```

---

## Tests

### Structure des tests

```
tests/
├── setup.ts              # Configuration globale
├── utils.tsx             # Helpers (render avec providers)
├── mocks/
│   ├── handlers.ts       # MSW handlers
│   └── supabase.ts       # Mock Supabase
├── components/           # Tests composants
├── pages/                # Tests pages
└── flows/                # Tests parcours utilisateur
```

### Lancer les tests

```bash
# Mode watch
npm run test

# Run once
npm run test:run

# Avec coverage
npm run test:coverage
```

### Écrire un test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../utils';
import { ArrivageCard } from '@/components/ArrivageCard';

describe('ArrivageCard', () => {
  const mockDrop = {
    id: '1',
    eta_at: '2024-01-15T08:00:00Z',
    fishermen: { boat_name: 'La Belle Étoile' },
    offers: [{ species: { name: 'Bar' }, unit_price: 25 }],
  };

  it('displays fisherman boat name', () => {
    render(<ArrivageCard drop={mockDrop} />);
    expect(screen.getByText('La Belle Étoile')).toBeInTheDocument();
  });

  it('calls onReserve when button clicked', async () => {
    const onReserve = vi.fn();
    render(<ArrivageCard drop={mockDrop} onReserve={onReserve} />);
    
    await userEvent.click(screen.getByRole('button', { name: /réserver/i }));
    expect(onReserve).toHaveBeenCalledWith(mockDrop);
  });
});
```

---

## Déploiement

### Via Lovable

1. Commit les changements dans l'éditeur Lovable
2. Le déploiement est automatique
3. Les Edge Functions sont déployées automatiquement

### Preview vs Production

- **Preview** : Chaque commit génère une preview URL
- **Production** : Publier via le bouton "Publish" dans Lovable

### Vérifications pré-production

- [ ] Tests passent (`npm run test:run`)
- [ ] Build réussit (`npm run build`)
- [ ] Variables d'environnement configurées
- [ ] Webhook Stripe configuré
- [ ] Google Maps API key restreinte au domaine

---

## Debugging

### Console navigateur

```typescript
// Activer les logs Supabase
localStorage.setItem('supabase.debug', 'true');
```

### Sentry

Erreurs capturées automatiquement. Dashboard : https://sentry.io

### Logs Edge Functions

Accessibles dans Lovable Cloud → Backend → Logs

### React Query DevTools

Inclus en mode développement. Icône en bas à droite de l'écran.

---

## Ressources

- [Documentation Lovable](https://docs.lovable.dev)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
