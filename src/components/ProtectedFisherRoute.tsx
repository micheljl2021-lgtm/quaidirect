import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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
      
      try {
        // Check whitelist in database first
        const { data: whitelistData } = await supabase
          .from('fisherman_whitelist')
          .select('id')
          .eq('email', user.email?.toLowerCase())
          .maybeSingle();
        
        if (whitelistData) {
          setIsPaid(true);
          setLoading(false);
          return;
        }
        
        // Check regular payment status
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
