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

export const getPortFileForBasin = (basin: FishingBasin): string => {
  switch (basin) {
    case 'MEDITERRANEE':
      return '/ports/ports-mediterranee.csv';
    case 'MANCHE':
      return '/ports/ports-manche.csv';
    case 'ATLANTIQUE':
    default:
      return '/ports/ports-atlantique.csv';
  }
};
