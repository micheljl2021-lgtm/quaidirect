import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ArrivagesGrouped {
  active: any[];      // sale_start_time + 1h > NOW
  history: any[];     // sale_start_time + 1h <= NOW
}

/**
 * Hook pour récupérer les arrivages avec séparation actifs/historique
 * Règle: un arrivage bascule en historique 1h après sale_start_time
 */
export const useArrivagesWithHistory = (fishermanId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['arrivages-with-history', fishermanId],
    queryFn: async () => {
      let query = supabase
        .from('drops')
        .select(`
          *,
          fishermen:fisherman_id (
            id,
            boat_name,
            company_name,
            photo_url,
            slug
          ),
          fisherman_sale_points:sale_point_id (
            id,
            label,
            address,
            latitude,
            longitude
          ),
          ports:port_id (
            id,
            name,
            city
          ),
          drop_species (
            species:species_id (
              id,
              name
            )
          ),
          drop_photos (
            id,
            photo_url,
            display_order
          )
        `)
        .order('sale_start_time', { ascending: false });

      // Filtrer par pêcheur si spécifié
      if (fishermanId) {
        query = query.eq('fisherman_id', fishermanId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const now = new Date();
      const grouped: ArrivagesGrouped = {
        active: [],
        history: []
      };

      data?.forEach(drop => {
        const saleStartTime = new Date(drop.sale_start_time);
        const saleEndTime = new Date(saleStartTime);
        saleEndTime.setHours(saleEndTime.getHours() + 1);

        if (saleEndTime > now) {
          grouped.active.push(drop);
        } else {
          grouped.history.push(drop);
        }
      });

      // Trier actifs par proximité (plus proche en premier)
      grouped.active.sort((a, b) => 
        new Date(a.sale_start_time).getTime() - new Date(b.sale_start_time).getTime()
      );

      // Trier historique par date décroissante (plus récent en premier)
      grouped.history.sort((a, b) => 
        new Date(b.sale_start_time).getTime() - new Date(a.sale_start_time).getTime()
      );

      return grouped;
    },
    staleTime: 60 * 1000, // 1 min refresh pour historique
    refetchInterval: 60 * 1000, // Auto-refresh toutes les minutes
  });
};

export default useArrivagesWithHistory;
