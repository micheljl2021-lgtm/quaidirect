import { useMemo } from 'react';
import { getBasinFromDepartement, getPortFileForBasin } from '@/lib/ports';

export const usePortFile = (departement?: string | null) => {
  const basin = useMemo(
    () => (departement ? getBasinFromDepartement(departement) : null),
    [departement]
  );

  const portFile = useMemo(
    () => (basin ? getPortFileForBasin(basin) : null),
    [basin]
  );

  return { basin, portFile };
};
