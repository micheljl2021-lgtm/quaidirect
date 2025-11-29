/**
 * Centralized authentication redirection utility
 * Returns the appropriate dashboard path based on user role
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
