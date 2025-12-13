# Intégration SMS Twilio - Documentation

## Vue d'ensemble

Cette implémentation ajoute une fonctionnalité SMS complète au dashboard pêcheur de QuaiDirect, permettant :
1. **Inviter des contacts par SMS** avec un lien de signup personnalisé
2. **Envoyer des notifications d'arrivages par SMS** aux clients abonnés
3. **Gérer l'historique des SMS** depuis le dashboard
4. **Gérer des templates personnalisables** pour les messages

## Fichiers créés/modifiés

### Base de données
- `supabase/migrations/20251213051500_add_sms_messages_and_templates.sql` - Migration complète :
  - Table `sms_messages` : historique des SMS
  - Table `sms_templates` : templates personnalisables
  - Colonne `phone_verified` sur `fishermen_contacts`
  - Policies RLS et indices
  - Templates par défaut

### Edge Functions
- `supabase/functions/send-sms-invitation/index.ts` - Fonction d'envoi d'invitations SMS
- `supabase/functions/send-sms-notification/index.ts` - Fonction d'envoi de notifications d'arrivages

### Frontend
- `src/types/sms.ts` - Définitions TypeScript pour les SMS
- `src/lib/twilio.ts` - Bibliothèque utilitaire Twilio (validation, formatage, etc.)
- `src/components/PecheurSmsManager.tsx` - Composant principal de gestion SMS
- `src/pages/PecheurDashboard.tsx` - Intégration du composant SMS

### Configuration
- `.env.example` - Variables d'environnement Twilio

## Configuration requise

### 1. Variables d'environnement Supabase

Les Edge Functions nécessitent les variables suivantes dans Supabase :

```bash
TWILIO_ACCOUNT_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
SITE_URL=https://quaidirect.fr
```

**Credentials fournis dans le problème :**
- Account SID (Principal) : `SKb4b2dda560954e396bca69d783f695be`
- Account SID (Standard) : `SKbab4de40eaa0f4583dccbd0dfa2e1394`
- Auth Token Test : `04d7b1959ae234c425368cf78aecc53a`

**Configuration dans Supabase :**
1. Aller dans le Dashboard Supabase
2. Projet Settings → Edge Functions
3. Ajouter les variables d'environnement
4. Redéployer les functions

### 2. Déploiement de la migration

```bash
# Via Supabase CLI
supabase db push

# Ou via le dashboard Supabase
# SQL Editor → Copier le contenu de la migration → Run
```

### 3. Déploiement des Edge Functions

```bash
# Déployer send-sms-invitation
supabase functions deploy send-sms-invitation

# Déployer send-sms-notification
supabase functions deploy send-sms-notification
```

## Architecture

### Tables de base de données

#### `sms_messages`
Historique complet de tous les SMS envoyés.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| fisherman_id | UUID | ID du pêcheur |
| contact_id | UUID | ID du contact (nullable) |
| phone | TEXT | Numéro de téléphone |
| message | TEXT | Contenu du message |
| type | TEXT | Type : invitation, notification, custom |
| status | TEXT | Statut : pending, sent, failed, delivered |
| twilio_sid | TEXT | ID Twilio du message (nullable) |
| error | TEXT | Message d'erreur si échec (nullable) |
| created_at | TIMESTAMPTZ | Date de création |
| sent_at | TIMESTAMPTZ | Date d'envoi (nullable) |

#### `sms_templates`
Templates personnalisables par pêcheur.

| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Identifiant unique |
| fisherman_id | UUID | ID du pêcheur |
| type | TEXT | Type : invitation, notification, custom |
| name | TEXT | Nom du template |
| body | TEXT | Contenu du template |
| variables | JSONB | Variables disponibles |
| is_default | BOOLEAN | Template par défaut |
| created_at | TIMESTAMPTZ | Date de création |
| updated_at | TIMESTAMPTZ | Date de mise à jour |

### Edge Functions

#### `send-sms-invitation`
Envoie des SMS d'invitation aux contacts.

**Endpoint :** `POST /functions/v1/send-sms-invitation`

**Requête :**
```json
{
  "contact_ids": ["uuid1", "uuid2"],
  "template_id": "uuid-optional",
  "custom_message": "Message personnalisé (optional)"
}
```

**Réponse :**
```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "results": [
    {
      "phone": "+33612345678",
      "success": true,
      "sid": "SMxxxxxxxx"
    }
  ],
  "quota": {
    "free_remaining": 98,
    "paid_balance": 0,
    "total_available": 98
  }
}
```

#### `send-sms-notification`
Envoie des SMS de notification d'arrivage.

**Endpoint :** `POST /functions/v1/send-sms-notification`

**Requête :**
```json
{
  "drop_id": "uuid",
  "contact_ids": ["uuid1", "uuid2"],
  "template_id": "uuid-optional",
  "custom_message": "Message personnalisé (optional)"
}
```

**Réponse :** Identique à `send-sms-invitation`

