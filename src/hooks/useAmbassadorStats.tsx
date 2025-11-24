import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAmbassadorStats = () => {
  return useQuery({
    queryKey: ['ambassador-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishermen')
        .select('ambassador_slot')
        .not('ambassador_slot', 'is', null)
        .order('ambassador_slot', { ascending: true });

      if (error) {
        console.error('Error fetching ambassador stats:', error);
        throw error;
      }

      const currentAmbassadors = data?.length || 0;
      const remainingSlots = 10 - currentAmbassadors;
      const nextSlot = currentAmbassadors + 1;

      return {
        currentAmbassadors,
        remainingSlots,
        nextSlot,
        isFull: currentAmbassadors >= 10
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
