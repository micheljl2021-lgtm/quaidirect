/**
 * Validation utilities for French business and contact data
 */

// SIRET: exactly 14 digits
export function isValidSiret(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '');
  return /^\d{14}$/.test(cleaned);
}

export function formatSiret(siret: string): string {
  const cleaned = siret.replace(/\s/g, '');
  // Format: XXX XXX XXX XXXXX
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4');
}

// French phone: 10 digits starting with 0, or international format
export function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.-]/g, '');
  // French format: 0612345678 or +33612345678
  return /^(0[1-9]\d{8}|\+33[1-9]\d{8})$/.test(cleaned);
}

export function formatFrenchPhone(phone: string): string {
  const cleaned = phone.replace(/[\s.-]/g, '');
  if (cleaned.startsWith('+33')) {
    const national = '0' + cleaned.slice(3);
    return national.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// GPS coordinates for France (mainland + Corsica + overseas)
// Mainland France: lat 41.3-51.1, lng -5.1-9.6
// Including some margin for overseas territories
export function isValidFranceGPS(lat: number, lng: number): boolean {
  // Mainland France + Corsica
  const isMainland = lat >= 41.3 && lat <= 51.1 && lng >= -5.1 && lng <= 9.6;
  
  // Guadeloupe, Martinique, etc.
  const isCaribbean = lat >= 14.0 && lat <= 18.5 && lng >= -64.0 && lng <= -59.0;
  
  // Réunion
  const isReunion = lat >= -21.5 && lat <= -20.8 && lng >= 55.2 && lng <= 55.9;
  
  // Mayotte
  const isMayotte = lat >= -13.1 && lat <= -12.6 && lng >= 45.0 && lng <= 45.3;
  
  // French Guiana
  const isGuiana = lat >= 2.0 && lat <= 6.0 && lng >= -55.0 && lng <= -51.5;
  
  return isMainland || isCaribbean || isReunion || isMayotte || isGuiana;
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Combined validators with error messages
export function validateSiret(siret: string): ValidationResult {
  if (!siret || siret.trim() === '') {
    return { isValid: false, error: 'Le SIRET est requis' };
  }
  if (!isValidSiret(siret)) {
    return { isValid: false, error: 'Le SIRET doit contenir exactement 14 chiffres' };
  }
  return { isValid: true };
}

export function validateFrenchPhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { isValid: true }; // Phone is optional
  }
  if (!isValidFrenchPhone(phone)) {
    return { isValid: false, error: 'Format de téléphone invalide (ex: 06 12 34 56 78)' };
  }
  return { isValid: true };
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: true }; // Email may be optional in some contexts
  }
  if (!isValidEmail(email)) {
    return { isValid: false, error: 'Format d\'email invalide' };
  }
  return { isValid: true };
}

export function validateGPSCoordinates(lat: number | null, lng: number | null): ValidationResult {
  if (lat === null || lng === null) {
    return { isValid: true }; // Coordinates are optional
  }
  if (isNaN(lat) || isNaN(lng)) {
    return { isValid: false, error: 'Coordonnées GPS invalides' };
  }
  if (!isValidFranceGPS(lat, lng)) {
    return { isValid: false, error: 'Les coordonnées doivent être en France' };
  }
  return { isValid: true };
}

// CSV parsing utilities
export interface ParsedContact {
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  contact_group: string;
  isValid: boolean;
  errors: string[];
  isDuplicate?: boolean;
}

export function detectCSVSeparator(csv: string): string {
  const firstLine = csv.split('\n')[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

export function parseCSVContacts(csv: string, separator?: string): { 
  contacts: ParsedContact[]; 
  validCount: number; 
  invalidCount: number;
  separator: string;
} {
  const detectedSeparator = separator || detectCSVSeparator(csv);
  const lines = csv.trim().split('\n');
  const contacts: ParsedContact[] = [];
  let validCount = 0;
  let invalidCount = 0;

  // Skip header line (index 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(detectedSeparator).map(s => s.trim().replace(/^["']|["']$/g, ''));
    const [email, phone, first_name, last_name, contact_group] = parts;

    const errors: string[] = [];

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      errors.push('Email invalide');
    }

    // Validate phone if provided
    if (phone && !isValidFrenchPhone(phone)) {
      errors.push('Téléphone invalide');
    }

    // Must have at least email or phone
    if (!email && !phone) {
      errors.push('Email ou téléphone requis');
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    contacts.push({
      email: email || null,
      phone: phone || null,
      first_name: first_name || null,
      last_name: last_name || null,
      contact_group: contact_group || 'general',
      isValid,
      errors
    });
  }

  return { contacts, validCount, invalidCount, separator: detectedSeparator };
}

export function exportContactsToCSV(contacts: any[]): string {
  const header = 'email,phone,first_name,last_name,contact_group';
  const rows = contacts.map(c => 
    [c.email || '', c.phone || '', c.first_name || '', c.last_name || '', c.contact_group || 'general']
      .map(field => `"${(field || '').replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header, ...rows].join('\n');
}
