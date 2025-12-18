import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface FishermanPaymentStatus {
  isPaid: boolean | null;
  isLoading: boolean;
  paymentSource: 'whitelist' | 'fishermen' | 'payments' | 'role' | null;
}

/**
 * Centralized hook to check if a fisherman has paid for access.
 * Checks in order: whitelist, fishermen.onboarding_payment_status, payments table, user_roles.
 */
export function useFishermanPaymentStatus(): FishermanPaymentStatus {
  const { user, loading: authLoading } = useAuth();
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSource, setPaymentSource] = useState<FishermanPaymentStatus['paymentSource']>(null);

  useEffect(() => {
    // Wait for auth to finish loading before checking payment
    if (authLoading) return;

    const checkPaymentStatus = async () => {
      if (!user) {
        setIsPaid(null);
        setIsLoading(false);
        return;
      }

      try {
        // A) Check whitelist (graceful fail if RLS denies)
        try {
          const { data: whitelistData } = await supabase
            .from('fisherman_whitelist')
            .select('id')
            .eq('email', user.email?.toLowerCase() || '')
            .maybeSingle();

          if (whitelistData) {
            setIsPaid(true);
            setPaymentSource('whitelist');
            setIsLoading(false);
            return;
          }
        } catch (whitelistError) {
          // RLS may block this - continue without crash
          console.warn('Whitelist check blocked by RLS, continuing:', whitelistError);
        }

        // B) Check fishermen.onboarding_payment_status
        const { data: fisherman } = await supabase
          .from('fishermen')
          .select('onboarding_payment_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fisherman?.onboarding_payment_status === 'paid') {
          setIsPaid(true);
          setPaymentSource('fishermen');
          setIsLoading(false);
          return;
        }

        // C) Check payments table for active subscription
        const { data: paymentData } = await supabase
          .from('payments')
          .select('id, status, plan')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .ilike('plan', 'fisherman%')
          .maybeSingle();

        if (paymentData) {
          setIsPaid(true);
          setPaymentSource('payments');
          setIsLoading(false);
          return;
        }

        // D) Check if user has fisherman role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'fisherman')
          .maybeSingle();

        if (roleData) {
          setIsPaid(true);
          setPaymentSource('role');
          setIsLoading(false);
          return;
        }

        // None of the checks passed
        setIsPaid(false);
        setPaymentSource(null);
      } catch (error) {
        console.error('Error checking payment status:', error);
        setIsPaid(false);
        setPaymentSource(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkPaymentStatus();
  }, [user, authLoading]);

  return { isPaid, isLoading, paymentSource };
}
