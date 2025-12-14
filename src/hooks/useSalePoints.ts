import { useQuery } from "@tanstack/react-query";

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
 * Utilise un cache de 10 minutes car les points de vente changent rarement
 */
export const useSalePoints = () => {
  return useQuery<SalePoint[]>({
    queryKey: ['sale-points-public'],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-sale-points`
      );
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des points de vente');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - sale points rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchOnWindowFocus: false, // Don't refetch on window focus
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
