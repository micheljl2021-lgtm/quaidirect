import { describe, it, expect } from 'vitest';

// Extracted normalization function for testing
function normalizePhoneToE164(phone: string): string | null {
  // 1. Clean: trim, remove spaces/dots/dashes/parentheses
  let cleaned = phone.trim().replace(/[\s.\-()]/g, '');
  
  // 2. If starts with 0 and length 10 (French format) -> +33
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+33' + cleaned.substring(1);
  }
  
  // 3. If starts with 33 (without +) -> add +
  if (cleaned.startsWith('33') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  // 4. If starts with 00 (international format) -> replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }
  
  // 5. Final validation: must match /^\+\d{8,15}$/
  if (!/^\+\d{8,15}$/.test(cleaned)) {
    return null; // Invalid number
  }
  
  return cleaned;
}

describe('Phone Number Normalization to E.164', () => {
  describe('French format (06XXXXXXXX)', () => {
    it('normalizes valid French mobile number starting with 06', () => {
      expect(normalizePhoneToE164('0612345678')).toBe('+33612345678');
    });

    it('normalizes valid French mobile number starting with 07', () => {
      expect(normalizePhoneToE164('0712345678')).toBe('+33712345678');
    });

    it('handles French format with spaces', () => {
      expect(normalizePhoneToE164('06 12 34 56 78')).toBe('+33612345678');
    });

    it('handles French format with dots', () => {
      expect(normalizePhoneToE164('06.12.34.56.78')).toBe('+33612345678');
    });

    it('handles French format with dashes', () => {
      expect(normalizePhoneToE164('06-12-34-56-78')).toBe('+33612345678');
    });

    it('handles French format with parentheses', () => {
      expect(normalizePhoneToE164('(06) 12 34 56 78')).toBe('+33612345678');
    });

    it('handles mixed separators', () => {
      expect(normalizePhoneToE164('06.12-34 56(78)')).toBe('+33612345678');
    });
  });

  describe('International format (33XXXXXXXXX)', () => {
    it('normalizes international format without plus', () => {
      expect(normalizePhoneToE164('33612345678')).toBe('+33612345678');
    });

    it('preserves already correct E.164 format', () => {
      expect(normalizePhoneToE164('+33612345678')).toBe('+33612345678');
    });

    it('handles international format with spaces', () => {
      expect(normalizePhoneToE164('33 6 12 34 56 78')).toBe('+33612345678');
    });
  });

  describe('00 prefix format (0033XXXXXXXXX)', () => {
    it('normalizes 00 prefix to +', () => {
      expect(normalizePhoneToE164('0033612345678')).toBe('+33612345678');
    });

    it('handles 00 prefix with spaces', () => {
      expect(normalizePhoneToE164('00 33 6 12 34 56 78')).toBe('+33612345678');
    });
  });

  describe('Other valid international numbers', () => {
    it('normalizes US number', () => {
      expect(normalizePhoneToE164('0015551234567')).toBe('+15551234567');
    });

    it('preserves valid E.164 US number', () => {
      expect(normalizePhoneToE164('+15551234567')).toBe('+15551234567');
    });

    it('normalizes UK number', () => {
      expect(normalizePhoneToE164('00447123456789')).toBe('+447123456789');
    });
  });

  describe('Invalid phone numbers', () => {
    it('rejects too short numbers', () => {
      expect(normalizePhoneToE164('0612345')).toBeNull();
    });

    it('rejects too long numbers', () => {
      expect(normalizePhoneToE164('06123456789012345678')).toBeNull();
    });

    it('rejects numbers with letters', () => {
      expect(normalizePhoneToE164('06ABCDEFGH')).toBeNull();
    });

    it('rejects empty string', () => {
      expect(normalizePhoneToE164('')).toBeNull();
    });

    it('rejects non-numeric after cleaning', () => {
      expect(normalizePhoneToE164('ABC-DEF-GHIJ')).toBeNull();
    });

    it('rejects number without plus that is too short', () => {
      expect(normalizePhoneToE164('612345')).toBeNull();
    });

    it('rejects 10-digit number not starting with 0', () => {
      expect(normalizePhoneToE164('6123456789')).toBeNull();
    });
  });

  describe('Whitespace handling', () => {
    it('trims leading whitespace', () => {
      expect(normalizePhoneToE164('  0612345678')).toBe('+33612345678');
    });

    it('trims trailing whitespace', () => {
      expect(normalizePhoneToE164('0612345678  ')).toBe('+33612345678');
    });

    it('trims both leading and trailing whitespace', () => {
      expect(normalizePhoneToE164('  0612345678  ')).toBe('+33612345678');
    });
  });

  describe('Edge cases', () => {
    it('handles minimum valid length (8 digits)', () => {
      expect(normalizePhoneToE164('+12345678')).toBe('+12345678'); // 8 digits, valid
    });

    it('handles maximum valid length (15 digits)', () => {
      expect(normalizePhoneToE164('+123456789012345')).toBe('+123456789012345');
      expect(normalizePhoneToE164('+1234567890123456')).toBeNull(); // 16 digits, too long
    });

    it('handles numbers that look valid but are malformed', () => {
      expect(normalizePhoneToE164('++')).toBeNull();
      expect(normalizePhoneToE164('++33612345678')).toBeNull();
    });
  });
});
