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

export interface UseSalePointsOptions {
  enabled?: boolean;
  userId?: string;
}

export interface UseSalePointsResult {
  data: SalePoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isUnauthorized: boolean;
  error: Error | null;
}

/**
 * Hook centralisé pour récupérer les points de vente
 * IMPORTANT: Requiert une authentification (verify_jwt=true)
 * - Si userId est absent ou enabled=false: aucun appel réseau, retourne []
 * - Si 401/403: retourne [] avec flag isUnauthorized=true
 * 
 * @param options.userId - L'ID utilisateur authentifié (obligatoire pour fetch)
 * @param options.enabled - Active/désactive le fetch (default: true)
 */
export const useSalePoints = (options: UseSalePointsOptions = {}): UseSalePointsResult => {
  const { enabled = true, userId } = options;
  
  // Only fetch if user is authenticated AND enabled
  const shouldFetch = !!userId && enabled;

  const query = useQuery<SalePoint[], Error>({
    queryKey: ['sale-points', userId || 'anonymous'],
    queryFn: async (): Promise<SalePoint[]> => {
      // Double-check: don't fetch if no userId
      if (!userId) {
        console.log('[useSalePoints] No userId - returning empty array (no network call)');
        return [];
      }

      const { data, error } = await supabase.functions.invoke('get-public-sale-points');
      
      // If 401/403 or auth error, return empty array without throw
      if (error) {
        const errorMessage = error.message?.toLowerCase() || '';
        if (
          errorMessage.includes('401') ||
          errorMessage.includes('403') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('jwt') ||
          errorMessage.includes('auth')
        ) {
          console.log('[useSalePoints] Unauthorized - returning empty array');
          // Return empty but let isError be true for isUnauthorized detection
          throw new Error('UNAUTHORIZED');
        }
        console.error('[useSalePoints] Error:', error);
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        return [];
      }
      
      // Normalize fishermen key and cast to proper type
      return data.map((sp: Record<string, unknown>): SalePoint => {
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
    enabled: shouldFetch, // Prevents any network call if user not authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Detect unauthorized error
  const isUnauthorized = query.isError && query.error?.message === 'UNAUTHORIZED';

  return {
    data: query.isError ? [] : query.data,
    isLoading: query.isLoading,
    isError: query.isError && !isUnauthorized,
    isUnauthorized,
    error: isUnauthorized ? null : query.error,
  };
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
