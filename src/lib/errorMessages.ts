/**
 * Utility to convert technical SQL/Supabase errors to user-friendly messages
 */
export function getUserFriendlyError(error: unknown): string {
  const errorObj = error as { message?: string; error_description?: string; code?: string };
  const message = errorObj?.message || errorObj?.error_description || '';
  const code = errorObj?.code || '';
  
  // Map technical errors to user-friendly messages
  const errorMap: Record<string, string> = {
    // Database errors
    'invalid input syntax for type uuid': 'Données invalides. Veuillez resélectionner les espèces.',
    'duplicate key value': 'Cet élément existe déjà.',
    'violates foreign key constraint': 'Référence invalide. Veuillez rafraîchir la page.',
    'violates row-level security': 'Action non autorisée. Vérifiez votre connexion.',
    'violates check constraint': 'Les données saisies ne respectent pas les contraintes.',
    'unique constraint': 'Cet élément existe déjà.',
    'null value in column': 'Un champ obligatoire est manquant.',
    'value too long': 'Le texte saisi est trop long.',
    'relation does not exist': 'Erreur technique. Contactez le support.',
    'column does not exist': 'Erreur technique. Contactez le support.',
    
    // Auth errors
    'rate limit exceeded': 'Trop de requêtes. Patientez quelques secondes.',
    'jwt expired': 'Votre session a expiré. Veuillez vous reconnecter.',
    'jwt malformed': 'Session invalide. Veuillez vous reconnecter.',
    'not authenticated': 'Vous devez être connecté pour effectuer cette action.',
    'permission denied': 'Vous n\'avez pas les droits pour cette action.',
    'invalid login credentials': 'Email ou mot de passe incorrect.',
    'user not found': 'Utilisateur non trouvé.',
    'email not confirmed': 'Veuillez confirmer votre email avant de vous connecter.',
    'user already registered': 'Un compte existe déjà avec cet email.',
    
    // Network errors
    'network error': 'Erreur de connexion. Vérifiez votre connexion internet.',
    'fetch failed': 'Erreur de connexion. Vérifiez votre connexion internet.',
    'timeout': 'La requête a pris trop de temps. Réessayez.',
    'failed to fetch': 'Impossible de contacter le serveur. Réessayez.',
    
    // Validation errors
    'invalid email': 'Adresse email invalide.',
    'invalid phone': 'Numéro de téléphone invalide.',
    'password too short': 'Le mot de passe doit contenir au moins 6 caractères.',
    'passwords do not match': 'Les mots de passe ne correspondent pas.',
    
    // Stripe errors
    'card_declined': 'Carte refusée. Essayez une autre carte.',
    'insufficient_funds': 'Fonds insuffisants.',
    'expired_card': 'Carte expirée.',
    'incorrect_cvc': 'Code de sécurité incorrect.',
    
    // Storage errors
    'file too large': 'Fichier trop volumineux (max 5 Mo).',
    'invalid file type': 'Type de fichier non autorisé.',
    'storage quota exceeded': 'Espace de stockage plein.',
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
