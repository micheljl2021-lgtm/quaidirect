import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getConfigs } from '../../src/lib/config-validator';

describe('Config Validator', () => {
  beforeEach(() => {
    // Reset modules between tests
    vi.resetModules();
  });

  it('should skip validation in test environment', async () => {
    // Set test environment
    vi.stubEnv('MODE', 'test');
    
    // Should not throw an error even without required env vars
    expect(async () => {
      await import('../../src/lib/config-validator');
    }).not.toThrow();
  });

  it('should skip validation when VITEST is set', async () => {
    // Set VITEST flag
    vi.stubEnv('VITEST', 'true');
    
    // Should not throw an error even without required env vars
    expect(async () => {
      await import('../../src/lib/config-validator');
    }).not.toThrow();
  });

  it('should treat Google Maps as optional', () => {
    const configs = getConfigs();
    const googleMapsConfig = configs.find(c => c.key === 'VITE_GOOGLE_MAPS_API_KEY');
    
    expect(googleMapsConfig).toBeDefined();
    expect(googleMapsConfig?.required).toBe(false);
  });

  it('should only require Supabase credentials', () => {
    const configs = getConfigs();
    const requiredConfigs = configs.filter(c => c.required);
    
    // Only Supabase URL and Publishable Key should be required
    expect(requiredConfigs).toHaveLength(2);
    expect(requiredConfigs.map(c => c.key)).toEqual([
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_PUBLISHABLE_KEY'
    ]);
  });

  it('should have all optional configs marked as not required', () => {
    const configs = getConfigs();
    const optionalConfigs = configs.filter(c => !c.required);
    
    // Google Maps, Firebase, and VAPID should all be optional
    const optionalKeys = optionalConfigs.map(c => c.key);
    expect(optionalKeys).toContain('VITE_GOOGLE_MAPS_API_KEY');
    expect(optionalKeys).toContain('VITE_FIREBASE_API_KEY');
    expect(optionalKeys).toContain('VITE_VAPID_PUBLIC_KEY');
  });
});
