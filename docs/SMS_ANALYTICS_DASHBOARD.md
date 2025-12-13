# SMS Analytics Dashboard - Documentation

## Vue d'ensemble

Le dashboard SMS Analytics permet aux pêcheurs et administrateurs de visualiser et analyser l'historique complet des SMS envoyés via la plateforme QuaiDirect.

## Fonctionnalités

### 1. Statistiques globales
- **Total SMS envoyés** : Nombre total de messages
- **Taux de succès** : Pourcentage de messages livrés avec succès
- **Erreurs** : Nombre de SMS échoués et en attente
- **Coût total** : Dépense totale en SMS

### 2. Graphiques analytiques
- **Courbe d'envois SMS par jour** : Visualisation du volume quotidien sur les 30 derniers jours
- **Répartition par type** : Pie chart montrant la distribution (invitations, notifications, promotions)
- **Statuts des messages** : Bar chart des statuts (envoyé, livré, échec, en attente)
- **Coût par type** : Analyse des dépenses par catégorie de message

### 3. Historique détaillé
- **Table complète** : Liste tous les SMS avec pagination (50 par page)
- **Filtres avancés** :
  - Statut : Tous, Envoyé, Livré, Échec, En attente
  - Type : Tous, Invitation, Notification, Promotion
  - Téléphone : Recherche par numéro
  - Message : Recherche dans le contenu
- **Export CSV** : Téléchargement des données en format CSV

### 4. Vue administrateur (Admin uniquement)
- **Analytics globales** : Statistiques de tous les pêcheurs
- **Top 10 pêcheurs** : Classement par volume SMS
- **Filtre par pêcheur** : Vue détaillée par pêcheur

## Accès

### Pêcheurs
URL : `/pecheur/sms-analytics`
- Accessible depuis le dashboard pêcheur via le bouton "Analytics SMS"
- Affiche uniquement les SMS du pêcheur connecté

### Administrateurs
URL : `/admin/sms-analytics`
- Vue globale de tous les pêcheurs
- Accès aux statistiques détaillées et top performers

## Périodes disponibles

- **24 heures** : Messages des dernières 24 heures
- **7 jours** : Messages de la dernière semaine
- **30 jours** : Messages du dernier mois (par défaut)
- **Tout** : Historique complet

## Structure de données

### Table `sms_messages`
```sql
- id: UUID (clé primaire)
- fisherman_id: UUID (référence vers fishermen)
- contact_phone: TEXT (numéro de téléphone)
- message: TEXT (contenu du SMS)
- type: TEXT (invitation|notification|promotion)
- status: TEXT (sent|failed|pending|delivered)
- sent_at: TIMESTAMPTZ (date d'envoi)
- delivered_at: TIMESTAMPTZ (date de livraison)
- error_message: TEXT (message d'erreur si échec)
- twilio_sid: TEXT (identifiant Twilio)
- retries: INTEGER (nombre de tentatives)
- cost_cents: INTEGER (coût en centimes, défaut: 5)
- drop_id: UUID (référence vers drops, optionnel)
```

### Indexes
- `idx_sms_messages_fisherman` : Recherche par pêcheur
- `idx_sms_messages_sent_at` : Tri par date
- `idx_sms_messages_status` : Filtre par statut
- `idx_sms_messages_type` : Filtre par type
- `idx_sms_messages_contact_phone` : Recherche par téléphone

### Politiques RLS
- Les pêcheurs ne voient que leurs propres SMS
- Les administrateurs voient tous les SMS
- Le service role peut tout gérer

## Export des données

### Format CSV
Le fichier CSV exporté contient les colonnes suivantes :
- Date (format : DD/MM/YYYY HH:mm)
- Téléphone
- Message
- Type (traduit en français)
- Statut (avec icônes)
- Coût (€)
- Réessais
- Livré le
- Erreur

### Utilisation
1. Appliquer les filtres souhaités
2. Cliquer sur le bouton "Exporter"
3. Sélectionner "Export CSV"
4. Le fichier est téléchargé automatiquement

## Intégration avec send-sms

La fonction edge `send-sms` a été mise à jour pour enregistrer automatiquement tous les SMS dans la table `sms_messages` :

### SMS réussi
```typescript
status: 'sent'
sent_at: Date actuelle
twilio_sid: SID Twilio
cost_cents: 5
```

### SMS échoué
```typescript
status: 'failed'
error_message: Message d'erreur Twilio
cost_cents: 5
```

### Gestion des erreurs
- Les erreurs d'insertion en base ne bloquent pas l'envoi du SMS
- Chaque erreur est loggée dans la console
- Le tracking reste non-bloquant pour l'utilisateur

## Technologies utilisées

### Frontend
- **React** : Framework UI
- **TypeScript** : Typage statique
- **Tanstack Query** : Gestion des requêtes et cache
- **Recharts** : Bibliothèque de graphiques
- **Tailwind CSS + shadcn/ui** : Composants UI
- **date-fns** : Manipulation des dates
- **Lucide React** : Icônes

### Backend
- **Supabase** : Base de données PostgreSQL
- **Edge Functions** : Fonctions serverless Deno
- **Twilio** : Service SMS

## Performances

### Optimisations
- Requêtes indexées pour temps de réponse < 100ms
- Pagination serveur (50 items/page)
- Cache React Query (5 minutes pour analytics, 1 minute pour historique)
- Lazy loading des composants

### Responsive Design
- **Mobile** (< 768px) : 1 colonne, navigation simplifiée
- **Tablet** (768px - 1024px) : 2 colonnes pour les graphiques
- **Desktop** (> 1024px) : 4 colonnes pour les stats, grilles optimisées

## Dépannage

### Les données ne s'affichent pas
1. Vérifier que l'utilisateur est connecté
2. Vérifier les permissions RLS
3. Consulter la console pour les erreurs

### Les graphiques sont vides
- Vérifier qu'il y a des données dans la période sélectionnée
- Essayer une période plus large (30 jours ou Tout)

### L'export CSV ne fonctionne pas
- Vérifier qu'il y a des messages à exporter
- Vérifier les permissions du navigateur pour les téléchargements

## Évolutions futures

### Phase 2 (non implémentée)
- [ ] Export PDF avec graphiques
- [ ] Rapports planifiés par email
- [ ] Webhooks Twilio pour statuts de livraison
- [ ] Bouton "Renvoyer" pour les SMS échoués
- [ ] Alertes automatiques sur taux d'échec élevé
- [ ] Comparaison période sur période
- [ ] Prédictions ML du volume SMS

## Support

Pour toute question ou problème, contacter l'équipe technique via :
- Le système de support intégré
- Email : support@quaidirect.fr
