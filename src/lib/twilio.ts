/**
 * Twilio SMS helper functions
 * Validation et formatage des SMS
 */

import type { SmsTemplate } from '@/types/sms';

/**
 * Valide un numéro de téléphone au format international
 * Format attendu : +33612345678 ou +1234567890
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  // Nettoyer le numéro
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Vérifier le format international (+)
  if (!cleaned.startsWith('+')) return false;
  
  // Vérifier la longueur (entre 10 et 15 chiffres après le +)
  const digits = cleaned.slice(1);
  if (!/^\d{10,15}$/.test(digits)) return false;
  
  return true;
}

/**
 * Formate un numéro de téléphone au format international
 * Ajoute le préfixe + si nécessaire
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Nettoyer le numéro
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Ajouter + si manquant
  if (!cleaned.startsWith('+')) {
    // Si commence par 00, remplacer par +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.slice(2);
    } 
    // Si commence par 0 (numéro français), ajouter +33
    else if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.slice(1);
    }
    // Sinon, supposer que c'est déjà un numéro international sans +
    else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Remplace les variables dans un template SMS
 * Variables supportées : {{variable_name}}
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  
  // Remplacer chaque variable
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
}

/**
 * Génère un lien de signup personnalisé pour un pêcheur
 */
export function generateSignupLink(fishermanId: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/auth?ref=${fishermanId}`;
}

/**
 * Génère un lien vers un arrivage
 */
export function generateDropLink(dropId: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/drop/${dropId}`;
}

/**
 * Valide et prépare un message SMS
 * Vérifie la longueur et nettoie le texte
 */
export function prepareSmsMessage(message: string): {
  valid: boolean;
  message: string;
  length: number;
  segments: number;
  error?: string;
} {
  if (!message || message.trim().length === 0) {
    return {
      valid: false,
      message: '',
      length: 0,
      segments: 0,
      error: 'Le message ne peut pas être vide',
    };
  }
  
  const cleaned = message.trim();
  const length = cleaned.length;
  
  // SMS standard : 160 caractères par segment (GSM-7)
  // SMS avec caractères spéciaux : 70 caractères par segment (UCS-2)
  const hasSpecialChars = /[^\x00-\x7F]/.test(cleaned);
  const maxPerSegment = hasSpecialChars ? 70 : 160;
  const segments = Math.ceil(length / maxPerSegment);
  
  // Limite à 10 segments (recommandation Twilio)
  if (segments > 10) {
    return {
      valid: false,
      message: cleaned,
      length,
      segments,
      error: `Message trop long (${segments} segments). Maximum 10 segments recommandé.`,
    };
  }
  
  return {
    valid: true,
    message: cleaned,
    length,
    segments,
  };
}

/**
 * Génère un message d'invitation par défaut
 */
export function getDefaultInvitationMessage(
  fishermanName: string,
  signupLink: string
): string {
  return `Bonjour ! ${fishermanName} vous invite à découvrir du poisson frais sur QuaiDirect : ${signupLink}`;
}

/**
 * Génère un message de notification d'arrivage par défaut
 */
export function getDefaultNotificationMessage(
  species: string[],
  dropLink: string
): string {
  const speciesText = species.join(', ');
  return `Arrivage ! Poisson frais du jour : ${speciesText}. Voir les détails : ${dropLink}`;
}

/**
 * Estime le coût d'un SMS en segments
 */
export function estimateSmsCost(message: string): number {
  const { segments } = prepareSmsMessage(message);
  return segments;
}

/**
 * Extrait les variables d'un template
 * Cherche les patterns {{variable}}
 */
export function extractTemplateVariables(template: string): string[] {
  const regex = /{{(\s*\w+\s*)}}/g;
  const matches = template.matchAll(regex);
  const variables = new Set<string>();
  
  for (const match of matches) {
    variables.add(match[1].trim());
  }
  
  return Array.from(variables);
}

/**
 * Valide qu'un template contient toutes les variables requises
 */
export function validateTemplate(
  template: string,
  requiredVariables: string[]
): { valid: boolean; missingVariables?: string[] } {
  const templateVars = extractTemplateVariables(template);
  const missing = requiredVariables.filter(v => !templateVars.includes(v));
  
  if (missing.length > 0) {
    return { valid: false, missingVariables: missing };
  }
  
  return { valid: true };
}

/**
 * Rate limiting : calcule si un pêcheur peut envoyer des SMS
 */
export interface RateLimitCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt?: Date;
}

export function checkRateLimit(
  sentToday: number,
  dailyLimit: number = 100
): RateLimitCheck {
  const remaining = Math.max(0, dailyLimit - sentToday);
  const allowed = remaining > 0;
  
  // Reset à minuit
  const resetAt = new Date();
  resetAt.setHours(24, 0, 0, 0);
  
  return {
    allowed,
    remaining,
    limit: dailyLimit,
    resetAt,
  };
}
