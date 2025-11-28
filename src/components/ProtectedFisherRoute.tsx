import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { isWhitelistedFisher } from '@/config/fisherWhitelist';

export const ProtectedFisherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPayment = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      // Check whitelist first
      if (isWhitelistedFisher(user.email, user.id)) {
        setIsPaid(true);
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
  }, [user]);

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
