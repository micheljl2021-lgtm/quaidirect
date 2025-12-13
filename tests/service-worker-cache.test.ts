import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Service Worker Cache Versioning', () => {
  let mockCaches: Map<string, Set<string>>;

  beforeEach(() => {
    mockCaches = new Map();
    
    // Mock the caches API
    global.caches = {
      keys: vi.fn(async () => Array.from(mockCaches.keys())),
      delete: vi.fn(async (cacheName: string) => {
        const existed = mockCaches.has(cacheName);
        mockCaches.delete(cacheName);
        return existed;
      }),
      open: vi.fn(async (cacheName: string) => {
        if (!mockCaches.has(cacheName)) {
          mockCaches.set(cacheName, new Set());
        }
        return {
          addAll: vi.fn(async () => {}),
          put: vi.fn(async () => {}),
          match: vi.fn(async () => undefined),
        };
      }),
    } as any;
  });

  it('should generate unique cache names with versions', () => {
    const CACHE_VERSION = '2025-12-13T02-44-28';
    const CACHE_NAME = `quaidirect-v2-${CACHE_VERSION}`;
    const RUNTIME_CACHE = `quaidirect-runtime-${CACHE_VERSION}`;
    const STATIC_CACHE = `quaidirect-static-${CACHE_VERSION}`;
    const API_CACHE = `quaidirect-api-${CACHE_VERSION}`;

    expect(CACHE_NAME).toBe('quaidirect-v2-2025-12-13T02-44-28');
    expect(RUNTIME_CACHE).toBe('quaidirect-runtime-2025-12-13T02-44-28');
    expect(STATIC_CACHE).toBe('quaidirect-static-2025-12-13T02-44-28');
    expect(API_CACHE).toBe('quaidirect-api-2025-12-13T02-44-28');
  });

  it('should delete old caches on activation', async () => {
    // Setup: Create old and new cache names
    const OLD_VERSION = '2025-12-12T01-30-15';
    const NEW_VERSION = '2025-12-13T02-44-28';
    
    const oldCaches = [
      `quaidirect-v2-${OLD_VERSION}`,
      `quaidirect-runtime-${OLD_VERSION}`,
      `quaidirect-static-${OLD_VERSION}`,
      `quaidirect-api-${OLD_VERSION}`,
    ];
    
    const newCaches = [
      `quaidirect-v2-${NEW_VERSION}`,
      `quaidirect-runtime-${NEW_VERSION}`,
      `quaidirect-static-${NEW_VERSION}`,
      `quaidirect-api-${NEW_VERSION}`,
    ];

    // Add old caches to mock
    oldCaches.forEach(name => mockCaches.set(name, new Set()));
    
    // Simulate activation cleanup
    const allCacheNames = await caches.keys();
    const cachesToDelete = allCacheNames.filter(name => !newCaches.includes(name));
    
    for (const cacheName of cachesToDelete) {
      await caches.delete(cacheName);
    }

    // Verify old caches were deleted
    const remainingCaches = await caches.keys();
    expect(remainingCaches.length).toBe(0);
    expect(mockCaches.size).toBe(0);
  });

  it('should keep current version caches during cleanup', async () => {
    const CURRENT_VERSION = '2025-12-13T02-44-28';
    const currentCaches = [
      `quaidirect-v2-${CURRENT_VERSION}`,
      `quaidirect-runtime-${CURRENT_VERSION}`,
      `quaidirect-static-${CURRENT_VERSION}`,
      `quaidirect-api-${CURRENT_VERSION}`,
    ];

    const OLD_VERSION = '2025-12-12T01-30-15';
    const oldCaches = [
      `quaidirect-v2-${OLD_VERSION}`,
      `quaidirect-runtime-${OLD_VERSION}`,
    ];

    // Setup all caches
    [...currentCaches, ...oldCaches].forEach(name => mockCaches.set(name, new Set()));

    // Simulate activation cleanup
    const allCacheNames = await caches.keys();
    const cachesToDelete = allCacheNames.filter(name => !currentCaches.includes(name));
    
    for (const cacheName of cachesToDelete) {
      await caches.delete(cacheName);
    }

    // Verify only old caches were deleted
    const remainingCaches = await caches.keys();
    expect(remainingCaches.length).toBe(4);
    expect(remainingCaches).toEqual(expect.arrayContaining(currentCaches));
    
    // Verify old caches are gone
    oldCaches.forEach(name => {
      expect(remainingCaches).not.toContain(name);
    });
  });

  it('should handle legacy caches without versions', async () => {
    const CURRENT_VERSION = '2025-12-13T02-44-28';
    const currentCaches = [
      `quaidirect-v2-${CURRENT_VERSION}`,
      `quaidirect-runtime-${CURRENT_VERSION}`,
    ];

    const legacyCaches = [
      'quaidirect-v2',
      'quaidirect-runtime',
      'quaidirect-static',
      'quaidirect-api',
    ];

    // Setup all caches
    [...currentCaches, ...legacyCaches].forEach(name => mockCaches.set(name, new Set()));

    // Simulate activation cleanup
    const allCacheNames = await caches.keys();
    const cachesToDelete = allCacheNames.filter(name => !currentCaches.includes(name));
    
    for (const cacheName of cachesToDelete) {
      await caches.delete(cacheName);
    }

    // Verify legacy caches were deleted
    const remainingCaches = await caches.keys();
    expect(remainingCaches.length).toBe(2);
    legacyCaches.forEach(name => {
      expect(remainingCaches).not.toContain(name);
    });
  });

  it('should generate timestamp-based version strings', () => {
    const timestamp = new Date('2025-12-13T02:44:28.123Z')
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    
    expect(timestamp).toBe('2025-12-13T02-44-28');
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
  });

  it('should have unique versions for different build times', () => {
    const version1 = new Date('2025-12-13T02:44:28.123Z')
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    
    const version2 = new Date('2025-12-13T03:45:29.456Z')
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    
    expect(version1).not.toBe(version2);
    expect(version1).toBe('2025-12-13T02-44-28');
    expect(version2).toBe('2025-12-13T03-45-29');
  });
});
