# Scripts de Nettoyage - QuaiDirect

> **Date**: 2025-12-08  
> **Statut**: Guide d'implémentation

---

## 1. Vue d'Ensemble

Scripts de maintenance pour garder la base de données propre et performante.

| Script | Fréquence | Type | Priorité |
|--------|-----------|------|----------|
| Archivage arrivages expirés | Quotidien | CRON | Haute |
| Nettoyage contacts inactifs | Mensuel | Manuel | Moyenne |
| Purge comptes inactifs | Mensuel | Manuel | Basse |
| Export Stripe IDs | À la demande | Manuel | Moyenne |
| Nettoyage tokens expirés | Quotidien | CRON | Haute |

---

## 2. Archivage Arrivages Expirés

### 2.1 Critères

- `status` = 'scheduled' ou 'landed'
- `sale_start_time` < NOW() - INTERVAL '7 days'
- Action : UPDATE `status` = 'completed'

### 2.2 Fonction SQL (Existante)

```sql
-- Déjà implémentée : public.archive_expired_drops()
CREATE OR REPLACE FUNCTION public.archive_expired_drops()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE drops
  SET 
    status = 'completed',
    updated_at = now()
  WHERE 
    status IN ('scheduled', 'landed')
    AND (
      (sale_start_time IS NOT NULL AND sale_start_time + INTERVAL '6 hours' < now())
      OR
      (sale_start_time IS NULL AND eta_at + INTERVAL '12 hours' < now())
    );
END;
$function$;
```

### 2.3 Edge Function CRON (À Créer)

```typescript
// supabase/functions/cron-archive-drops/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Vérifier l'appel CRON
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.rpc("archive_expired_drops");

  if (error) {
    console.error("Archivage échoué:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500 
    });
  }

  console.log("Archivage terminé avec succès");
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

### 2.4 Configuration CRON

```toml
# supabase/config.toml
[functions.cron-archive-drops]
verify_jwt = false
```

Scheduler externe (Supabase Dashboard ou service tiers) :
- URL : `https://[project].supabase.co/functions/v1/cron-archive-drops`
- Fréquence : `0 3 * * *` (tous les jours à 3h)
- Header : `Authorization: Bearer [CRON_SECRET]`

---

## 3. Nettoyage Contacts Inactifs

### 3.1 Critères

- `last_contacted_at` IS NULL ou < NOW() - INTERVAL '180 days'
- `email` invalide ou bounced
- Doublons par email

### 3.2 Script SQL d'Analyse

```sql
-- Identifier contacts jamais contactés (> 6 mois depuis import)
SELECT 
  fc.id,
  fc.email,
  fc.first_name,
  fc.last_name,
  fc.fisherman_id,
  f.boat_name,
  fc.imported_at,
  fc.last_contacted_at
FROM fishermen_contacts fc
JOIN fishermen f ON f.id = fc.fisherman_id
WHERE (
  fc.last_contacted_at IS NULL 
  AND fc.imported_at < NOW() - INTERVAL '180 days'
)
OR fc.last_contacted_at < NOW() - INTERVAL '180 days'
ORDER BY fc.imported_at ASC;
```

### 3.3 Script Identification Doublons

```sql
-- Trouver doublons par email pour un même pêcheur
SELECT 
  fisherman_id,
  email,
  COUNT(*) as duplicates,
  array_agg(id) as duplicate_ids
FROM fishermen_contacts
WHERE email IS NOT NULL
GROUP BY fisherman_id, email
HAVING COUNT(*) > 1
ORDER BY duplicates DESC;
```

### 3.4 Edge Function Export

