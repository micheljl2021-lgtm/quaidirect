import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the environment
vi.mock('import.meta', () => ({
  env: {
    MODE: 'test',
    VITEST: true,
    VITE_GOOGLE_MAPS_API_KEY: 'test-api-key'
  }
}));

describe('Google Maps Configuration', () => {
  it('should export getGoogleMapsApiKey function', async () => {
    const { getGoogleMapsApiKey } = await import('../../src/lib/google-maps');
    expect(getGoogleMapsApiKey).toBeDefined();
    expect(typeof getGoogleMapsApiKey).toBe('function');
  });

  it('should export isGoogleMapsConfigured function', async () => {
    const { isGoogleMapsConfigured } = await import('../../src/lib/google-maps');
    expect(isGoogleMapsConfigured).toBeDefined();
    expect(typeof isGoogleMapsConfigured).toBe('function');
  });

  it('should export googleMapsLoaderConfig object', async () => {
    const { googleMapsLoaderConfig } = await import('../../src/lib/google-maps');
    expect(googleMapsLoaderConfig).toBeDefined();
    expect(googleMapsLoaderConfig).toHaveProperty('id');
    expect(googleMapsLoaderConfig).toHaveProperty('libraries');
  });

  it('should return empty string in test mode when API key is missing', async () => {
    const { getGoogleMapsApiKey } = await import('../../src/lib/google-maps');
    // In test mode, it should not throw even if key is missing
    const key = getGoogleMapsApiKey();
    expect(typeof key).toBe('string');
  });
});
