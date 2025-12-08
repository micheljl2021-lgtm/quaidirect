# Prompt Optimisé pour GitHub Copilot - QuaiDirect

> **Date**: 2025-12-08  
> **Objectif**: Contexte complet pour continuation du développement

---

## 🎯 Contexte Projet

QuaiDirect est une web-app de vente directe de poisson frais par des marins-pêcheurs artisanaux.

**Stack technique** :
- Frontend : React 18 + TypeScript + Vite + Tailwind CSS
- Backend : Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- Paiements : Stripe (subscriptions + one-time)
- Emails : Resend
- Cartes : Google Maps API
- IA : Lovable AI Gateway (google/gemini-2.5-flash)

**URL Production** : https://quaidirect.fr

---

## 🔑 Clés API Configurées (NE PAS REDEMANDER)

Ces secrets sont déjà configurés dans Supabase :

| Secret | Service | Usage |
|--------|---------|-------|
| `STRIPE_SECRET_KEY` | Stripe | Paiements |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhooks |
| `RESEND_API_KEY` | Resend | Emails |
| `LOVABLE_API_KEY` | Lovable AI | IA Marine |
| `OPENAI_API_KEY` | OpenAI | Fallback IA |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps | Cartes frontend |
| `serveur_google_map_clee_api` | Google Maps | Géocodage backend |
| `PAPPERS_API_TOKEN` | Pappers | Validation SIRET |
| `VAPID_PUBLIC_KEY` | Web Push | Notifications push |
| `VAPID_PRIVATE_KEY` | Web Push | Notifications push |
| `SUPABASE_URL` | Supabase | API URL |
| `SUPABASE_ANON_KEY` | Supabase | Client public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Admin backend |

---

## ❌ Clés API Manquantes (À DEMANDER)

| Secret | Service | Usage | Priorité |
|--------|---------|-------|----------|
| `TWILIO_ACCOUNT_SID` | Twilio | SMS | Haute |
| `TWILIO_AUTH_TOKEN` | Twilio | SMS | Haute |
| `TWILIO_PHONE_NUMBER` | Twilio | SMS | Haute |
| `GOOGLE_CLIENT_ID` | Google OAuth | Import contacts | Moyenne |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Import contacts | Moyenne |

---

## 📁 Structure du Projet

```
src/
├── components/
│   ├── admin/           # Composants dashboard admin
│   ├── arrivage-wizard/ # Wizard création arrivage
│   ├── dashboard/       # Composants dashboard pêcheur
│   ├── onboarding/      # Steps onboarding pêcheur
│   └── ui/              # Composants shadcn/ui
├── hooks/               # Custom hooks React
├── lib/                 # Utilitaires (constants, validators)
├── pages/               # Pages React Router
└── integrations/
    └── supabase/        # Client et types Supabase

supabase/
├── config.toml          # Configuration Edge Functions
└── functions/           # 28 Edge Functions
```

---

## 🗄️ Tables Principales

| Table | Description | RLS |
|-------|-------------|-----|
| `fishermen` | Profils pêcheurs | ✅ |
| `drops` | Arrivages | ✅ |
| `offers` | Offres par arrivage | ✅ |
| `fisherman_sale_points` | Points de vente | ✅ |
| `basket_orders` | Commandes paniers | ✅ |
| `payments` | Abonnements Stripe | ✅ |
| `user_roles` | Rôles utilisateurs | ✅ |
| `fishermen_contacts` | Contacts clients | ✅ |
| `fishermen_messages` | Messages envoyés | ✅ |
| `species` | Catalogue espèces | Public |
| `ports` | Ports de pêche | Public |

---

## 👥 Rôles Utilisateurs

```typescript
type AppRole = 'visitor' | 'user' | 'premium' | 'fisherman' | 'admin';
```

| Rôle | Description | Accès |
|------|-------------|-------|
| `visitor` | Non connecté | Arrivages publics |
| `user` | Compte gratuit | Dashboard client |
| `premium` | Abonné 25€/an | Accès anticipé |
| `fisherman` | Pêcheur vérifié | Dashboard pêcheur |
| `admin` | Administrateur | Dashboard admin |

---

## 🔧 Tâches à Implémenter

### Priorité 1 : SMS Twilio

**Fichiers à créer/modifier** :
- `supabase/functions/send-sms/index.ts` (nouveau)
- `supabase/functions/send-fisherman-message/index.ts` (modifier)
- `src/components/SmsQuotaManager.tsx` (modifier)

**Logique** :
```typescript
// send-sms/index.ts
import twilio from "npm:twilio";

const client = twilio(
  Deno.env.get("TWILIO_ACCOUNT_SID"),
  Deno.env.get("TWILIO_AUTH_TOKEN")
);

await client.messages.create({
  body: message,
  from: Deno.env.get("TWILIO_PHONE_NUMBER"),
  to: recipientPhone // Format E.164 : +33612345678
});
```

**Tables concernées** :
- `fishermen_sms_usage` (quota mensuel)
- `fishermen_sms_packs` (packs achetés)

---

### Priorité 2 : Abonnement Client 3 Niveaux

**Fichiers à créer/modifier** :
- `src/pages/PremiumPaywall.tsx` (modifier)
- `supabase/functions/check-client-subscription/index.ts` (nouveau)
- Migration BDD pour `client_subscription_level` enum

**Niveaux** :
1. `follower` - Gratuit, push only
2. `premium` - 25€/an, push + email
3. `premium_plus` - 40€/an, push + email + SMS + cagnotte

---

### Priorité 3 : Import Contacts Google

**Fichiers à créer** :
- `supabase/functions/google-contacts-oauth/index.ts`
- `supabase/functions/import-google-contacts/index.ts`
- `src/components/GoogleContactsImport.tsx`