```typescript
// supabase/functions/export-inactive-contacts/index.ts
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Vérifier admin
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user?.id)
    .eq("role", "admin");

  if (!roles?.length) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const { days = 180 } = await req.json().catch(() => ({}));

  const { data: contacts, error } = await supabase
    .from("fishermen_contacts")
    .select(`
      id,
      email,
      first_name,
      last_name,
      contact_group,
      imported_at,
      last_contacted_at,
      fisherman:fishermen(boat_name)
    `)
    .or(`last_contacted_at.is.null,last_contacted_at.lt.${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()}`);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }

  // Générer CSV
  const csv = [
    "id,email,first_name,last_name,group,imported_at,last_contacted_at,fisherman",
    ...contacts.map(c => 
      `${c.id},${c.email || ""},${c.first_name || ""},${c.last_name || ""},${c.contact_group || ""},${c.imported_at || ""},${c.last_contacted_at || ""},${c.fisherman?.boat_name || ""}`
    )
  ].join("\n");

  return new Response(csv, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=inactive-contacts-${new Date().toISOString().split('T')[0]}.csv`
    }
  });
});
```

---

## 4. Purge Comptes Inactifs

### 4.1 Critères

- Dernière connexion > 365 jours
- Aucun paiement actif
- Aucun rôle premium/fisherman

### 4.2 Script SQL d'Analyse

```sql
-- Comptes potentiellement à purger
WITH inactive_users AS (
  SELECT 
    au.id,
    au.email,
    au.last_sign_in_at,
    au.created_at,
    (SELECT COUNT(*) FROM payments p WHERE p.user_id = au.id AND p.status = 'active') as active_payments,
    (SELECT array_agg(role) FROM user_roles ur WHERE ur.user_id = au.id) as roles
  FROM auth.users au
  WHERE au.last_sign_in_at < NOW() - INTERVAL '365 days'
    OR au.last_sign_in_at IS NULL
)
SELECT 
  id,
  email,
  last_sign_in_at,
  created_at,
  active_payments,
  roles
FROM inactive_users
WHERE active_payments = 0
  AND (roles IS NULL OR NOT roles && ARRAY['fisherman', 'premium', 'admin']::app_role[])
ORDER BY last_sign_in_at ASC NULLS FIRST;
```

### 4.3 Procédure de Suppression (Manuelle)

⚠️ **NE JAMAIS AUTOMATISER LA SUPPRESSION DE COMPTES**

1. Exécuter le script d'analyse
2. Exporter la liste en CSV
3. Revue manuelle par l'admin
4. Pour chaque compte à supprimer :

```sql
-- Étape 1 : Supprimer les données liées
DELETE FROM profiles WHERE id = '[USER_ID]';
DELETE FROM user_roles WHERE user_id = '[USER_ID]';
DELETE FROM notifications WHERE user_id = '[USER_ID]';
DELETE FROM push_subscriptions WHERE user_id = '[USER_ID]';
DELETE FROM follow_ports WHERE user_id = '[USER_ID]';
DELETE FROM follow_species WHERE user_id = '[USER_ID]';
DELETE FROM fishermen_followers WHERE user_id = '[USER_ID]';

-- Étape 2 : Supprimer le compte auth (via Supabase Dashboard)
-- OU via API Admin si configurée
```

---

## 5. Export Stripe IDs

### 5.1 Objectif

Exporter les `stripe_customer_id` pour nettoyage côté Stripe.

### 5.2 Script SQL

```sql
-- Stripe customers à supprimer (comptes inactifs)
SELECT 
  p.stripe_customer_id,
  p.user_id,
  au.email,
  p.status,
  p.canceled_at,
  au.last_sign_in_at
FROM payments p
JOIN auth.users au ON au.id = p.user_id
WHERE p.stripe_customer_id IS NOT NULL
  AND p.status = 'canceled'
  AND au.last_sign_in_at < NOW() - INTERVAL '365 days';
