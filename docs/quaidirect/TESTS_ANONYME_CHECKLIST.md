# Plan de tests - Parcours anonyme QuaiDirect

## Objectif
Vérifier que les parcours anonymes fonctionnent correctement après les corrections.

---

## Tests manuels (Incognito / Navigation privée)

### 1. Route legacy /p/:slug
- [ ] Ouvrir `/p/test-slug` en incognito
- [ ] Vérifier que la page affiche le profil du pêcheur avec slug "test-slug"
- [ ] Vérifier que l'URL reste `/p/test-slug` (pas de redirection)
- [ ] Comparer avec `/pecheurs/test-slug` - contenu identique

### 2. Fiche pêcheur publique (email)
- [ ] Ouvrir `/pecheurs/:slug` en incognito (simuler clic depuis email)
- [ ] Vérifier que le profil s'affiche (boat_name, bio, zones, espèces)
- [ ] **Si pêcheur non-vérifié** : vérifier affichage du disclaimer "Ce profil est en cours de validation par notre équipe" ✅ IMPLÉMENTÉ
- [ ] Vérifier qu'aucune donnée sensible n'est visible (email, téléphone, SIRET, adresse)

### 3. Premium guest checkout
- [ ] Aller sur `/premium` en incognito
- [ ] Cliquer sur "S'abonner" (Premium ou Premium+)
- [ ] Vérifier que Stripe Checkout s'ouvre
- [ ] Compléter le paiement avec carte test
- [ ] Vérifier redirection vers `/premium/success?guest=true`
- [ ] Vérifier message de confirmation guest

### 4. Carte - Pas de fuite des points de vente
- [ ] Ouvrir `/carte` en incognito
- [ ] Ouvrir les DevTools (Network tab)
- [ ] Vérifier qu'aucun appel à `get-public-sale-points` n'est fait
- [ ] Vérifier qu'aucun marker "point de vente" (orange ⚓) n'apparaît
- [ ] Les arrivages (drops) doivent toujours être visibles (markers verts 🐟)
- [ ] Les ports doivent toujours être visibles

---

## Tests de non-régression (utilisateur connecté)

### 5. Pêcheur connecté
- [ ] Se connecter en tant que pêcheur
- [ ] Vérifier accès au dashboard `/dashboard/pecheur`
- [ ] Vérifier création d'arrivage fonctionnelle
- [ ] Vérifier accès aux points de vente `/pecheur/points-de-vente`

### 6. Client connecté
- [ ] Se connecter en tant que client
- [ ] Vérifier accès au dashboard `/dashboard/user`
- [ ] Vérifier panier et commandes

---

## Tests de sécurité

### 7. Origin validation (create-checkout)
- [ ] Depuis site tiers, tenter d'appeler `create-checkout` → doit retourner 403
- [ ] Console log doit afficher "SECURITY: Rejected request from unauthorized origin"
- [ ] Depuis preview Lovable (*.lovableproject.com ou *.lovable.dev) → doit fonctionner

### 8. Points de vente protégés
- [ ] En incognito sur `/carte`: aucun appel réseau à `get-public-sale-points` (Network tab)
- [ ] Tenter d'appeler `get-public-sale-points` sans auth → doit retourner 401
- [ ] Via Supabase client anonyme, vérifier que `fisherman_sale_points` retourne 0 lignes

### 9. Adresse masquée pour anonymes
- [ ] En incognito sur `/drop/:id`: adresse affichée = "Point de vente partenaire" (pas l'adresse réelle)
- [ ] Connecté sur `/drop/:id`: adresse complète visible (label + adresse)

---

## Smoke test automatisé (optionnel)

```typescript
// tests/smoke/anonymous-routes.test.ts
import { describe, it, expect } from 'vitest';

describe('Anonymous Routes', () => {
  it('/p/:slug should render FisherProfile', async () => {
    // Test that /p/test-slug resolves to FisherProfile component
  });

  it('/pecheurs/:slug should be accessible without auth', async () => {
    // Test public fisherman profile access
  });

  it('/carte should not call get-public-sale-points', async () => {
    // Verify no sale points endpoint is called
  });

  it('/premium checkout should work for guests', async () => {
    // Test guest checkout flow
  });
});
```

---

## Résultats

| Test | Statut | Date | Notes |
|------|--------|------|-------|
| 1. Route /p/:slug | ⏳ | | |
| 2. Fiche pêcheur publique | ⏳ | | Badge "profil en cours de validation" implémenté |
| 3. Premium guest checkout | ⏳ | | Origin validation étendue aux previews Lovable |
| 4. Carte sans sale points | ⏳ | | |
| 5. Pêcheur connecté | ⏳ | | |
| 6. Client connecté | ⏳ | | |
| 7. Origin validation | ⏳ | | |
| 8. Sale points protégés | ⏳ | | |
| 9. Adresse masquée anonyme | ⏳ | | |

Légende: ✅ OK | ❌ KO | ⏳ À tester

---

## Corrections implémentées (15 décembre 2025)

- ✅ Vue `public_fishermen` recréée avec `SECURITY INVOKER` (supprime warning linter)
- ✅ CORS dynamique dans `check-sms-quota` (aligné avec `create-checkout`)
- ✅ `MessagingSection.tsx` : fix `monthly_quota` + gestion Twilio non configuré
- ✅ Badge "profil en cours de validation" dans `FisherProfile.tsx`
- ✅ Fonction RPC `increment_wallet_balance` créée pour incrémentation atomique SMS