### Fonctionnalités du composant PecheurSmsManager

#### Onglet "Envoyer SMS"
- Sélection du template de message
- Édition du message avec variables ({{signup_link}}, {{first_name}}, etc.)
- Sélection multiple des contacts
- Prévisualisation du message
- Affichage du quota disponible
- Bouton d'envoi avec compteur

#### Onglet "Historique"
- Liste des SMS envoyés
- Statut (envoyé/échoué)
- Type de SMS (invitation/notification)
- Date d'envoi
- Message d'erreur si applicable

#### Onglet "Templates"
- Liste des templates disponibles
- Templates par défaut
- Variables disponibles dans chaque template

## Workflow utilisateur

### Scénario 1 : Inviter un contact par SMS

1. Le pêcheur se connecte au dashboard
2. Va dans l'onglet "SMS"
3. Sélectionne le composant "Gestion SMS"
4. Choisit ou personnalise un message d'invitation
5. Sélectionne les contacts à inviter
6. Prévisualise le message
7. Clique sur "Envoyer"
8. Le système :
   - Vérifie le quota SMS
   - Envoie les SMS via Twilio
   - Enregistre l'historique
   - Met à jour le quota
   - Affiche le résultat

### Scénario 2 : Notifier un arrivage par SMS

1. Le pêcheur crée un arrivage
2. Option "Notifier par SMS" disponible (fonctionnalité future)
3. Ou utilise `send-sms-notification` directement
4. Le système envoie les SMS aux contacts abonnés
5. Historique enregistré

## Validation et sécurité

### Validation des numéros de téléphone
- Format international requis : `+33612345678`
- Validation via regex dans `src/lib/twilio.ts`
- Formatage automatique des numéros français

### Rate limiting
- 100 SMS gratuits/mois par pêcheur
- SMS payants disponibles après épuisement du quota
- Vérification du quota avant chaque envoi
- Compteurs mis à jour en temps réel

### Sécurité
- Authentification JWT requise
- RLS policies sur toutes les tables
- Service role pour les edge functions
- Validation des entrées
- Logging des erreurs

## Tests

### Tests manuels recommandés

1. **Validation du numéro de téléphone**
   ```typescript
   // Dans la console du navigateur
   import { validatePhoneNumber } from '@/lib/twilio';
   console.log(validatePhoneNumber('+33612345678')); // true
   console.log(validatePhoneNumber('0612345678')); // false
   ```

2. **Envoi SMS en mode test**
   - Configurer Twilio en mode test
   - Sélectionner un contact
   - Envoyer un SMS
   - Vérifier l'historique
   - Vérifier le quota

3. **Rate limiting**
   - Vérifier que le quota est respecté
   - Tester avec un pêcheur ayant épuisé son quota
   - Vérifier le message d'erreur

4. **Gestion des erreurs**
   - Tester avec un numéro invalide
   - Tester avec des credentials Twilio incorrects
   - Vérifier les messages d'erreur

### Tests unitaires (à implémenter)

```typescript
// Exemple de tests pour src/lib/twilio.ts
describe('validatePhoneNumber', () => {
  it('should validate international format', () => {
    expect(validatePhoneNumber('+33612345678')).toBe(true);
  });
  
  it('should reject invalid format', () => {
    expect(validatePhoneNumber('0612345678')).toBe(false);
  });
});
```

## Dépannage

### Erreur "TWILIO_NOT_CONFIGURED"
**Cause :** Variables d'environnement Twilio manquantes
**Solution :** Configurer les variables dans Supabase Edge Functions

### Erreur "INSUFFICIENT_QUOTA"
**Cause :** Quota SMS épuisé
**Solution :** Acheter un pack SMS supplémentaire

### Erreur "No contacts found with valid phone numbers"
**Cause :** Aucun contact avec numéro de téléphone valide
**Solution :** Vérifier que les contacts ont des numéros au format international

### SMS non reçus
**Causes possibles :**
1. Numéro Twilio non vérifié en mode test
2. Numéro destinataire invalide
3. Problème de réseau Twilio

**Solution :** Vérifier les logs dans l'historique SMS

## Améliorations futures

1. **Notifications automatiques d'arrivage**
   - Intégration lors de la création d'un arrivage
   - Option "Notifier par SMS" dans le formulaire

2. **Templates avancés**
   - Éditeur de templates dans le dashboard
   - Plus de variables disponibles
   - Conditionnels dans les templates

3. **Statistiques SMS**
   - Taux d'ouverture des liens
   - Conversion des invitations
   - Analyse des meilleurs moments d'envoi

4. **Webhook Twilio**
   - Mise à jour du statut "delivered"
   - Gestion des réponses SMS
   - Tracking des erreurs

## Support

Pour toute question ou problème :
1. Vérifier les logs dans Supabase Edge Functions
2. Vérifier l'historique SMS dans le dashboard
3. Contacter support@quaidirect.fr

## Licence

Propriétaire - QuaiDirect © 2024
