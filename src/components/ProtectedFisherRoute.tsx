import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const ProtectedFisherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userRole, loading: authLoading } = useAuth();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPayment = async () => {
      if (authLoading) return; // Wait for auth to load
      if (user && userRole === null) return; // Wait for role to be fetched
      
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const { data } = await supabase
          .from('fishermen')
          .select('onboarding_payment_status')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setIsPaid(data?.onboarding_payment_status === 'paid');
      } catch (error) {
        console.error('Error checking payment:', error);
        setIsPaid(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkPayment();
  }, [user, userRole, authLoading]);

  if (authLoading || (user && userRole === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isPaid === false) return <Navigate to="/pecheur/payment" />;
  
  return <>{children}</>;
};
