/**
 * Contact validation and duplicate detection utilities
 */

import { validateEmail, validateFrenchPhone, type ParsedContact } from './validators';
import type { Database } from '@/integrations/supabase/types';

type Contact = Database['public']['Tables']['fishermen_contacts']['Row'];

/**
 * Normalize phone number by removing spaces, dashes, and dots
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[\s.-]/g, '');
}

/**
 * Check if a contact is a duplicate of existing contacts
 */
export function isDuplicate(
  contact: ParsedContact,
  existingContacts: Contact[]
): boolean {
  if (!existingContacts || existingContacts.length === 0) return false;
  
  return existingContacts.some(existing => {
    // Check email match
    if (contact.email && existing.email) {
      if (contact.email.toLowerCase() === existing.email.toLowerCase()) {
        return true;
      }
    }
    
    // Check phone match (normalize phone numbers for comparison)
    if (contact.phone && existing.phone) {
      if (normalizePhone(contact.phone) === normalizePhone(existing.phone)) {
        return true;
      }
    }
    
    return false;
  });
}

/**
 * Validate a batch of contacts and mark duplicates
 */
export function validateContactsBatch(
  contacts: ParsedContact[],
  existingContacts: Contact[]
): ParsedContact[] {
  return contacts.map(contact => {
    const errors = [...contact.errors];
    const duplicate = isDuplicate(contact, existingContacts);
    
    return {
      ...contact,
      isDuplicate: duplicate,
      errors
    };
  });
}

/**
 * Get import statistics for a batch of contacts
 */
export interface ImportStats {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  importable: number;
}

export function getImportStats(contacts: ParsedContact[]): ImportStats {
  const total = contacts.length;
  const valid = contacts.filter(c => c.isValid).length;
  const invalid = contacts.filter(c => !c.isValid).length;
  const duplicates = contacts.filter(c => c.isDuplicate).length;
  const importable = contacts.filter(c => c.isValid && !c.isDuplicate).length;
  
  return {
    total,
    valid,
    invalid,
    duplicates,
    importable
  };
}

/**
 * Re-export validation functions for convenience
 */
export { validateEmail, validateFrenchPhone };
export type { ParsedContact };
