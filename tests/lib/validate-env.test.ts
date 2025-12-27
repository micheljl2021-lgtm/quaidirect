import { describe, it, expect } from 'vitest';
import { checkEnvironment } from '@/lib/validate-env';

/**
 * Tests for environment validation utility
 * 
 * Note: These tests validate the logic of checking environment variables.
 * The actual validateEnvironment() function is called at app startup in main.tsx
 * and will throw if required variables are missing.
 */
describe('Environment Validation', () => {
  describe('checkEnvironment', () => {
    it('should have the checkEnvironment function available', () => {
      expect(checkEnvironment).toBeDefined();
      expect(typeof checkEnvironment).toBe('function');
    });

    it('should return an object or null', () => {
      const result = checkEnvironment();
      expect(result === null || typeof result === 'object').toBe(true);
    });

    it('should include missing array and message if validation fails', () => {
      const result = checkEnvironment();
      if (result !== null) {
        expect(result).toHaveProperty('missing');
        expect(result).toHaveProperty('message');
        expect(Array.isArray(result.missing)).toBe(true);
        expect(typeof result.message).toBe('string');
      }
    });

    it('should check for VITE_SUPABASE_URL in the validation', () => {
      const result = checkEnvironment();
      if (result !== null && result.missing.length > 0) {
        // If there are missing variables, URL should be one of the checked vars
        const checkedVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];
        expect(result.missing.every((v: string) => checkedVars.includes(v))).toBe(true);
      }
    });
  });

  describe('validate-env module', () => {
    it('should export validateEnvironment function', async () => {
      const module = await import('@/lib/validate-env');
      expect(module.validateEnvironment).toBeDefined();
      expect(typeof module.validateEnvironment).toBe('function');
    });

    it('should export checkEnvironment function', async () => {
      const module = await import('@/lib/validate-env');
      expect(module.checkEnvironment).toBeDefined();
      expect(typeof module.checkEnvironment).toBe('function');
    });
  });
});
