export type FishingBasin = 'MEDITERRANEE' | 'MANCHE' | 'ATLANTIQUE';

const medDeps = ['06', '11', '13', '30', '34', '66', '83', '2A', '2B'];
const mancheDeps = ['14', '22', '29', '35', '50', '56', '76'];
const atlantiqueDeps = ['17', '29', '33', '40', '44', '56', '64'];

export const getBasinFromDepartement = (dep: string): FishingBasin => {
  const clean = dep.padStart(2, '0').toUpperCase();

  if (medDeps.includes(clean)) return 'MEDITERRANEE';
  if (mancheDeps.includes(clean)) return 'MANCHE';
  return 'ATLANTIQUE';
};

/**
 * @deprecated Use PortsListModal with dynamic Supabase query instead.
 * This function is kept for backward compatibility but should not be used.
 * Ports are now fetched from the database and exported dynamically.
 */
export const getPortFileForBasin = (_basin: FishingBasin): string | null => {
  // Deprecated - Use PortsListModal for dynamic port access
  return null;
};

/**
 * Get departments for a given basin
 */
export const getDepartmentsForBasin = (basin: FishingBasin): string[] => {
  switch (basin) {
    case 'MEDITERRANEE':
      return medDeps;
    case 'MANCHE':
      return mancheDeps;
    case 'ATLANTIQUE':
      return atlantiqueDeps;
    default:
      return [];
  }
};
