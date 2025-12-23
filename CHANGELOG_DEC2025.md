# Changelog - Décembre 2024

## Résumé des Phases

Ce document récapitule les modifications majeures effectuées en décembre 2024 pour améliorer la fiabilité des notifications push et nettoyer la configuration.

---

## Phase 1 : Audit de Configuration VAPID/Firebase

### Problème Identifié
- Confusion entre les clés VAPID frontend et backend
- Difficultés de diagnostic quand les notifications ne fonctionnaient pas
- Incertitude sur quelle clé était réellement utilisée par le navigateur

### Actions Réalisées
- Analyse complète du flux de notifications (frontend → FCM → backend)
- Identification des variables d'environnement requises
- Documentation du flux de données

---

## Phase 2 : Amélioration du Diagnostic VAPID

### Fichiers Modifiés
- `src/lib/firebase.ts`
- `src/components/NotificationDiagnostic.tsx`

### Nouvelles Fonctionnalités

#### `src/lib/firebase.ts`
```typescript
// Nouvelle constante de fallback
const VAPID_PUBLIC_KEY_FALLBACK = "BFIt5LES..."

// Nouvelle fonction getVapidKey() 
// - Nettoie la valeur (supprime préfixe VITE_, quotes)
// - Utilise le fallback si la clé est invalide ou manquante
// - Retourne toujours une clé valide

// Nouvelle fonction getVapidKeyInfo()
// - Retourne des infos détaillées pour le diagnostic :
//   - rawPrefix, cleanPrefix, length, fingerprint
//   - source ("env" ou "fallback")
//   - hasVitePrefix, hasQuotes, usingFallback
```

#### `src/components/NotificationDiagnostic.tsx`
- Affichage du "fingerprint" VAPID (préfixe + longueur)
- Indication de la source ("env" ou "fallback")
- Warnings si préfixe VITE_ ou quotes détectés dans la valeur
- Logs console détaillés pour debugging

---

## Phase 3 : Système de Fallback Email

### Fichier Modifié
- `supabase/functions/send-drop-notification/index.ts`

### Comportement
1. Tente d'envoyer la notification via FCM (Firebase Cloud Messaging)
2. Si échec (pas de token, erreur réseau, quota dépassé) :
   - Envoie un email de secours via Resend
   - Log l'événement pour suivi

### Avantages
- Les utilisateurs reçoivent toujours une notification (push ou email)
- Résilience en cas de problème FCM
- Traçabilité des fallbacks pour monitoring

---

## Phase 4 : Nettoyage et Documentation

### Secrets Supprimés
| Secret | Raison |
|--------|--------|
| `API_ENTREPRISE_TOKEN` | Jamais utilisé en production, Pappers suffit |
| `PIXABAY_API_KEY` | Intégration Pixabay supprimée du code |

### Documentation Mise à Jour
- `docs/quaidirect/03_inventaire_api_keys.md` → v2.0
  - Ajout Firebase (FIREBASE_SERVICE_ACCOUNT, VITE_FIREBASE_API_KEY)
  - Ajout VITE_VAPID_PUBLIC_KEY
  - Suppression secrets obsolètes
  - Section "Système de Fallback"
  - Section "Secrets Supprimés"
  
- `docs/CONFIGURATION_CHECKLIST.md`
  - Ajout VITE_FIREBASE_API_KEY
  - Clarification sur les fallbacks hardcodés
  - Instructions Firebase Service Account
  - Diagramme architecture notifications
  - Troubleshooting étendu

---

## État Final

### Secrets Actuels (20 total)
- 14 secrets backend-only
- 6 secrets frontend (VITE_*)
- 8 critiques, 6 haute sensibilité, 1 moyenne, 5 basse

### Robustesse Notifications
- ✅ Fallback VAPID key si `VITE_VAPID_PUBLIC_KEY` manquant
- ✅ Fallback Firebase API key si `VITE_FIREBASE_API_KEY` manquant  
- ✅ Fallback email si FCM échoue
- ✅ Diagnostic détaillé sur `/compte`

### Tests Recommandés
1. Aller sur `/compte` → Diagnostic Notifications
2. Vérifier que tous les steps sont ✅ OK
3. Vérifier que la fingerprint VAPID correspond
4. Créer un arrivage test → Vérifier réception notification ou email

---

## Prochaines Étapes (Optionnelles)

- [ ] Ajouter alertes admin si trop de fallbacks email
- [ ] Dashboard de monitoring des notifications
- [ ] Test automatisé de la chaîne de notifications
- [ ] Rotation annuelle des clés VAPID
