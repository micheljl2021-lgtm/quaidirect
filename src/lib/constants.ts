/**
 * Constantes centralisées pour QuaiDirect
 * Évite la duplication et facilite la maintenance
 */

// Prix des paniers en centimes
export const BASKET_PRICES = {
  DECOUVERTE: 2500,
  FAMILLE: 4500,
  GOURMET: 7500,
} as const;

// Commission plateforme (8%)
export const PLATFORM_COMMISSION = 0.08;

// Plans d'abonnement pêcheur (prix en centimes)
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    price: 15000,
    name: 'Basic',
    trialDays: 30,
  },
  PRO: {
    price: 19900,
    name: 'Pro',
    trialDays: 30,
  },
} as const;

// Plans client premium (prix en centimes)
export const PREMIUM_CLIENT_PLANS = {
  MONTHLY: {
    price: 250,
    name: 'Mensuel',
  },
  ANNUAL: {
    price: 2500,
    name: 'Annuel',
  },
} as const;

// Packs SMS (prix en centimes)
export const SMS_PACKS = {
  PACK_500: {
    quantity: 500,
    price: 4900,
    pricePerSms: 0.098,
  },
  PACK_2000: {
    quantity: 2000,
    price: 14900,
    pricePerSms: 0.0745,
  },
  PACK_5000: {
    quantity: 5000,
    price: 29900,
    pricePerSms: 0.0598,
  },
} as const;

// Limites système
export const LIMITS = {
  MAX_SALE_POINTS: 2,
  MAX_FAVORITE_PORTS: 2,
  MAX_AMBASSADOR_SLOTS: 10,
  TRIAL_DAYS: 30,
  SECURE_TOKEN_EXPIRY_HOURS: 24,
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
