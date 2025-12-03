import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '@/test/utils';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((cb) => {
        cb({ data: [{ id: 'f1', boat_name: 'Test Boat', verified_at: null }], error: null });
        return { catch: vi.fn() };
      }),
    }),
    functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  },
}));

describe('ImprovedFishermenTab', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the tab', async () => {
    const { ImprovedFishermenTab } = await import('../ImprovedFishermenTab');
    render(<ImprovedFishermenTab />);
    await waitFor(() => expect(screen.getByText(/Pêcheurs/i)).toBeInTheDocument());
  });
});
