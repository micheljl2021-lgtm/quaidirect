/**
 * Utility to convert technical SQL/Supabase errors to user-friendly messages
 */
export function getUserFriendlyError(error: any): string {
  const message = error?.message || error?.error_description || '';
  
  // Map technical errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'invalid input syntax for type uuid': 'Données invalides. Veuillez resélectionner les espèces.',
    'duplicate key value': 'Cet élément existe déjà.',
    'violates foreign key constraint': 'Référence invalide. Veuillez rafraîchir la page.',
    'violates row-level security': 'Action non autorisée. Vérifiez votre connexion.',
    'violates check constraint': 'Les données saisies ne respectent pas les contraintes.',
    'rate limit exceeded': 'Trop de requêtes. Patientez quelques secondes.',
    'jwt expired': 'Votre session a expiré. Veuillez vous reconnecter.',
    'jwt malformed': 'Session invalide. Veuillez vous reconnecter.',
    'not authenticated': 'Vous devez être connecté pour effectuer cette action.',
    'permission denied': 'Vous n\'avez pas les droits pour cette action.',
    'network error': 'Erreur de connexion. Vérifiez votre connexion internet.',
    'timeout': 'La requête a pris trop de temps. Réessayez.',
    'unique constraint': 'Cet élément existe déjà.',
    'null value in column': 'Un champ obligatoire est manquant.',
    'value too long': 'Le texte saisi est trop long.',
    'invalid email': 'Adresse email invalide.',
    'invalid phone': 'Numéro de téléphone invalide.',
  };

  const lowerMessage = message.toLowerCase();
  
  for (const [key, friendlyMessage] of Object.entries(errorMap)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return friendlyMessage;
    }
  }
  
  // If no specific match, return generic message
  return 'Une erreur est survenue. Réessayez ou contactez le support.';
}

/**
 * Log error for debugging while returning user-friendly message
 */
export function handleError(error: any, context?: string): string {
  // Log technical details for debugging
  console.error(`[${context || 'Error'}]`, error);
  
  // Return user-friendly message
  return getUserFriendlyError(error);
}
