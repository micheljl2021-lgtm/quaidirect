# Configuration Google Maps pour QuaiDirect

## Prérequis

1. Un compte Google Cloud avec la facturation activée
2. Un projet Google Cloud créé

## Étape 1 : Activer les APIs requises

Dans [Google Cloud Console](https://console.cloud.google.com/apis/library), activez les APIs suivantes :

- **Maps JavaScript API** - Affichage de la carte interactive
- **Places API** - Autocomplétion des adresses
- **Geocoding API** - Conversion adresse ↔ coordonnées GPS

## Étape 2 : Créer une clé API

1. Allez dans [Identifiants](https://console.cloud.google.com/apis/credentials)
2. Cliquez sur "Créer des identifiants" → "Clé API"
3. Notez la clé générée (format: `AIza...`)

## Étape 3 : Configurer les restrictions

### Restrictions HTTP (domaines autorisés)

Ajoutez ces domaines dans les restrictions de la clé API :

```
*.lovable.dev/*
*.lovableproject.com/*
quaidirect.fr/*
www.quaidirect.fr/*
kdirect.fr/*
www.kdirect.fr/*
localhost:*/*
```

### Restrictions d'API

Limitez la clé aux APIs suivantes uniquement :
- Maps JavaScript API
- Places API  
- Geocoding API

## Étape 4 : Configurer dans Lovable

1. Ouvrez votre projet Lovable
2. Allez dans **Settings** → **Secrets**
3. Ajoutez le secret :
   - Nom : `VITE_GOOGLE_MAPS_API_KEY`
   - Valeur : Votre clé API Google Maps

## Dépannage

### Carte affiche une zone grise

**Causes possibles :**
- API Maps JavaScript non activée
- Domaine non autorisé dans les restrictions
- Quota API épuisé

**Solution :**
1. Vérifiez que l'API est activée dans Google Cloud Console
2. Ajoutez `*.lovableproject.com/*` aux restrictions HTTP
3. Consultez les quotas dans la section "Quotas" de l'API

### Erreur "RefererNotAllowedMapError"

Le domaine actuel n'est pas dans la liste des domaines autorisés.

**Solution :** Ajoutez le domaine exact affiché dans l'erreur aux restrictions HTTP.

### Erreur "ApiNotActivatedMapError"

L'API Maps JavaScript n'est pas activée.

**Solution :** Activez l'API dans [Google Cloud Console](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com).

### Timeout de chargement

La carte met plus de 15 secondes à charger.

**Causes possibles :**
- Connexion internet lente
- Problème temporaire côté Google
- Clé API invalide

**Solution :** Cliquez sur "Réessayer" ou rafraîchissez la page.

## Codes d'erreur

| Code | Description | Solution |
|------|-------------|----------|
| `API_KEY_MISSING` | Clé API non configurée | Ajoutez `VITE_GOOGLE_MAPS_API_KEY` aux secrets |
| `LOADING_TIMEOUT` | Chargement trop long | Vérifiez les restrictions de domaine |
| `InvalidKeyMapError` | Clé API invalide | Régénérez la clé dans Google Cloud |
| `RefererNotAllowedMapError` | Domaine non autorisé | Ajoutez le domaine aux restrictions |
| `ApiNotActivatedMapError` | API non activée | Activez Maps JavaScript API |

## Quotas et facturation

- **Gratuit** : 28 000 chargements de carte/mois
- **Places API** : 10 000 requêtes/mois gratuites
- **Geocoding** : 40 000 requêtes/mois gratuites

Au-delà, consultez la [grille tarifaire Google Maps Platform](https://cloud.google.com/maps-platform/pricing).

## Sécurité

- ✅ Utilisez toujours les restrictions HTTP pour limiter l'usage
- ✅ Limitez les APIs autorisées au strict nécessaire
- ✅ Surveillez l'utilisation dans le tableau de bord Google Cloud
- ❌ Ne partagez jamais votre clé API publiquement
- ❌ N'utilisez pas la même clé pour le backend et le frontend

## ⚠️ Troubleshooting: "API key missing"

### Cause
Lovable Cloud Secrets non configurés ou mal nommés.

### Solution
1. Vérifier le nom exact: `VITE_GOOGLE_MAPS_API_KEY` (respecter la casse)
2. Vérifier qu'il n'y a pas d'espaces avant/après la clé
3. Redéployer l'application après avoir ajouté le secret
4. Vérifier dans la console browser: `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`

### Test Local
```bash
# Créer .env à la racine
cp .env.example .env

# Éditer .env et remplacer:
VITE_GOOGLE_MAPS_API_KEY=votre_vraie_clé_ici

# Relancer le dev server
npm run dev
```

### Vérification de Configuration
L'application valide automatiquement la présence de la clé API au démarrage. Si la clé est manquante, vous verrez une erreur claire dans la console indiquant les étapes de configuration.

