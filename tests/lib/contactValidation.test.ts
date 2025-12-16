/**
 * Tests for contact validation utilities
 */

import { describe, it, expect } from 'vitest';
import { isDuplicate, validateContactsBatch, getImportStats } from '@/lib/contactValidation';
import type { ParsedContact } from '@/lib/validators';

describe('Contact Validation', () => {
  describe('isDuplicate', () => {
    const existingContacts = [
      { id: '1', email: 'existing@example.com', phone: '0612345678', first_name: 'Existing', last_name: 'User', contact_group: 'general', fisherman_id: '1', created_at: '2024-01-01' },
      { id: '2', email: 'another@example.com', phone: '0687654321', first_name: 'Another', last_name: 'User', contact_group: 'general', fisherman_id: '1', created_at: '2024-01-01' }
    ];

    it('should detect duplicate by email', () => {
      const contact: ParsedContact = {
        email: 'existing@example.com',
        phone: null,
        first_name: 'Test',
        last_name: 'User',
        contact_group: 'general',
        isValid: true,
        errors: []
      };

      expect(isDuplicate(contact, existingContacts)).toBe(true);
    });

    it('should detect duplicate by phone', () => {
      const contact: ParsedContact = {
        email: null,
        phone: '0612345678',
        first_name: 'Test',
        last_name: 'User',
        contact_group: 'general',
        isValid: true,
        errors: []
      };

      expect(isDuplicate(contact, existingContacts)).toBe(true);
    });

    it('should be case-insensitive for email', () => {
      const contact: ParsedContact = {
        email: 'EXISTING@EXAMPLE.COM',
        phone: null,
        first_name: 'Test',
        last_name: 'User',
        contact_group: 'general',
        isValid: true,
        errors: []
      };

      expect(isDuplicate(contact, existingContacts)).toBe(true);
    });

    it('should normalize phone numbers for comparison', () => {
      const contact: ParsedContact = {
        email: null,
        phone: '06 12 34 56 78', // with spaces
        first_name: 'Test',
        last_name: 'User',
        contact_group: 'general',
        isValid: true,
        errors: []
      };

      expect(isDuplicate(contact, existingContacts)).toBe(true);
    });

    it('should not detect duplicate for new contact', () => {
      const contact: ParsedContact = {
        email: 'new@example.com',
        phone: '0699999999',
        first_name: 'New',
        last_name: 'User',
        contact_group: 'general',
        isValid: true,
        errors: []
      };

      expect(isDuplicate(contact, existingContacts)).toBe(false);
    });

    it('should return false when existing contacts is empty', () => {
      const contact: ParsedContact = {
        email: 'test@example.com',
        phone: null,
        first_name: 'Test',
        last_name: 'User',
        contact_group: 'general',
        isValid: true,
        errors: []
      };

      expect(isDuplicate(contact, [])).toBe(false);
    });
  });

  describe('validateContactsBatch', () => {
    const existingContacts = [
      { id: '1', email: 'existing@example.com', phone: null, first_name: 'Existing', last_name: 'User', contact_group: 'general', fisherman_id: '1', created_at: '2024-01-01' }
    ];

    it('should mark contacts as duplicates', () => {
      const contacts: ParsedContact[] = [
        { email: 'existing@example.com', phone: null, first_name: 'Test', last_name: 'One', contact_group: 'general', isValid: true, errors: [] },
        { email: 'new@example.com', phone: '0612345678', first_name: 'Test', last_name: 'Two', contact_group: 'general', isValid: true, errors: [] }
      ];

      const validated = validateContactsBatch(contacts, existingContacts);
      expect(validated[0].isDuplicate).toBe(true);
      expect(validated[1].isDuplicate).toBe(false);
    });
  });

  describe('getImportStats', () => {
    it('should calculate correct statistics', () => {
      const contacts: ParsedContact[] = [
        { email: 'valid1@example.com', phone: '0612345678', first_name: 'Test', last_name: 'One', contact_group: 'general', isValid: true, errors: [], isDuplicate: false },
        { email: 'valid2@example.com', phone: '0687654321', first_name: 'Test', last_name: 'Two', contact_group: 'general', isValid: true, errors: [], isDuplicate: false },
        { email: 'invalid', phone: null, first_name: 'Test', last_name: 'Three', contact_group: 'general', isValid: false, errors: ['Email invalide'] },
        { email: 'duplicate@example.com', phone: null, first_name: 'Test', last_name: 'Four', contact_group: 'general', isValid: true, errors: [], isDuplicate: true }
      ];

      const stats = getImportStats(contacts);
      expect(stats.total).toBe(4);
      expect(stats.valid).toBe(3);
      expect(stats.invalid).toBe(1);
      expect(stats.duplicates).toBe(1);
      expect(stats.importable).toBe(2);
    });

    it('should handle empty array', () => {
      const stats = getImportStats([]);
      expect(stats.total).toBe(0);
      expect(stats.valid).toBe(0);
      expect(stats.invalid).toBe(0);
      expect(stats.duplicates).toBe(0);
      expect(stats.importable).toBe(0);
    });
  });
});
