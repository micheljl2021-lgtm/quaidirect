import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export const ProtectedFisherRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading before checking payment
    if (authLoading) return;
    
    const checkPayment = async () => {
      if (!user) {
        setCheckingPayment(false);
        return;
      }
      
      try {
        // A) Check whitelist (graceful fail if RLS denies)
        let isWhitelisted = false;
        try {
          const { data: whitelistData } = await supabase
            .from('fisherman_whitelist')
            .select('id')
            .eq('email', user.email?.toLowerCase() || '')
            .maybeSingle();
          
          if (whitelistData) {
            isWhitelisted = true;
          }
        } catch (whitelistError) {
          // RLS may block this - continue without crash
          console.warn('Whitelist check blocked by RLS, continuing:', whitelistError);
        }
        
        if (isWhitelisted) {
          setIsPaid(true);
          setCheckingPayment(false);
          return;
        }
        
        // B) Check fishermen.onboarding_payment_status
        const { data: fisherman } = await supabase
          .from('fishermen')
          .select('onboarding_payment_status')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (fisherman?.onboarding_payment_status === 'paid') {
          setIsPaid(true);
          setCheckingPayment(false);
          return;
        }
        
        // C) Check payments table for active subscription (like PecheurOnboarding)
        const { data: paymentData } = await supabase
          .from('payments')
          .select('id, status, plan')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .ilike('plan', 'fisherman%')
          .maybeSingle();
        
        if (paymentData) {
          setIsPaid(true);
          setCheckingPayment(false);
          return;
        }
        
        // None of the checks passed
        setIsPaid(false);
      } catch (error) {
        console.error('Error checking payment:', error);
        setIsPaid(false);
      } finally {
        setCheckingPayment(false);
      }
    };
    
    checkPayment();
  }, [user, authLoading]);

  // Show loader while auth is loading OR while checking payment
  if (authLoading || checkingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" />;
  
  if (isPaid === false) return <Navigate to="/pecheur/payment" />;
  
  return <>{children}</>;
};