```

### 5.3 Edge Function Export

```typescript
// supabase/functions/export-stripe-ids/index.ts
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Vérifier admin
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user?.id)
    .eq("role", "admin");

  if (!roles?.length) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const { data: payments, error } = await supabase
    .from("payments")
    .select("stripe_customer_id, stripe_subscription_id, user_id, status, canceled_at")
    .not("stripe_customer_id", "is", null)
    .eq("status", "canceled");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }

  return new Response(JSON.stringify({
    count: payments.length,
    stripe_customer_ids: payments.map(p => p.stripe_customer_id),
    details: payments
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
```

---

## 6. Nettoyage Tokens Expirés

### 6.1 Critères

- `secure_edit_tokens` où `expires_at` < NOW()
- `rate_limits` où `window_start` < NOW() - INTERVAL '1 hour'

### 6.2 Fonction SQL (Existante)

```sql
-- Déjà implémentée pour rate_limits
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM rate_limits WHERE window_start < now() - INTERVAL '1 hour';
END;
$function$;
```

### 6.3 Fonction à Ajouter

```sql
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Supprimer tokens expirés et non utilisés
  DELETE FROM secure_edit_tokens 
  WHERE expires_at < now() 
    AND used_at IS NULL;
    
  -- Supprimer tokens utilisés vieux de 30 jours
  DELETE FROM secure_edit_tokens 
  WHERE used_at IS NOT NULL 
    AND used_at < now() - INTERVAL '30 days';
END;
$function$;
```

---

## 7. Nettoyage Colonnes Orphelines

### 7.1 Migration SQL

```sql
-- Migration: cleanup_orphan_columns
-- À exécuter APRÈS backup de la base

-- Supprimer colonnes jamais utilisées
ALTER TABLE fishermen DROP COLUMN IF EXISTS license_number;
ALTER TABLE fishermen DROP COLUMN IF EXISTS fishing_zones_geojson;
ALTER TABLE fishermen DROP COLUMN IF EXISTS can_edit_profile;

-- Documenter les colonnes ambiguës
COMMENT ON COLUMN fishermen.boat_registration IS 
  'Numéro d''immatriculation du bateau (ex: PLM 12345). Distinct du SIRET.';

COMMENT ON COLUMN fishermen.siret IS 
  'Numéro SIRET de l''entreprise (14 chiffres). Distinct de l''immatriculation.';
```

---

## 8. Tableau de Bord Maintenance

### 8.1 Requêtes de Monitoring

```sql
-- Vue santé de la base
SELECT 
  'Arrivages actifs' as metric,
  COUNT(*) as value
FROM drops WHERE status IN ('scheduled', 'landed')
UNION ALL
SELECT 
  'Arrivages à archiver',
  COUNT(*)
FROM drops 
WHERE status IN ('scheduled', 'landed')
  AND sale_start_time + INTERVAL '6 hours' < now()
UNION ALL
SELECT 
  'Contacts inactifs (>6 mois)',
  COUNT(*)
FROM fishermen_contacts
WHERE last_contacted_at IS NULL 
   OR last_contacted_at < NOW() - INTERVAL '180 days'
UNION ALL
SELECT 
  'Tokens expirés',
  COUNT(*)
FROM secure_edit_tokens
WHERE expires_at < now() AND used_at IS NULL
UNION ALL
SELECT 
  'Rate limits périmés',
  COUNT(*)
FROM rate_limits
WHERE window_start < now() - INTERVAL '1 hour';
```

---

## 9. Checklist Maintenance Mensuelle

- [ ] Vérifier exécution CRON archivage drops
- [ ] Exporter et analyser contacts inactifs
- [ ] Vérifier doublons contacts
- [ ] Analyser comptes inactifs (ne pas supprimer auto)
- [ ] Nettoyer tokens expirés
- [ ] Vérifier taille des tables
- [ ] Backup complet avant modifications

---

## 10. Précautions

### ⚠️ RÈGLES ABSOLUES

1. **JAMAIS de DELETE automatique sur comptes utilisateurs**
2. **TOUJOURS exporter avant de supprimer**
3. **TOUJOURS backup avant migration**
4. **TOUJOURS tester en staging d'abord**
5. **TOUJOURS garder logs des suppressions**

### 📋 Processus de Suppression

1. Identifier via requête SQL
2. Exporter en CSV
3. Revue manuelle
4. Backup des lignes concernées
5. Exécution en production
6. Vérification post-exécution
7. Archivage des logs
