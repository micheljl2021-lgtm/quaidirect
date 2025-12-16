/**
 * Changelog des mises à jour majeures QuaiDirect
 * Source de vérité pour les suggestions automatiques dans le dashboard admin
 */

export type TransformationPriority = 'major' | 'useful' | 'minor';

export interface TransformationItem {
  text: string;
  priority: TransformationPriority;
}

export interface ChangelogCategory {
  name: string;
  icon: string;
  items: TransformationItem[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  categories: ChangelogCategory[];
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
          { text: "Sauvegarde automatique à chaque étape (plus de perte de données)", priority: "major" },
          { text: "14 méthodes de pêche disponibles avec option 'Autre' personnalisable", priority: "useful" },
          { text: "Espèces filtrées par bassin (Méditerranée/Atlantique/Manche)", priority: "useful" },
          { text: "Sélection de point de vente directement sur la carte", priority: "major" },
          { text: "Recherche dynamique des espèces + ajout d'espèces non répertoriées", priority: "useful" },
        ],
      },
      {
        name: "Emails professionnels",
        icon: "📧",
        items: [
          { text: "Mini fiche pêcheur dans chaque email (nom bateau, zone, photo)", priority: "major" },
          { text: "Liens trackés pour mesurer l'efficacité de vos envois", priority: "useful" },
          { text: "Design QuaiDirect unifié sur tous les emails", priority: "minor" },
          { text: "Cohérence des plans/prix entre site et emails", priority: "minor" },
        ],
      },
      {
        name: "Carte interactive",
        icon: "🗺️",
        items: [
          { text: "Arrivages prioritaires avec marqueurs plus grands et lumineux", priority: "major" },
          { text: "Icône poisson pour distinguer les arrivages des points de vente", priority: "useful" },
          { text: "Centrage automatique sur les arrivages actifs", priority: "useful" },
          { text: "Style terrain avec noms de villes uniquement", priority: "minor" },
        ],
      },
      {
        name: "Gestion des arrivages",
        icon: "🐟",
        items: [
          { text: "Deux modes de création : rapide (SimpleAnnonce) ou détaillé (Wizard)", priority: "major" },
          { text: "Espèces favorites affichées en priorité", priority: "useful" },
          { text: "Photos multiples avec galerie", priority: "useful" },
          { text: "Période de grâce de 6h pour la visibilité", priority: "minor" },
        ],
      },
      {
        name: "Système d'affiliation",
        icon: "🤝",
        items: [
          { text: "Liens de parrainage personnalisés dans vos emails", priority: "major" },
          { text: "Attribution automatique quand un client s'abonne", priority: "useful" },
          { text: "Crédits SMS bonus pour chaque filleul Premium+", priority: "useful" },
          { text: "Suivi des conversions dans votre wallet", priority: "minor" },
        ],
      },
      {
        name: "Corrections techniques",
        icon: "🔧",
        items: [
          { text: "Logo header redimensionné correctement", priority: "minor" },
          { text: "Suppression des erreurs 404 sur les ports CSV", priority: "minor" },
          { text: "Stabilité améliorée des dashboards", priority: "useful" },
          { text: "Protection contre les pertes de session", priority: "useful" },
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
      content += `• ${item.text}\n`;
    }
    content += "\n";
  }

  content += "---\n";
  content += "Des questions ? Contactez-nous via le support dans votre dashboard.";

  return content.trim();
}

/**
 * Génère le contenu formaté à partir d'items sélectionnés
 */
export function generateContentFromSelection(
  selectedItems: { category: string; icon: string; text: string }[]
): string {
  // Grouper par catégorie
  const grouped = selectedItems.reduce((acc, item) => {
    const key = `${item.icon} ${item.category}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item.text);
    return acc;
  }, {} as Record<string, string[]>);

  let content = "";
  for (const [category, items] of Object.entries(grouped)) {
    content += `${category}\n`;
    for (const item of items) {
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

/**
 * Retourne toutes les transformations aplaties avec métadonnées
 */
export function getAllTransformations(): {
  version: string;
  date: string;
  category: string;
  icon: string;
  text: string;
  priority: TransformationPriority;
}[] {
  const transformations: {
    version: string;
    date: string;
    category: string;
    icon: string;
    text: string;
    priority: TransformationPriority;
  }[] = [];

  for (const entry of CHANGELOG) {
    for (const category of entry.categories) {
      for (const item of category.items) {
        transformations.push({
          version: entry.version,
          date: entry.date,
          category: category.name,
          icon: category.icon,
          text: item.text,
          priority: item.priority,
        });
      }
    }
  }

  return transformations;
}
