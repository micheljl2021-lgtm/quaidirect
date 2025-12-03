import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/utils';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' }, loading: false, role: 'user' }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), then: vi.fn().mockImplementation((cb) => { cb({ data: [], error: null }); return { catch: vi.fn() }; }) }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { salePoints: [] }, error: null }) },
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }) }),
  },
}));

describe('Arrivages', () => {
  it('renders page', async () => {
    const { default: Arrivages } = await import('../Arrivages');
    render(<Arrivages />);
    await waitFor(() => expect(screen.getByText(/Arrivages/i)).toBeInTheDocument());
  });
});
