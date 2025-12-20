import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type ClientSubscriptionLevel = 'follower' | 'premium' | 'premium_plus';

export interface ClientSubscriptionInfo {
  level: ClientSubscriptionLevel;
  isPremium: boolean;
  isPremiumPlus: boolean;
  isLoading: boolean;
}

/**
 * Hook pour déterminer le niveau d'abonnement client
 * Récupère le subscription_level depuis la table payments
 * Fallback: 'follower' si aucun abonnement actif
 */
export const useClientSubscriptionLevel = (): ClientSubscriptionInfo => {
  const { user } = useAuth();
  const [level, setLevel] = useState<ClientSubscriptionLevel>('follower');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionLevel = async () => {
      if (!user) {
        setLevel('follower');
        setIsLoading(false);
        return;
      }

      try {
        // Récupérer le dernier paiement actif de l'utilisateur (exclure les plans pêcheur)
        const { data, error } = await supabase
          .from('payments')
          .select('subscription_level, status, plan')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching subscription level:', error);
          setLevel('follower');
        } else if (data && data.length > 0) {
          // Filtrer les plans pêcheur côté client pour trouver les abonnements client
          const clientPayment = data.find(p => !p.plan?.toLowerCase().includes('fisherman'));
          
          if (clientPayment?.subscription_level) {
            // Utiliser subscription_level si défini
            const subLevel = clientPayment.subscription_level as ClientSubscriptionLevel;
            if (['follower', 'premium', 'premium_plus'].includes(subLevel)) {
              setLevel(subLevel);
            } else {
              setLevel('follower');
            }
          } else if (clientPayment?.plan) {
            // Fallback: déduire du plan si subscription_level non défini
            const plan = clientPayment.plan.toLowerCase();
            if (plan.includes('premium_plus') || plan.includes('premium+') || plan === 'premium_plus_monthly' || plan === 'premium_plus_yearly') {
              setLevel('premium_plus');
            } else if (plan.includes('premium') && !plan.includes('fisherman')) {
              setLevel('premium');
            } else {
              setLevel('follower');
            }
          } else {
            setLevel('follower');
          }
        } else {
          setLevel('follower');
        }
      } catch (err) {
        console.error('Error in useClientSubscriptionLevel:', err);
        setLevel('follower');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionLevel();
  }, [user]);

  return {
    level,
    isPremium: level === 'premium' || level === 'premium_plus',
    isPremiumPlus: level === 'premium_plus',
    isLoading
  };
};

export default useClientSubscriptionLevel;
