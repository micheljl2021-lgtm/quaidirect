/**
 * Centralized authentication redirection utility
 * Returns the appropriate dashboard path based on user role
 * 
 * Note: For client premium access, use getRedirectPathForClient() 
 * which considers subscription level from payments table
 */
export const getRedirectPathByRole = (userRole: string | null): string => {
  switch (userRole) {
    case 'admin':
      return '/dashboard/admin';
    case 'fisherman':
      return '/dashboard/pecheur';
    case 'premium':
      return '/dashboard/premium';
    case 'user':
    default:
      return '/dashboard/user';
  }
};

/**
 * Returns the appropriate client dashboard path based on subscription level
 * This should be used for non-fisherman, non-admin users
 * 
 * @param isPremium - Whether user has premium or premium+ subscription in payments table
 * @returns Dashboard path for the client
 */
export const getClientDashboardPath = (isPremium: boolean): string => {
  return isPremium ? '/dashboard/premium' : '/dashboard/user';
};
