import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/utils';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' }, loading: false, role: 'user' }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }), then: vi.fn().mockImplementation((cb) => { cb({ data: [], error: null }); return { catch: vi.fn() }; }) }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: { url: 'https://stripe.com' }, error: null }) },
  },
}));

describe('PecheurPayment', () => {
  it('renders payment page with plans', async () => {
    const { default: PecheurPayment } = await import('../PecheurPayment');
    render(<PecheurPayment />);
    await waitFor(() => expect(screen.getByText(/Pêcheur/i)).toBeInTheDocument());
  });
});
