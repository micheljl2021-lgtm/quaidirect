/**
 * Service centralisé pour l'IA du Marin
 * Architecture prête pour intégration API externe (OpenAI, etc.)
 */

export type AICategory = 'clientele' | 'peche' | 'bateau' | 'business';

interface MarinAIRequest {
  category: AICategory;
  fishermanProfile?: {
    name?: string;
    boatName?: string;
    ports?: string[];
    salePoints?: string[];
  };
  context?: string;
  userMessage: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * System prompts par catégorie
 */
const SYSTEM_PROMPTS: Record<AICategory, string> = {
  clientele: `Tu es l'assistant IA spécialisé dans la communication client pour les marins-pêcheurs artisanaux français.

Ton rôle :
- Rédiger des messages WhatsApp/SMS d'annonce d'arrivage
- Créer des posts courts pour réseaux sociaux (Facebook, Instagram)
- Aider à répondre aux questions fréquentes des clients (restaurants, poissonniers, particuliers)
- Optimiser les messages pour maximiser les ventes

Style :
- Direct, professionnel mais chaleureux
- Messages courts et percutants
- Toujours inclure les infos clés : espèces, quantité, lieu, horaire
- Créer un sentiment d'urgence sans être agressif

Exemples de tâches :
- "Rédige un message WhatsApp pour annoncer mon arrivage de demain : 20kg de dorades, 15kg de bars, vente 7h-9h au port"
- "Aide-moi à répondre à un client qui demande si j'ai du poisson pour 4 personnes"`,

  peche: `Tu es l'assistant IA spécialisé en stratégie de pêche et météo marine pour les pêcheurs artisanaux français.

Ton rôle :
- Interpréter les conditions météo marines (vent, houle, visibilité)
- Conseiller sur les meilleurs créneaux de pêche selon la météo
- Suggérer des zones de pêche adaptées
- Aider à organiser les sorties (nombre de sorties par semaine, durée, etc.)
- Fournir des conseils de sécurité en mer

Style :
- Pragmatique et sécuritaire
- Basé sur l'expérience maritime
- Toujours prioriser la sécurité
- Donner des conseils concrets et actionnables

Exemples de tâches :
- "Donne-moi un plan de pêche pour deux sorties cette semaine avec la météo prévue"
- "Explique-moi ce que je dois surveiller avec un vent de NE 20 nœuds"
- "Quelle zone me conseilles-tu pour aujourd'hui ?"`,

  bateau: `Tu es l'assistant IA spécialisé en entretien et maintenance de bateau de pêche artisanal.

Ton rôle :
- Créer des checklists de préparation avant sortie en mer
- Planifier les rappels de maintenance (moteur, sécurité, équipements)
- Aider à tenir un carnet de bord textuel structuré
- Conseiller sur l'entretien courant du bateau

Style :
- Méthodique et organisé
- Focus sur la prévention
- Rappeler les obligations réglementaires
- Structurer les informations en listes claires

Exemples de tâches :
- "Génère une checklist avant de sortir en mer"
- "Aide-moi à planifier la maintenance de mon moteur sur 6 mois"
- "Comment dois-je noter ma sortie d'aujourd'hui dans mon carnet de bord ?"`,

  business: `Tu es l'assistant IA spécialisé en gestion commerciale et organisation pour les pêcheurs artisanaux.

Ton rôle :
- Aider à organiser le temps (pêche vs vente vs administratif)
- Estimer les revenus selon volumes et prix moyens
- Préparer des mini-récaps pour l'administratif (sans remplacer un comptable)
- Optimiser la rentabilité des sorties

Style :
- Orienté rentabilité et efficacité
- Chiffres clairs et simples
- Conseils pratiques sans jargon
- Toujours clarifier que tu n'es pas comptable pour les questions fiscales

Exemples de tâches :
- "Estime mes revenus si je vends 30 kg par semaine à 18 €/kg"
- "Aide-moi à résumer ma semaine pour mes papiers"
- "Comment organiser mon temps entre pêche et vente ?"`,
};

/**
 * Fonction d'appel IA centralisée
 * À terme, peut être branchée sur OpenAI API ou autre
 */
export async function callMarinAI(request: MarinAIRequest): Promise<string> {
  const {
    category,
    fishermanProfile,
    context,
    userMessage,
    conversationHistory = [],
  } = request;

  // Construire le system prompt avec contexte
  let systemPrompt = SYSTEM_PROMPTS[category];

  if (fishermanProfile) {
    systemPrompt += `\n\nContexte du pêcheur :`;
    if (fishermanProfile.name) {
      systemPrompt += `\n- Nom : ${fishermanProfile.name}`;
    }
    if (fishermanProfile.boatName) {
      systemPrompt += `\n- Bateau : ${fishermanProfile.boatName}`;
    }
    if (fishermanProfile.ports && fishermanProfile.ports.length > 0) {
      systemPrompt += `\n- Ports : ${fishermanProfile.ports.join(', ')}`;
    }
    if (fishermanProfile.salePoints && fishermanProfile.salePoints.length > 0) {
      systemPrompt += `\n- Points de vente : ${fishermanProfile.salePoints.join(', ')}`;
    }
  }

  if (context) {
    systemPrompt += `\n\nContexte additionnel : ${context}`;
  }

  // Pour l'instant, utiliser l'API Lovable AI
  // Plus tard, peut être remplacé par :
  // - OpenAI API avec clé configurable
  // - Autre LLM provider
  
  // TODO: Implémenter l'appel API externe ici
  // Pour l'instant, retourner un placeholder
  return `[Réponse IA pour catégorie: ${category}]\n\nMessage utilisateur: ${userMessage}\n\n${systemPrompt}`;
}

/**
 * Prompts rapides par catégorie
 */
export const QUICK_PROMPTS: Record<AICategory, Array<{ icon: string; label: string; prompt: string }>> = {
  clientele: [
    {
      icon: '📱',
      label: 'Message WhatsApp arrivage',
      prompt: 'Prépare-moi un message WhatsApp pour annoncer mon arrivage de demain matin.',
    },
    {
      icon: '📧',
      label: 'Réponse client',
      prompt: 'Aide-moi à répondre à un client qui me demande s\'il reste du poisson pour 4 personnes.',
    },
    {
      icon: '📢',
      label: 'Post Facebook',
      prompt: 'Rédige un post Facebook pour annoncer mon arrivage avec 20kg de daurades.',
    },
  ],
  peche: [
    {
      icon: '🌊',
      label: 'Plan de pêche',
      prompt: 'Donne-moi un plan de pêche pour deux sorties cette semaine.',
    },
    {
      icon: '☁️',
      label: 'Météo marine',
      prompt: 'Explique-moi ce que je dois surveiller avec la météo prévue.',
    },
    {
      icon: '🎯',
      label: 'Choix de zone',
      prompt: 'Quelle zone me conseilles-tu pour aujourd\'hui ?',
    },
  ],
  bateau: [
    {
      icon: '✅',
      label: 'Checklist sortie',
      prompt: 'Génère une checklist avant de sortir en mer.',
    },
    {
      icon: '🔧',
      label: 'Plan maintenance',
      prompt: 'Aide-moi à planifier la maintenance de mon moteur sur 6 mois.',
    },
    {
      icon: '📔',
      label: 'Carnet de bord',
      prompt: 'Comment noter ma sortie d\'aujourd\'hui dans mon carnet de bord ?',
    },
  ],
  business: [
    {
      icon: '💰',
      label: 'Estimation revenus',
      prompt: 'Estime mes revenus si je vends 30 kg par semaine à 18 €/kg.',
    },
    {
      icon: '📊',
      label: 'Récap semaine',
      prompt: 'Aide-moi à résumer ma semaine pour mes papiers.',
    },
    {
      icon: '⏰',
      label: 'Organisation temps',
      prompt: 'Comment organiser mon temps entre pêche et vente cette semaine ?',
    },
  ],
};
