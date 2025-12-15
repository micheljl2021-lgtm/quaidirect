import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SalePoint {
  id: string;
  label: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  fisherman_id: string;
  description?: string | null;
  is_primary?: boolean;
  fishermen: {
    id: string;
    boat_name: string;
    photo_url: string | null;
    bio: string | null;
    fishing_methods: string[] | null;
    company_name: string | null;
    slug: string | null;
  } | null;
}

/**
 * Hook centralisé pour récupérer les points de vente publics
 * Utilise supabase.functions.invoke pour gérer l'auth automatiquement
 * Retourne un tableau vide si non autorisé (401) sans erreur bloquante
 */
export const useSalePoints = () => {
  return useQuery<SalePoint[]>({
    queryKey: ['sale-points-public'],
    queryFn: async (): Promise<SalePoint[]> => {
      const { data, error } = await supabase.functions.invoke('get-public-sale-points');
      
      // Si 401 ou erreur d'auth, retourner tableau vide sans throw
      if (error) {
        // Check for auth-related errors (401, unauthorized, etc.)
        const errorMessage = error.message?.toLowerCase() || '';
        if (
          errorMessage.includes('401') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('jwt') ||
          errorMessage.includes('auth')
        ) {
          console.log('[useSalePoints] Unauthorized - returning empty array for public access');
          return [];
        }
        console.error('[useSalePoints] Error:', error);
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      // Normalize fishermen key and cast to proper type
      return data.map((sp: Record<string, unknown>): SalePoint => {
        // Check for technical prefix key from Supabase join
        const fishermenKey = Object.keys(sp).find(k => k.startsWith('fishermen'));
        const fishermen = fishermenKey ? sp[fishermenKey] : null;
        
        return {
          id: sp.id as string,
          label: sp.label as string,
          address: sp.address as string,
          latitude: sp.latitude as number | null,
          longitude: sp.longitude as number | null,
          photo_url: sp.photo_url as string | null,
          fisherman_id: sp.fisherman_id as string,
          description: sp.description as string | null | undefined,
          is_primary: sp.is_primary as boolean | undefined,
          fishermen: fishermen as SalePoint['fishermen'],
        };
      });
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - sale points rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: false, // Don't retry on auth errors
  });
};

/**
 * Trouve un point de vente par son ID
 */
export const findSalePointById = (
  salePoints: SalePoint[] | undefined,
  id: string | null
): SalePoint | undefined => {
  if (!salePoints || !id) return undefined;
  return salePoints.find((sp) => sp.id === id);
};
