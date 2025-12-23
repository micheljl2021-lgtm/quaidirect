import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SalePoint {
  id: string;
  label: string;
  address: string | null; // Peut être null pour les anonymes
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
}

export interface UseSalePointsResult {
  data: SalePoint[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isUnauthorized: boolean;
  error: Error | null;
}

/**
 * Hook centralisé pour récupérer les points de vente.
 * 
 * IMPORTANT:
 * - Les anonymes obtiennent des adresses MASQUÉES (address: null)
 * - Les utilisateurs connectés obtiennent les adresses complètes
 * 
 * Note technique: le cache React Query doit dépendre de l'état de session,
 * sinon on peut garder en mémoire une réponse "anonyme" et l'afficher même après login.
 */
export const useSalePoints = (options: UseSalePointsOptions = {}): UseSalePointsResult => {
  const { enabled = true } = options;
  const { session } = useAuth();

  // Cache key séparée entre anonyme et connecté (évite de réutiliser des adresses masquées)
  const authKey = session?.user?.id ?? 'anon';

  const query = useQuery<SalePoint[], Error>({
    queryKey: ['sale-points-public', authKey],
    queryFn: async (): Promise<SalePoint[]> => {
      const { data, error } = await supabase.functions.invoke('get-public-sale-points');

      if (error) {
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
          address: (sp.address as string | null) || null, // Peut être null pour les anonymes
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
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isUnauthorized: false,
    error: query.error,
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
