import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Supabase before importing the hook
const mockFrom = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user-id' } }),
}));

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useQuickDrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockFrom.mockImplementation((table: string) => {
      if (table === 'fishermen') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: 'fisherman-123',
                  default_sale_point_id: 'sale-point-1',
                  default_time_slot: '08:00',
                  photo_boat_1: 'https://example.com/boat1.jpg',
                  photo_boat_2: null,
                  photo_dock_sale: 'https://example.com/dock.jpg',
                  favorite_photo_url: 'https://example.com/favorite.jpg',
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'fisherman_sale_points') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'sale-point-1',
                    label: 'Port Principal',
                    address: '123 Quai du Port',
                    photo_url: 'https://example.com/salepoint.jpg',
                    is_primary: true,
                  },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'fishermen_species_presets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'drop_templates') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'species') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { name: 'Dorade' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'drops') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'new-drop-id' },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      };
    });
  });

  describe('initial state', () => {
    it('starts with isLoading true', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      expect(result.current.isLoading).toBe(true);
    });

    it('has empty arrays for presets and templates initially', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      expect(result.current.speciesPresets).toEqual([]);
      expect(result.current.templates).toEqual([]);
    });

    it('has null salePoints initially', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      expect(result.current.salePoints).toBeNull();
    });
  });

  describe('getFallbackPhotos', () => {
    it('returns fallback photos object structure', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fallbackPhotos = result.current.getFallbackPhotos('sale-point-1');
      
      expect(fallbackPhotos).toHaveProperty('boatPhoto');
      expect(fallbackPhotos).toHaveProperty('salePointPhoto');
      expect(fallbackPhotos).toHaveProperty('favoritePhoto');
    });

    it('returns fisherman photos when available', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fallbackPhotos = result.current.getFallbackPhotos('sale-point-1');
      
      expect(fallbackPhotos.boatPhoto).toBe('https://example.com/boat1.jpg');
      expect(fallbackPhotos.favoritePhoto).toBe('https://example.com/favorite.jpg');
    });

    it('returns sale point photo when salePointId matches', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fallbackPhotos = result.current.getFallbackPhotos('sale-point-1');
      
      expect(fallbackPhotos.salePointPhoto).toBe('https://example.com/salepoint.jpg');
    });

    it('returns undefined for non-existent sale point', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const fallbackPhotos = result.current.getFallbackPhotos('non-existent-id');
      
      expect(fallbackPhotos.salePointPhoto).toBeUndefined();
    });
  });

  describe('data loading', () => {
    it('loads fisherman data', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.fishermanDefaults).toBeDefined();
      expect(result.current.fishermanDefaults?.default_sale_point_id).toBe('sale-point-1');
    });

    it('loads sale points', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.salePoints).toHaveLength(1);
      expect(result.current.salePoints?.[0].label).toBe('Port Principal');
    });
  });

  describe('publishQuickDrop', () => {
    it('is a function', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      expect(typeof result.current.publishQuickDrop).toBe('function');
    });
  });

  describe('publishFromTemplate', () => {
    it('is a function', async () => {
      const { useQuickDrop } = await import('@/hooks/useQuickDrop');
      const { result } = renderHook(() => useQuickDrop(), {
        wrapper: createWrapper(),
      });
      
      expect(typeof result.current.publishFromTemplate).toBe('function');
    });
  });
});
