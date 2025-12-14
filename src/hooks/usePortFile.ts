import { useMemo } from 'react';
import { getBasinFromDepartement, FishingBasin } from '@/lib/ports';

/**
 * Hook to get the fishing basin from a department code.
 * Note: Port files are deprecated. Use PortsListModal with dynamic Supabase query instead.
 */
export const usePortFile = (departement?: string | null) => {
  const basin = useMemo(
    () => (departement ? getBasinFromDepartement(departement) : null),
    [departement]
  );

  // portFile is deprecated - always returns null
  // Use PortsListModal component for dynamic port access
  const portFile = null;

  return { basin, portFile };
};
