/**
 * Utility functions for consistent location display across the app.
 * 
 * RULE: 
 * - In lists/cards: show LABEL only (e.g., "Marché JLouis")
 * - In details: show LABEL + ADDRESS (e.g., "Marché JLouis - 123 Rue du Port, Hyères")
 */

interface SalePoint {
  id: string;
  label: string;
  address: string;
  description?: string | null;
}

interface Port {
  id?: string;
  name: string;
  city: string;
}

/**
 * Get display label for a location (list/card view - short version)
 */
export function getLocationLabel(options: {
  salePoint?: SalePoint | null;
  port?: Port | null;
  fallback?: string;
}): string {
  const { salePoint, port, fallback = 'Point de vente' } = options;

  if (salePoint?.label) {
    return salePoint.label;
  }

  if (port?.name) {
    return port.name;
  }

  return fallback;
}

/**
 * Get full location string for detail views (label + address)
 */
export function getLocationFull(options: {
  salePoint?: SalePoint | null;
  port?: Port | null;
  fallback?: string;
}): string {
  const { salePoint, port, fallback = 'Point de vente' } = options;

  if (salePoint?.label && salePoint?.address) {
    return `${salePoint.label} - ${salePoint.address}`;
  }

  if (salePoint?.label) {
    return salePoint.label;
  }

  if (port?.name && port?.city) {
    return `${port.name}, ${port.city}`;
  }

  if (port?.name) {
    return port.name;
  }

  return fallback;
}

/**
 * Get just the address part (for secondary display)
 */
export function getLocationAddress(options: {
  salePoint?: SalePoint | null;
  port?: Port | null;
}): string | null {
  const { salePoint, port } = options;

  if (salePoint?.address) {
    return salePoint.address;
  }

  if (port?.city) {
    return port.city;
  }

  return null;
}