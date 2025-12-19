/**
 * Constantes centralisées pour QuaiDirect
 * Évite la duplication et facilite la maintenance
 */

import { FISHERMAN_PLANS, PREMIUM_PLANS, SMS_PACKS } from '@/config/pricing';

// Prix des paniers en centimes
export const BASKET_PRICES = {
  DECOUVERTE: 2500,
  FAMILLE: 4500,
  GOURMET: 7500,
} as const;

// Commission plateforme (5%)
export const PLATFORM_COMMISSION = 0.05;

// Plans d'abonnement pêcheur (prix en centimes) - Importé depuis pricing.ts
export const SUBSCRIPTION_PLANS = {
  STANDARD: {
    price: FISHERMAN_PLANS.STANDARD.priceCents,
    name: FISHERMAN_PLANS.STANDARD.name,
  },
  PRO: {
    price: FISHERMAN_PLANS.PRO.priceCents,
    name: FISHERMAN_PLANS.PRO.name,
  },
  ELITE: {
    price: FISHERMAN_PLANS.ELITE.priceCents,
    name: FISHERMAN_PLANS.ELITE.name,
  },
} as const;

// Plans client premium (prix en centimes) - Importé depuis pricing.ts
export const PREMIUM_CLIENT_PLANS = {
  FOLLOWER: {
    price: PREMIUM_PLANS.FOLLOWER.price,
    name: PREMIUM_PLANS.FOLLOWER.name,
  },
  PREMIUM: {
    price: PREMIUM_PLANS.PREMIUM.priceAnnualCents,
    name: PREMIUM_PLANS.PREMIUM.name,
  },
  PREMIUM_PLUS: {
    price: PREMIUM_PLANS.PREMIUM_PLUS.priceAnnualCents,
    name: PREMIUM_PLANS.PREMIUM_PLUS.name,
  },
} as const;

// Export des packs SMS depuis pricing.ts pour compatibilité
export { SMS_PACKS };

// Limites système
export const LIMITS = {
  MAX_SALE_POINTS: 2,
  MAX_FAVORITE_PORTS: 2,
  MAX_AMBASSADOR_SLOTS: 10,
  TRIAL_DAYS: 0,
  SECURE_TOKEN_EXPIRY_HOURS: 24,
  ARRIVAL_GRACE_HOURS: 2, // Arrivages visibles 2h après leur sale_start_time
} as const;

// URLs et contacts externes
export const EXTERNAL_URLS = {
  SUPPORT_EMAIL: 'support@quaidirect.fr',
  CEO_EMAIL: 'CEO@quaidirect.fr',
} as const;

// Poids indicatifs des paniers (en kg)
export const BASKET_WEIGHTS = {
  DECOUVERTE: 1.5,
  FAMILLE: 3,
  GOURMET: 4,
} as const;

// Niveaux de variété des paniers
export const BASKET_VARIETY = {
  DECOUVERTE: '2-3 espèces',
  FAMILLE: '4-5 espèces',
  GOURMET: 'Espèces premium',
} as const;

// Statuts des drops
export const DROP_STATUS = {
  SCHEDULED: 'scheduled',
  LANDED: 'landed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Statuts des réservations
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

// Rôles utilisateur
export const USER_ROLES = {
  USER: 'user',
  PREMIUM: 'premium',
  FISHERMAN: 'fisherman',
  ADMIN: 'admin',
} as const;

// Mode maintenance - basculer sur false pour lancer le site
export const MAINTENANCE_MODE = false;

// Date de lancement officielle (18h00 heure française le 12 décembre 2025)
export const LAUNCH_DATE = new Date('2025-12-12T18:00:00+01:00');
