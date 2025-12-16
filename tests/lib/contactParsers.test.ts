/**
 * Tests for contact parsers
 */

import { describe, it, expect } from 'vitest';
import { parseVCF, parseJSON, detectFileFormat } from '@/lib/contactParsers';

describe('Contact Parsers', () => {
  describe('parseVCF', () => {
    it('should parse a simple vCard', () => {
      const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Jean Dupont
TEL:0612345678
EMAIL:jean@example.com
END:VCARD`;
      
      const contacts = parseVCF(vcf);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].first_name).toBe('Jean');
      expect(contacts[0].last_name).toBe('Dupont');
      expect(contacts[0].phone).toBe('0612345678');
      expect(contacts[0].email).toBe('jean@example.com');
    });

    it('should parse multiple vCards', () => {
      const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Jean Dupont
EMAIL:jean@example.com
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Marie Martin
TEL:0687654321
END:VCARD`;
      
      const contacts = parseVCF(vcf);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].email).toBe('jean@example.com');
      expect(contacts[1].phone).toBe('0687654321');
    });

    it('should handle N field for structured names', () => {
      const vcf = `BEGIN:VCARD
VERSION:3.0
N:Dupont;Jean
TEL:0612345678
END:VCARD`;
      
      const contacts = parseVCF(vcf);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].first_name).toBe('Jean');
      expect(contacts[0].last_name).toBe('Dupont');
    });

    it('should validate contacts', () => {
      const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Test Invalid
EMAIL:not-an-email
END:VCARD`;
      
      const contacts = parseVCF(vcf);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].isValid).toBe(false);
      expect(contacts[0].errors).toContain('Email invalide');
    });

    it('should require at least email or phone', () => {
      const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Test NoContact
END:VCARD`;
      
      const contacts = parseVCF(vcf);
      expect(contacts).toHaveLength(0); // No email or phone, so contact is skipped
    });

    it('should set contact_group to professionnels when ORG is present', () => {
      const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Jean Dupont
EMAIL:jean@company.com
ORG:ACME Corp
END:VCARD`;
      
      const contacts = parseVCF(vcf);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].contact_group).toBe('professionnels');
    });
  });

  describe('parseJSON', () => {
    it('should parse JSON array of contacts', () => {
      const json = JSON.stringify([
        { email: 'test1@example.com', phone: '0612345678', first_name: 'Test', last_name: 'One' },
        { email: 'test2@example.com', phone: '0687654321', first_name: 'Test', last_name: 'Two' }
      ]);
      
      const contacts = parseJSON(json);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].email).toBe('test1@example.com');
      expect(contacts[1].email).toBe('test2@example.com');
    });

    it('should parse JSON single object', () => {
      const json = JSON.stringify({
        email: 'test@example.com',
        phone: '0612345678'
      });
      
      const contacts = parseJSON(json);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].email).toBe('test@example.com');
    });

    it('should handle various property name formats', () => {
      const json = JSON.stringify([
        { Email: 'test1@example.com', Phone: '0612345678', firstName: 'Test', lastName: 'One' },
        { mail: 'test2@example.com', tel: '0687654321', prenom: 'Test', nom: 'Two' }
      ]);
      
      const contacts = parseJSON(json);
      expect(contacts).toHaveLength(2);
      expect(contacts[0].email).toBe('test1@example.com');
      expect(contacts[0].first_name).toBe('Test');
      expect(contacts[1].email).toBe('test2@example.com');
      expect(contacts[1].first_name).toBe('Test');
    });

    it('should validate contacts', () => {
      const json = JSON.stringify([
        { email: 'invalid-email', phone: '123' }
      ]);
      
      const contacts = parseJSON(json);
      expect(contacts).toHaveLength(1);
      expect(contacts[0].isValid).toBe(false);
      expect(contacts[0].errors.length).toBeGreaterThan(0);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => parseJSON('not valid json')).toThrow('Format JSON invalide');
    });
  });

  describe('detectFileFormat', () => {
    it('should detect CSV by extension', () => {
      expect(detectFileFormat('contacts.csv', '')).toBe('csv');
    });

    it('should detect VCF by extension', () => {
      expect(detectFileFormat('contacts.vcf', '')).toBe('vcf');
      expect(detectFileFormat('contacts.vcard', '')).toBe('vcf');
    });

    it('should detect JSON by extension', () => {
      expect(detectFileFormat('contacts.json', '')).toBe('json');
    });

    it('should detect Excel by extension', () => {
      expect(detectFileFormat('contacts.xlsx', '')).toBe('excel');
      expect(detectFileFormat('contacts.xls', '')).toBe('excel');
    });

    it('should detect VCF by content', () => {
      const content = 'BEGIN:VCARD\nVERSION:3.0\n';
      expect(detectFileFormat('unknown.txt', content)).toBe('vcf');
    });

    it('should detect JSON by content', () => {
      expect(detectFileFormat('unknown.txt', '[{"email":"test"}]')).toBe('json');
      expect(detectFileFormat('unknown.txt', '{"email":"test"}')).toBe('json');
    });

    it('should default to CSV for unknown format', () => {
      expect(detectFileFormat('unknown.txt', 'some text')).toBe('csv');
    });
  });
});
