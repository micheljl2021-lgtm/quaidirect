import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/utils';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' }, loading: false, role: 'user' }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) }),
  },
}));

describe('PecheurPaymentSuccess', () => {
  it('renders success page', async () => {
    const { default: PecheurPaymentSuccess } = await import('../PecheurPaymentSuccess');
    render(<PecheurPaymentSuccess />);
    await waitFor(() => expect(screen.getByText(/Paiement/i)).toBeInTheDocument());
  });
});
