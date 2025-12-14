/**
 * Changelog des mises à jour majeures QuaiDirect
 * Source de vérité pour les suggestions automatiques dans le dashboard admin
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  categories: {
    name: string;
    icon: string;
    items: string[];
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.0.0",
    date: "2024-12-14",
    title: "Mise à jour majeure - Décembre 2024",
    categories: [
      {
        name: "Onboarding amélioré",
        icon: "🚀",
        items: [
          "Sauvegarde automatique à chaque étape (plus de perte de données)",
          "14 méthodes de pêche disponibles avec option 'Autre' personnalisable",
          "Espèces filtrées par bassin (Méditerranée/Atlantique/Manche)",
          "Sélection de point de vente directement sur la carte",
          "Recherche dynamique des espèces + ajout d'espèces non répertoriées",
        ],
      },
      {
        name: "Emails professionnels",
        icon: "📧",
        items: [
          "Mini fiche pêcheur dans chaque email (nom bateau, zone, photo)",
          "Liens trackés pour mesurer l'efficacité de vos envois",
          "Design QuaiDirect unifié sur tous les emails",
          "Cohérence des plans/prix entre site et emails",
        ],
      },
      {
        name: "Carte interactive",
        icon: "🗺️",
        items: [
          "Arrivages prioritaires avec marqueurs plus grands et lumineux",
          "Icône poisson pour distinguer les arrivages des points de vente",
          "Centrage automatique sur les arrivages actifs",
          "Style terrain avec noms de villes uniquement",
        ],
      },
      {
        name: "Gestion des arrivages",
        icon: "🐟",
        items: [
          "Deux modes de création : rapide (SimpleAnnonce) ou détaillé (Wizard)",
          "Espèces favorites affichées en priorité",
          "Photos multiples avec galerie",
          "Période de grâce de 6h pour la visibilité",
        ],
      },
      {
        name: "Système d'affiliation",
        icon: "🤝",
        items: [
          "Liens de parrainage personnalisés dans vos emails",
          "Attribution automatique quand un client s'abonne",
          "Crédits SMS bonus pour chaque filleul Premium+",
          "Suivi des conversions dans votre wallet",
        ],
      },
      {
        name: "Corrections techniques",
        icon: "🔧",
        items: [
          "Logo header redimensionné correctement",
          "Suppression des erreurs 404 sur les ports CSV",
          "Stabilité améliorée des dashboards",
          "Protection contre les pertes de session",
        ],
      },
    ],
  },
];

/**
 * Génère le contenu formaté pour une mise à jour plateforme
 */
export function generateUpdateContent(entry: ChangelogEntry): string {
  let content = "";

  for (const category of entry.categories) {
    content += `${category.icon} ${category.name}\n`;
    for (const item of category.items) {
      content += `• ${item}\n`;
    }
    content += "\n";
  }

  content += "---\n";
  content += "Des questions ? Contactez-nous via le support dans votre dashboard.";

  return content.trim();
}

/**
 * Retourne la dernière entrée du changelog (la plus récente)
 */
export function getLatestChangelog(): ChangelogEntry | undefined {
  return CHANGELOG[0];
}
