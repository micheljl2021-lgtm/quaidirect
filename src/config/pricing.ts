/**
 * Source of Truth - Pricing Configuration
 * Configuration centralisée pour tous les plans, packs SMS et règles d'affiliation
 */

// ============================================
// PLANS PÊCHEURS (3 niveaux)
// ============================================
export const FISHERMAN_PLANS = {
  STANDARD: {
    id: 'fisherman_standard',
    name: 'Standard',
    priceCents: 15000, // 150€/an
    period: 'year',
    stripePriceId: 'price_FISHERMAN_STANDARD_150_YEAR',
    trialDays: 30,
    smsQuotaMonthly: 50,
    openingBonusSms: 200,
    crmContacts: 500,
    salePoints: 1,
  },
  PRO: {
    id: 'fisherman_pro',
    name: 'Pro',
    priceCents: 29900, // 299€/an
    period: 'year',
    stripePriceId: 'price_FISHERMAN_PRO_299_YEAR',
    trialDays: 30,
    smsQuotaMonthly: 200,
    openingBonusSms: 1000,
    crmContacts: 2000,
    salePoints: 3,
  },
  ELITE: {
    id: 'fisherman_elite',
    name: 'Elite',
    priceCents: 19900, // 199€/mois
    period: 'month',
    stripePriceId: 'price_FISHERMAN_ELITE_199_MONTH',
    trialDays: 0,
    smsQuotaMonthly: 1500,
    openingBonusSms: 0,
    overageEnabled: true,
    overagePricePerSmsCents: 9, // 0.09€ par SMS supplémentaire
    crmContacts: 10000,
    salePoints: 10,
  },
} as const;

// ============================================
// PLANS PREMIUM (clients finaux)
// ============================================
export const PREMIUM_PLANS = {
  FOLLOWER: {
    id: 'follower',
    name: 'Follower',
    price: 0,
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    priceAnnualCents: 2500, // 25€/an
    stripePriceIdAnnual: 'price_PREMIUM_ANNUAL_25',
    affiliateCreditCents: 800, // 8€ reversés au pêcheur
  },
  PREMIUM_PLUS: {
    id: 'premium_plus',
    name: 'Premium+',
    priceAnnualCents: 4000, // 40€/an
    stripePriceIdAnnual: 'price_PREMIUM_PLUS_ANNUAL_40',
    affiliateCreditCents: 1800, // 18€ reversés au pêcheur
  },
} as const;

// ============================================
// PACKS SMS
// ============================================
export const SMS_PACKS = {
  PACK_500: {
    id: 'pack_500',
    quantity: 500,
    priceCents: 4000, // 40€
    stripePriceId: 'price_SMS_PACK_500',
  },
  PACK_LANCEMENT: {
    id: 'pack_lancement',
    quantity: 1000,
    priceCents: 7000, // 70€
    stripePriceId: 'price_SMS_PACK_LANCEMENT',
    recommended: true,
  },
  PACK_2000: {
    id: 'pack_2000',
    quantity: 2000,
    priceCents: 12000, // 120€
    stripePriceId: 'price_SMS_PACK_2000',
  },
  PACK_5000: {
    id: 'pack_5000',
    quantity: 5000,
    priceCents: 25000, // 250€
    stripePriceId: 'price_SMS_PACK_5000',
  },
} as const;

// ============================================
// RÈGLES AFFILIATION
// ============================================
export const AFFILIATE_CREDITS_RULES = {
  SMS_CREDIT_VALUE_CENTS: 7, // 0.07€ par SMS
  calculateSmsCredits: (creditCents: number): number => {
    if (creditCents < 0) return 0;
    return Math.floor(creditCents / 7);
  },
} as const;

// ============================================
// TYPES
// ============================================
export type FishermanPlanId = keyof typeof FISHERMAN_PLANS;
export type PremiumPlanId = keyof typeof PREMIUM_PLANS;
export type SmsPackId = keyof typeof SMS_PACKS;
