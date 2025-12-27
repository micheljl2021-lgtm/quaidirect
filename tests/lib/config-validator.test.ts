import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Config Validator', () => {
  beforeEach(() => {
    // Reset modules between tests
    vi.resetModules();
  });

  it('should skip validation in test environment', async () => {
    // Set test environment
    vi.stubEnv('MODE', 'test');
    
    // Should not throw an error even without required env vars
    expect(() => {
      require('../src/lib/config-validator');
    }).not.toThrow();
  });

  it('should skip validation when VITEST is set', async () => {
    // Set VITEST flag
    vi.stubEnv('VITEST', 'true');
    
    // Should not throw an error even without required env vars
    expect(() => {
      require('../src/lib/config-validator');
    }).not.toThrow();
  });
});
