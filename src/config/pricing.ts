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
    priceMonthlyEquivalent: 1250, // 12,50€/mois
    period: 'year' as const,
    stripePriceId: 'price_1SeIyYH4NF3bNS2FFBprGrJh',
    trialDays: 7,
    smsQuotaMonthly: 50,
    openingBonusSms: 200,
    crmContacts: 500,
    salePoints: 1,
    features: {
      crm: 'simple',
      ia: 'basique', // texte d'annonce, description
      stats: 'light',
      smsPacks: true,
    },
    affiliateSmsCapMonthly: 200, // Plafond affiliation mensuel
    positioning: 'Tu démarres, tu construis ton fichier',
  },
  PRO: {
    id: 'fisherman_pro',
    name: 'Pro',
    priceCents: 29900, // 299€/an
    priceMonthlyEquivalent: 2490, // 24,90€/mois
    period: 'year' as const,
    stripePriceId: 'price_1SeIyaH4NF3bNS2FIV1lEoJX',
    trialDays: 7,
    smsQuotaMonthly: 200,
    openingBonusSms: 1000,
    crmContacts: 2000,
    salePoints: 3,
    features: {
      crm: 'avancé', // tags/segments
      ia: 'marine', // IA Marine + météo + templates
      stats: 'campagnes',
      smsPacks: true,
      smsPacksDiscount: true, // Meilleur prix sur les packs
    },
    affiliateSmsCapMonthly: null, // Illimité
    positioning: 'Le vrai plan rentable si tu annonces souvent',
    recommended: true,
  },
  ELITE: {
    id: 'fisherman_elite',
    name: 'Elite',
    priceCents: 19900, // 199€/mois
    period: 'month' as const,
    stripePriceId: 'price_1SeIycH4NF3bNS2FbeJAO8XH',
    trialDays: 7,
    smsQuotaMonthly: 1500,
    openingBonusSms: 0, // Pas de bonus car mensuel
    openingBonusAnnualSms: 2000, // Si passage en annuel
    overageEnabled: true,
    overagePricePerSmsCents: 9, // 0,09€ par SMS supplémentaire
    crmContacts: 10000,
    salePoints: 10, // Multi points de vente
    features: {
      crm: 'complet',
      ia: 'complète', // + "photo → annonce" à venir
      stats: 'dashboard avancé',
      senderPro: true, // Numéro vérifié (quand possible)
      smsPacks: false, // Surconsommation directe
    },
    affiliateSmsCapMonthly: null, // Illimité
    positioning: 'Ports actifs / gros fichiers / ventes régulières',
  },
} as const;

// ============================================
// PACKS SMS (prix différenciés par plan)
// ============================================
export const SMS_PACKS = {
  PACK_500: {
    id: 'pack_500',
    quantity: 500,
    priceCents: 4000, // 40€ (prix Standard)
    priceCentsPro: 3500, // 35€ (prix Pro)
    stripePriceId: 'price_1SeIyeH4NF3bNS2FNGVr2CxY',
  },
  PACK_LANCEMENT: {
    id: 'pack_lancement',
    quantity: 1000,
    priceCents: 7000, // 70€ → 75€ Standard
    priceCentsPro: 6500, // 65€ Pro
    stripePriceId: 'price_1SeIygH4NF3bNS2F8iIdxoVB',
    recommended: true,
  },
  PACK_2000: {
    id: 'pack_2000',
    quantity: 2000,
    priceCents: 12000, // 120€ → 140€ Standard
    priceCentsPro: 12000, // 120€ Pro
    stripePriceId: 'price_SMS_PACK_2000', // À créer
  },
  PACK_5000: {
    id: 'pack_5000',
    quantity: 5000,
    priceCents: 25000, // 250€
    priceCentsPro: 22000, // 220€ Pro
    stripePriceId: 'price_SMS_PACK_5000', // À créer
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
    stripePriceIdAnnual: 'price_1SeIyiH4NF3bNS2FRgtswzuS',
    trialDays: 7,
    affiliateCreditCents: 800, // 8€ reversés au pêcheur
  },
  PREMIUM_PLUS: {
    id: 'premium_plus',
    name: 'Premium+',
    priceAnnualCents: 4000, // 40€/an
    stripePriceIdAnnual: 'price_1SeIykH4NF3bNS2FIU8x913J',
    trialDays: 7,
    affiliateCreditCents: 1800, // 18€ reversés au pêcheur
  },
} as const;

// ============================================
// RÈGLES AFFILIATION
// ============================================
export const AFFILIATE_CREDITS_RULES = {
  SMS_CREDIT_VALUE_CENTS: 7, // 0,07€ par SMS
  REFERRAL_BONUS_SMS: 300, // Bonus parrainage pour les deux parties
  calculateSmsCredits: (creditCents: number): number => {
    if (creditCents < 0) return 0;
    return Math.floor(creditCents / 7);
  },
  // Plafonds d'affiliation par plan
  getAffiliateCap: (planId: string): number | null => {
    if (planId === 'fisherman_standard') return 200;
    return null; // Illimité pour Pro/Elite
  },
} as const;

// ============================================
// CHALLENGES ET RÉCOMPENSES (à venir)
// ============================================
export const CHALLENGES = {
  PREMIUM_5: {
    id: 'premium_5',
    description: '5 Premium via ton lien',
    rewardSms: 500,
  },
  PREMIUM_PLUS_10: {
    id: 'premium_plus_10',
    description: '10 Premium+ via ton lien',
    rewardSms: 1500,
  },
} as const;

// ============================================
// TYPES
// ============================================
export type FishermanPlanId = keyof typeof FISHERMAN_PLANS;
export type PremiumPlanId = keyof typeof PREMIUM_PLANS;
export type SmsPackId = keyof typeof SMS_PACKS;
