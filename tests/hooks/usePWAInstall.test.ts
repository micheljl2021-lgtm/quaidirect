import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

describe('usePWAInstall', () => {
  beforeEach(() => {
    // Reset window.matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => usePWAInstall());
    
    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it('detects already installed app', () => {
    // Mock standalone mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => usePWAInstall());
    
    expect(result.current.isInstalled).toBe(true);
  });

  it('sets installable when beforeinstallprompt fires', async () => {
    const { result } = renderHook(() => usePWAInstall());
    
    // Trigger beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    (event as any).prompt = vi.fn();
    (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
    
    act(() => {
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.isInstallable).toBe(true);
    });
  });

  it('returns false from promptInstall when no deferred prompt', async () => {
    const { result } = renderHook(() => usePWAInstall());
    
    const success = await act(async () => {
      return await result.current.promptInstall();
    });
    
    expect(success).toBe(false);
  });
});
