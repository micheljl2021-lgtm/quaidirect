import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '../utils';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import * as useAuthModule from '@/hooks/useAuth';

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
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

describe('ProtectedRoute', () => {
  const mockUseAuth = vi.mocked(useAuthModule.useAuth);

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
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
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
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
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/auth');
    expect(screen.getByTestId('navigate')).toHaveTextContent('Navigating to /auth');
  });

  it('renders children when user is authenticated', () => {
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

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
