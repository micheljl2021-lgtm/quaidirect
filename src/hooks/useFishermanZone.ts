import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useFishermanZone() {
  const { user, userRole } = useAuth();
  const isFisherman = userRole === 'fisherman';

  const { data: fishermanZone, isLoading } = useQuery({
    queryKey: ['fisherman-zone', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('fishermen')
        .select('main_fishing_zone')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching fisherman zone:', error);
        return null;
      }
      
      return data?.main_fishing_zone || null;
    },
    enabled: !!user?.id && isFisherman,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    fishermanZone,
    isFisherman,
    isLoading,
  };
}
