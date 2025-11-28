/**
 * Configuration pour la whitelist des pêcheurs
 * Ces pêcheurs sont exemptés du paiement Stripe et ont un accès direct
 */

export const WHITELISTED_FISHERMEN = {
  // Emails des pêcheurs whitelistés
  emails: [
    'micheljlouis048@gmail.com', // Compte test
    'seb.zadeyan.leboncoin@gmail.com', // Ambassadeur Partenaire
  ],
  // User IDs (à remplir si nécessaire)
  userIds: [] as string[],
};

/**
 * Vérifie si un utilisateur est dans la whitelist
 */
export const isWhitelistedFisher = (email?: string, userId?: string): boolean => {
  if (!email && !userId) return false;
  
  if (email && WHITELISTED_FISHERMEN.emails.includes(email.toLowerCase())) {
    return true;
  }
  
  if (userId && WHITELISTED_FISHERMEN.userIds.includes(userId)) {
    return true;
  }
  
  return false;
};
