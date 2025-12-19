import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFishermanPaymentStatus } from '@/hooks/useFishermanPaymentStatus';
import { Loader2 } from 'lucide-react';

export const ProtectedFisherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading: authLoading } = useAuth();
  const { isPaid, isLoading: paymentLoading } = useFishermanPaymentStatus();

  // Show loader while auth is loading OR while checking payment
  if (authLoading || paymentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;
  
  // Admins can access all pages without payment check
  if (userRole === 'admin') return <>{children}</>;
  
  if (isPaid === false) return <Navigate to="/pecheur/payment" />;
  
  return <>{children}</>;
};
