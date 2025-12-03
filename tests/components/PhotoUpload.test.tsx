import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../utils';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/uploaded.jpg' } }),
      }),
    },
  },
}));

describe('PhotoUpload', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders correctly', async () => {
    const { PhotoUpload } = await import('@/components/PhotoUpload');
    render(<PhotoUpload label="Photo" value={null} onChange={mockOnChange} />);
    expect(screen.getByText('Photo')).toBeInTheDocument();
  });

  it('displays image when value provided', async () => {
    const { PhotoUpload } = await import('@/components/PhotoUpload');
    render(<PhotoUpload label="Photo" value="https://example.com/photo.jpg" onChange={mockOnChange} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });
});
