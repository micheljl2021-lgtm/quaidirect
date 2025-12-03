import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../utils';

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: { id: 'u1' }, loading: false, role: 'fisherman' }) }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null }) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'f1', photo_url: null }, error: null }), then: vi.fn().mockImplementation((cb) => { cb({ data: [], error: null }); return { catch: vi.fn() }; }) }),
    storage: { from: vi.fn().mockReturnValue({ upload: vi.fn(), getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'url' } }) }) },
  },
}));

describe('PecheurPreferences', () => {
  it('renders preferences page', async () => {
    const { default: PecheurPreferences } = await import('@/pages/PecheurPreferences');
    render(<PecheurPreferences />);
    await waitFor(() => expect(screen.getByText(/préférences/i)).toBeInTheDocument());
  });
});
