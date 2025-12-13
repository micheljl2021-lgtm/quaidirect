import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../utils';

vi.mock('@/components/GoogleMapComponent', () => ({ default: () => <div data-testid="google-map">Map</div> }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: null, loading: false, role: null }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), then: vi.fn().mockImplementation((cb) => { cb({ data: [], error: null }); return { catch: vi.fn() }; }) }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { salePoints: [] }, error: null }) },
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) }),
  },
}));

describe('Carte', () => {
  let mockGeolocation: any;

  beforeEach(() => {
    // Mock geolocation with successful response by default
    mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success: any) => {
        success({
          coords: {
            latitude: 43.12,
            longitude: 6.13,
          },
        });
      }),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
      writable: true,
    });
  });

  it('renders map', async () => {
    const { default: Carte } = await import('@/pages/Carte');
    render(<Carte />);
    await waitFor(() => expect(screen.getByTestId('google-map')).toBeInTheDocument());
  });

  it('requests geolocation on mount', async () => {
    const { default: Carte } = await import('@/pages/Carte');
    render(<Carte />);
    
    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  it('shows localization button', async () => {
    const { default: Carte } = await import('@/pages/Carte');
    render(<Carte />);
    
    await waitFor(() => {
      const button = screen.getByTitle('Me localiser');
      expect(button).toBeInTheDocument();
    });
  });
});
