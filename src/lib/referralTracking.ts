/**
 * Système de suivi des parrainages pêcheur
 * Capture et persiste le code d'affiliation pour attribution lors du checkout
 */

const REFERRER_CODE_KEY = 'referrer_code';
const REFERRER_TIMESTAMP_KEY = 'referrer_timestamp';
const REFERRER_FISHERMAN_ID_KEY = 'referrer_fisherman_id';
const REFERRAL_EXPIRY_DAYS = 30;

/**
 * Capture le code de parrainage depuis l'URL et le stocke en localStorage
 */
export const captureReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode && refCode.trim()) {
    const cleanCode = refCode.trim().toUpperCase();
    localStorage.setItem(REFERRER_CODE_KEY, cleanCode);
    localStorage.setItem(REFERRER_TIMESTAMP_KEY, Date.now().toString());
    if (import.meta.env.DEV) console.log('[REFERRAL] Code captured:', cleanCode);
    return cleanCode;
  }
  
  return null;
};

/**
 * Récupère le code de parrainage stocké (si non expiré)
 */
export const getReferralCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const code = localStorage.getItem(REFERRER_CODE_KEY);
  const timestamp = localStorage.getItem(REFERRER_TIMESTAMP_KEY);
  
  if (!code || !timestamp) return null;
  
  // Vérifier l'expiration (30 jours)
  const storedAt = parseInt(timestamp, 10);
  const expiryMs = REFERRAL_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  
  if (Date.now() - storedAt > expiryMs) {
    clearReferralData();
    if (import.meta.env.DEV) console.log('[REFERRAL] Code expired, cleared');
    return null;
  }
  
  return code;
};

/**
 * Stocke l'ID du pêcheur parrain (après résolution du code)
 */
export const setReferrerFishermanId = (fishermanId: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFERRER_FISHERMAN_ID_KEY, fishermanId);
  if (import.meta.env.DEV) console.log('[REFERRAL] Fisherman ID set:', fishermanId);
};

/**
 * Récupère l'ID du pêcheur parrain
 */
export const getReferrerFishermanId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFERRER_FISHERMAN_ID_KEY);
};

/**
 * Efface toutes les données de parrainage
 */
export const clearReferralData = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFERRER_CODE_KEY);
  localStorage.removeItem(REFERRER_TIMESTAMP_KEY);
  localStorage.removeItem(REFERRER_FISHERMAN_ID_KEY);
  if (import.meta.env.DEV) console.log('[REFERRAL] Data cleared');
};

/**
 * Vérifie si un code de parrainage est actif
 */
export const hasActiveReferral = (): boolean => {
  return !!getReferralCode();
};
