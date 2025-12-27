import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../utils';
import { ProtectedPremiumRoute } from '@/components/ProtectedPremiumRoute';
import * as useAuthModule from '@/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock Navigate component
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      mockNavigate(to);
      return <div data-testid="navigate">Navigating to {to}</div>;
    },
  };
});

describe('ProtectedPremiumRoute', () => {
  const mockUseAuth = vi.mocked(useAuthModule.useAuth);
  const mockSupabase = vi.mocked(supabase);
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('shows loader when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      session: null,
      userRole: null,
      viewAsRole: null,
      effectiveRole: null,
      isAdmin: false,
      isVerifiedFisherman: false,
      setViewAsRole: vi.fn(),
      clearViewAsRole: vi.fn(),
      signIn: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ProtectedPremiumRoute>
          <div>Premium Content</div>
        </ProtectedPremiumRoute>
      </QueryClientProvider>
    );

    // Check for loader by class name since it's an SVG without role
    expect(container.querySelector('.lucide-loader-circle')).toBeInTheDocument();
  });

  it('redirects to /auth when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      session: null,
      userRole: null,
      viewAsRole: null,
      effectiveRole: null,
      isAdmin: false,
      isVerifiedFisherman: false,
      setViewAsRole: vi.fn(),
      clearViewAsRole: vi.fn(),
      signIn: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ProtectedPremiumRoute>
          <div>Premium Content</div>
        </ProtectedPremiumRoute>
      </QueryClientProvider>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/auth');
    expect(screen.getByTestId('navigate')).toHaveTextContent('Navigating to /auth');
  });

  it('redirects to /premium when user is not premium', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' } as any,
      loading: false,
      session: { user: { id: '123' } } as any,
      userRole: 'user',
      viewAsRole: null,
      effectiveRole: 'user',
      isAdmin: false,
      isVerifiedFisherman: false,
      setViewAsRole: vi.fn(),
      clearViewAsRole: vi.fn(),
      signIn: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    });

    // Mock Supabase to return no premium subscription
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    
    const mockIn = vi.fn().mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });
    
    const mockEq2 = vi.fn().mockReturnValue({
      in: mockIn,
    });
    
    const mockEq1 = vi.fn().mockReturnValue({
      eq: mockEq2,
    });
    
    const mockSelect = vi.fn().mockReturnValue({
      eq: mockEq1,
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <ProtectedPremiumRoute>
          <div>Premium Content</div>
        </ProtectedPremiumRoute>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/premium');
    });
  });

  it('renders children when user has active premium subscription', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' } as any,
      loading: false,
      session: { user: { id: '123' } } as any,
      userRole: 'premium',
      viewAsRole: null,
      effectiveRole: 'premium',
      isAdmin: false,
      isVerifiedFisherman: false,
      setViewAsRole: vi.fn(),
      clearViewAsRole: vi.fn(),
      signIn: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
    });

    // Mock Supabase to return active premium subscription
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { status: 'active' },
      error: null,
    });
    
    const mockIn = vi.fn().mockReturnValue({
      maybeSingle: mockMaybeSingle,
    });
    
    const mockEq2 = vi.fn().mockReturnValue({
      in: mockIn,
    });
    
    const mockEq1 = vi.fn().mockReturnValue({
      eq: mockEq2,
    });
    
    const mockSelect = vi.fn().mockReturnValue({
      eq: mockEq1,
    });

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any);

    render(
      <QueryClientProvider client={queryClient}>
        <ProtectedPremiumRoute>
          <div>Premium Content</div>
        </ProtectedPremiumRoute>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Premium Content')).toBeInTheDocument();
    });
  });
});
