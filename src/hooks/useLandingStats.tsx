import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useLandingStats = () => {
  // Fetch verified fishermen count using RPC
  const { data: fishermenCount } = useQuery({
    queryKey: ['fishermen-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('count_verified_fishermen');
      
      if (error) throw error;
      return data || 0;
    },
  });

  // Fetch total users count using RPC
  const { data: usersCount } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('count_users');
      
      if (error) throw error;
      return data || 0;
    },
  });

  return {
    fishermenCount: fishermenCount || 0,
    usersCount: usersCount || 0,
  };
};