**Flow** :
1. Bouton "Importer depuis Google"
2. OAuth consent screen
3. Callback avec access_token
4. Fetch People API
5. Insérer dans `fishermen_contacts`

---

### Priorité 4 : Cagnotte SMS

**Tables à créer** :
- `sms_pool` (solde par pêcheur)
- `sms_pool_contributions` (historique)

**Edge Function** :
- `distribute-sms-pool` (CRON mensuel)

**Logique** :
- Premium+ contribue 15€/an à la cagnotte
- Réparti entre pêcheurs suivis
- Crédit utilisable pour SMS

---

### Priorité 5 : Scripts Nettoyage

**Edge Functions à créer** :
- `cron-archive-drops` (quotidien)
- `export-inactive-contacts` (admin)
- `export-stripe-ids` (admin)
- `cleanup-expired-tokens` (quotidien)

---

## 📝 Conventions de Code

### Edge Functions

```typescript
// Template standard
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Logique ici

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
```

### Composants React

```tsx
// Template standard
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const MyComponent = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("table")
        .select("*");
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="space-y-4">
      {/* Contenu */}
    </div>
  );
};
```

---

## 🎨 Design System

### Couleurs (HSL dans index.css)

```css
--primary: 217 91% 60%;      /* Bleu océan */
--secondary: 210 40% 96%;    /* Gris clair */
--accent: 24 95% 53%;        /* Orange pêche */
--destructive: 0 84% 60%;    /* Rouge alerte */
```

### Classes Tailwind Recommandées

```tsx
// Boutons
<Button variant="default">Action principale</Button>
<Button variant="outline">Action secondaire</Button>
<Button variant="destructive">Supprimer</Button>

// Cards
<Card className="p-6 space-y-4">
  <CardHeader>Titre</CardHeader>
  <CardContent>Contenu</CardContent>
</Card>

// Badges
<Badge variant="default">Actif</Badge>
<Badge variant="secondary">En attente</Badge>
```

---

## 🧪 Tests

```bash
# Lancer les tests
npm run test

# Tests spécifiques
npm run test -- --grep "ArrivageCard"
```

**Fichiers de test existants** :
- `tests/components/ArrivageCard.test.tsx`
- `tests/pages/PecheurDashboard.messaging.test.tsx`
- `tests/flows/messaging.test.tsx`

---

## 📊 Métriques Actuelles

| Domaine | Score | Objectif |
|---------|-------|----------|
| Frontend | 95% | Maintenir |
| Backend | 98% | Maintenir |
| Stripe | 95% | 100% |
| Sécurité | 90% | 95% |
| Performance | 92% | 95% |

---

## ⚠️ Points d'Attention

### Ne PAS Modifier

- `src/integrations/supabase/types.ts` (auto-généré)
- `src/integrations/supabase/client.ts` (auto-généré)
- `.env` (géré par Lovable)

### Toujours Vérifier

- RLS policies sur nouvelles tables
- CORS headers sur Edge Functions
- Rate limiting sur endpoints publics
- Validation Zod sur inputs

### Bugs Connus

1. **Webhook Stripe** : Configurer manuellement dans Stripe Dashboard
2. **Google Maps** : Restreindre API key au domaine
3. **Leaked Password Protection** : Activer dans Supabase Auth

---

## 📚 Documentation Associée

| Document | Contenu |
|----------|---------|
| `ROUTING.md` | Routes et navigation |
| `AUDIT_FORMULAIRES.md` | Mapping champs/BDD |
| `AUDIT_CHAMPS_ORPHELINS.md` | Colonnes à supprimer |
| `ABONNEMENTS_NOTIFICATIONS.md` | Modèle abonnement |
| `SCRIPTS_NETTOYAGE.md` | Scripts maintenance |
| `PRODUCTION_CHECKLIST.md` | Checklist déploiement |

---

## 🚀 Livrables Attendus

### Court Terme (1-2 semaines)

1. ✅ Intégration SMS Twilio complète
2. ✅ Edge Function `send-sms` fonctionnelle
3. ✅ UI quota SMS dans dashboard pêcheur
4. ✅ Tests unitaires SMS

### Moyen Terme (1 mois)

1. 📝 Modèle abonnement client 3 niveaux
2. 📝 Import contacts Google
3. 📝 Cagnotte SMS automatisée
4. 📝 Scripts nettoyage CRON

### Long Terme (3 mois)

1. 📋 WhatsApp Business API
2. 📋 App mobile React Native
3. 📋 Dashboard analytics avancé
4. 📋 Multi-langue (EN, ES)

---

## 💬 Prompt de Démarrage

Copier ce prompt pour initialiser GitHub Copilot :

```
Je travaille sur QuaiDirect, une app de vente directe de poisson.
Stack: React + TypeScript + Supabase + Stripe + Tailwind.

Contexte :
- 28 Edge Functions déployées
- Auth avec rôles (visitor, user, premium, fisherman, admin)
- Paiements Stripe fonctionnels
- Emails via Resend

Tâche prioritaire : Implémenter l'envoi SMS via Twilio.
Clés à configurer : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.

Tables concernées :
- fishermen_sms_usage (quota)
- fishermen_sms_packs (packs achetés)
- fishermen_messages (historique)

Fichiers à modifier :
- supabase/functions/send-fisherman-message/index.ts
- src/components/SmsQuotaManager.tsx

Merci de créer une Edge Function send-sms avec validation du quota
et intégration dans le flow de messaging existant.
```

---

## ✅ Checklist Pré-Commit

- [ ] Types TypeScript sans erreurs
- [ ] ESLint sans warnings
- [ ] Tests passent
- [ ] RLS policies vérifiées
- [ ] Edge Functions déployables
- [ ] Pas de secrets en dur
- [ ] Documentation mise à jour
