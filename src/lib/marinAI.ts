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
 * Utilise l'Edge Function marine-ai-assistant
 */
export async function callMarinAI(request: MarinAIRequest): Promise<string> {
  const {
    category,
    fishermanProfile,
    context,
    userMessage,
    conversationHistory = [],
  } = request;

  // Construire le message utilisateur avec contexte
  let enrichedMessage = userMessage;

  if (fishermanProfile) {
    const profileContext = [];
    if (fishermanProfile.name) profileContext.push(`Nom: ${fishermanProfile.name}`);
    if (fishermanProfile.boatName) profileContext.push(`Bateau: ${fishermanProfile.boatName}`);
    if (fishermanProfile.ports?.length) profileContext.push(`Ports: ${fishermanProfile.ports.join(', ')}`);
    if (fishermanProfile.salePoints?.length) profileContext.push(`Points de vente: ${fishermanProfile.salePoints.join(', ')}`);
    
    if (profileContext.length > 0) {
      enrichedMessage = `[Contexte: ${profileContext.join(' | ')}]\n\n${userMessage}`;
    }
  }

  if (context) {
    enrichedMessage = `[Info: ${context}]\n\n${enrichedMessage}`;
  }

  // Import supabase dynamiquement pour éviter les dépendances circulaires
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Non authentifié - veuillez vous connecter');
  }

  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: enrichedMessage }
  ];

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marine-ai-assistant`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ 
        messages,
        category,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur IA: ${response.status} - ${errorText}`);
  }

  // Lire le stream SSE et extraire le contenu complet
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  if (!reader) throw new Error('Pas de réponse');

  let buffer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith(':')) continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  return fullContent || 'Pas de réponse de l\'IA';
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
