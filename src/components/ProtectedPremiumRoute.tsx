import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const ProtectedPremiumRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();

  // Check if user has active premium subscription
  const { data: hasPremium, isLoading: premiumLoading } = useQuery({
    queryKey: ['premium-status', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('payments')
        .select('status')
        .eq('user_id', user.id)
        .eq('subscription_level', 'premium')
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });

  if (authLoading || premiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasPremium) {
    return <Navigate to="/premium" replace />;
  }

  return <>{children}</>;
};
