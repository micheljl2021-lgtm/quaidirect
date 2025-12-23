/**
 * Utility functions for consistent drop location display
 * Handles privacy rules: anonyme = masked address, connecté = full address
 */

interface SalePoint {
  id: string;
  label: string;
  address?: string | null;
  photo_url?: string | null;
}

interface Port {
  id: string;
  name: string;
  city?: string;
}

interface DropLocationParams {
  isAuthenticated: boolean;
  salePointId?: string | null;
  salePoints?: SalePoint[];
  port?: Port | null;
}

/**
 * Get the appropriate location label for a drop
 * - Authenticated users see full sale point details
 * - Anonymous users see masked label "Point de vente partenaire"
 */
export function getDropLocationLabel({
  isAuthenticated,
  salePointId,
  salePoints,
  port,
}: DropLocationParams): string {
  // If port is available, use it (public info)
  if (port?.name) {
    return port.city ? `${port.name}, ${port.city}` : port.name;
  }

  // Sale point handling
  if (salePointId) {
    if (isAuthenticated && salePoints) {
      const sp = salePoints.find(s => s.id === salePointId);
      if (sp) {
        return sp.address ? `${sp.label} - ${sp.address}` : sp.label;
      }
    }
    // Anonymous or sale point not found: masked label
    return 'Point de vente partenaire';
  }

  return 'Lieu de vente';
}

/**
 * Get sale point details if available and user is authenticated
 */
export function getSalePointDetails(
  isAuthenticated: boolean,
  salePointId: string | null | undefined,
  salePoints?: SalePoint[]
): SalePoint | null {
  if (!isAuthenticated || !salePointId || !salePoints) return null;
  return salePoints.find(sp => sp.id === salePointId) || null;
}
