import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLandingStats = () => {
  // Fetch verified fishermen count
  const { data: fishermenCount } = useQuery({
    queryKey: ['fishermen-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('fishermen')
        .select('*', { count: 'exact', head: true })
        .not('verified_at', 'is', null);
      
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch total users count (DISTINCT user_id pour éviter les doublons)
  const { data: usersCount } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id');
      
      if (error) throw error;
      // Compter les user_id uniques
      const uniqueUsers = new Set(data?.map(role => role.user_id));
      return uniqueUsers.size || 0;
    },
  });

  return {
    fishermenCount: fishermenCount || 0,
    usersCount: usersCount || 0,
  };
};
