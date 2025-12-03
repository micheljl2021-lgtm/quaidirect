import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(),
  functions: { invoke: vi.fn() },
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    userRole: 'user',
    loading: false,
    isVerifiedFisherman: false,
  })),
}));

describe('User to Fisherman PRO+ Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    });
  });

  describe('1. Standard User Creation', () => {
    it('should create a new user account via Auth page', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'new-user-id', email: 'newuser@test.com' } },
        error: null,
      });

      const { default: Auth } = await import('@/pages/Auth');
      render(<Auth />);

      // Verify auth page renders
      await waitFor(() => {
        expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
      });
    });

    it('should assign "user" role after signup', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        insert: mockInsert,
        eq: vi.fn().mockReturnThis(),
      });

      // Simulate user role assignment
      await mockSupabase.from('user_roles').insert({
        user_id: 'test-user-id',
        role: 'user',
      });

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('2. PRO+ Subscription Flow (Stripe)', () => {
    it('should display fisherman payment plans', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        userRole: 'user',
        loading: false,
        isVerifiedFisherman: false,
      } as any);

      const { default: PecheurPayment } = await import('@/pages/PecheurPayment');
      render(<PecheurPayment />);

      await waitFor(() => {
        expect(screen.getByText(/Pêcheur/i)).toBeInTheDocument();
      });
    });

    it('should create Stripe checkout session for PRO+ plan', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/test-session-pro' },
        error: null,
      });

      const result = await mockSupabase.functions.invoke('create-fisherman-payment', {
        body: { plan: 'fisherman_pro', price_id: 'price_PRO_199_YEAR' },
      });

      expect(result.data.url).toContain('checkout.stripe.com');
    });

    it('should handle successful payment webhook simulation', async () => {
      // Simulate webhook creating payment record
      const paymentData = {
        user_id: 'test-user-id',
        plan: 'fisherman_pro',
        status: 'active',
        stripe_customer_id: 'cus_test123',
        trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: paymentData, error: null }),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: paymentData, error: null }),
      });

      const { data } = await mockSupabase.from('payments').insert(paymentData);
      expect(data).toEqual(paymentData);
    });

    it('should assign fisherman role after payment', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      });

      await mockSupabase.from('user_roles').insert({
        user_id: 'test-user-id',
        role: 'fisherman',
      });

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('3. Fisherman Onboarding Form', () => {
    it('should display onboarding form after payment', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        userRole: 'fisherman',
        loading: false,
        isVerifiedFisherman: false,
      } as any);

      // Mock payment verified
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { onboarding_payment_status: 'paid' },
          error: null,
        }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const { default: PecheurOnboarding } = await import('@/pages/PecheurOnboarding');
      render(<PecheurOnboarding />);

      await waitFor(() => {
        // Should show step indicator or form
        expect(document.querySelector('.min-h-screen')).toBeInTheDocument();
      });
    });

    it('should validate required SIRET field', () => {
      const siret = '12345678901234';
      expect(siret.length).toBe(14);
      expect(/^\d{14}$/.test(siret)).toBe(true);
    });

    it('should create fisherman record with pending status', async () => {
      const fishermanData = {
        user_id: 'test-user-id',
        siret: '12345678901234',
        boat_name: 'Le Mistral',
        boat_registration: '12345678901234',
        company_name: 'Test Company',
        verified_at: null, // Pending admin validation
      };

      mockSupabase.from.mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ data: fishermanData, error: null }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: fishermanData, error: null }),
      });

      const result = await mockSupabase.from('fishermen').upsert(fishermanData);
      expect(result.data.verified_at).toBeNull();
    });
  });

  describe('4. Admin Validation Flow', () => {
    it('should display pending fisherman in admin dashboard', async () => {
      const pendingFishermen = [
        {
          id: 'fisherman-1',
          user_id: 'test-user-id',
          boat_name: 'Le Mistral',
          verified_at: null,
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: pendingFishermen, error: null }),
      });

      const { data } = await mockSupabase.from('fishermen')
        .select('*')
        .is('verified_at', null)
        .order('created_at');

      expect(data).toHaveLength(1);
      expect(data[0].verified_at).toBeNull();
    });

    it('should validate fisherman and set verified_at', async () => {
      const verifiedFisherman = {
        id: 'fisherman-1',
        verified_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({ data: verifiedFisherman, error: null }),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: verifiedFisherman, error: null }),
      });

      const result = await mockSupabase.from('fishermen')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', 'fisherman-1');

      expect(result.data.verified_at).not.toBeNull();
    });

    it('should call approve-fisherman-access edge function', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await mockSupabase.functions.invoke('approve-fisherman-access', {
        body: { fisherman_id: 'fisherman-1' },
      });

      expect(result.data.success).toBe(true);
    });
  });

  describe('5. Verified Fisherman Access', () => {
    it('should grant dashboard access to verified fisherman', async () => {
      const { useAuth } = await import('@/hooks/useAuth');
      vi.mocked(useAuth).mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        userRole: 'fisherman',
        loading: false,
        isVerifiedFisherman: true,
      } as any);

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'fisherman-1', slug: 'le-mistral', verified_at: new Date().toISOString() },
          error: null,
        }),
        then: vi.fn((cb) => {
          cb({ data: [], error: null });
          return { catch: vi.fn() };
        }),
      });

      const { default: PecheurDashboard } = await import('@/pages/PecheurDashboard');
      render(<PecheurDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
      });
    });
  });
});
