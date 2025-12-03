import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock types simulating Stripe webhook events
interface CheckoutSessionCompletedEvent {
  type: 'checkout.session.completed';
  data: {
    object: {
      id: string;
      customer: string;
      customer_email: string;
      subscription: string;
      metadata: {
        user_id: string;
        plan_type: string;
      };
    };
  };
}

interface PaymentRecord {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface FishermanRecord {
  id: string;
  user_id: string;
  onboarding_payment_status: string;
  onboarding_paid_at: string;
}

// Simulate webhook handler logic
const handleCheckoutSessionCompleted = (event: CheckoutSessionCompletedEvent) => {
  const session = event.data.object;
  
  // Create payment record
  const paymentRecord: PaymentRecord = {
    id: `payment_${Date.now()}`,
    user_id: session.metadata.user_id,
    plan: session.metadata.plan_type,
    status: 'active',
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
  };
  
  // Assign fisherman role
  const userRole: UserRole = {
    user_id: session.metadata.user_id,
    role: 'fisherman',
  };
  
  // Update fisherman record
  const fishermanUpdate: Partial<FishermanRecord> = {
    onboarding_payment_status: 'paid',
    onboarding_paid_at: new Date().toISOString(),
  };
  
  return {
    paymentRecord,
    userRole,
    fishermanUpdate,
    shouldSendWelcomeEmail: true,
    email: session.customer_email,
  };
};

describe('Stripe Webhook - Fisherman Onboarding', () => {
  const mockEvent: CheckoutSessionCompletedEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        customer: 'cus_test_456',
        customer_email: 'fisherman@test.com',
        subscription: 'sub_test_789',
        metadata: {
          user_id: 'user-123',
          plan_type: 'fisherman_pro',
        },
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkout.session.completed', () => {
    it('creates payment record with correct user_id', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.paymentRecord.user_id).toBe('user-123');
    });

    it('sets correct plan type from metadata', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.paymentRecord.plan).toBe('fisherman_pro');
    });

    it('stores Stripe customer and subscription IDs', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.paymentRecord.stripe_customer_id).toBe('cus_test_456');
      expect(result.paymentRecord.stripe_subscription_id).toBe('sub_test_789');
    });

    it('sets payment status to active', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.paymentRecord.status).toBe('active');
    });
  });

  describe('role assignment', () => {
    it('assigns fisherman role to user', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.userRole.role).toBe('fisherman');
      expect(result.userRole.user_id).toBe('user-123');
    });
  });

  describe('fisherman record update', () => {
    it('sets onboarding_payment_status to paid', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.fishermanUpdate.onboarding_payment_status).toBe('paid');
    });

    it('sets onboarding_paid_at timestamp', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.fishermanUpdate.onboarding_paid_at).toBeDefined();
      expect(new Date(result.fishermanUpdate.onboarding_paid_at!).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('welcome email', () => {
    it('triggers welcome email send', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.shouldSendWelcomeEmail).toBe(true);
      expect(result.email).toBe('fisherman@test.com');
    });
  });

  describe('Basic vs Pro plan handling', () => {
    it('handles Basic plan correctly', () => {
      const basicEvent: CheckoutSessionCompletedEvent = {
        ...mockEvent,
        data: {
          object: {
            ...mockEvent.data.object,
            metadata: {
              user_id: 'user-456',
              plan_type: 'fisherman_basic',
            },
          },
        },
      };
      
      const result = handleCheckoutSessionCompleted(basicEvent);
      
      expect(result.paymentRecord.plan).toBe('fisherman_basic');
    });

    it('handles Pro plan correctly', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.paymentRecord.plan).toBe('fisherman_pro');
    });
  });

  describe('edge cases', () => {
    it('handles missing metadata gracefully', () => {
      const eventWithEmptyMetadata: CheckoutSessionCompletedEvent = {
        ...mockEvent,
        data: {
          object: {
            ...mockEvent.data.object,
            metadata: {
              user_id: '',
              plan_type: '',
            },
          },
        },
      };
      
      const result = handleCheckoutSessionCompleted(eventWithEmptyMetadata);
      
      // Should still return a result, even if values are empty
      expect(result.paymentRecord).toBeDefined();
    });

    it('includes all necessary fields in payment record', () => {
      const result = handleCheckoutSessionCompleted(mockEvent);
      
      expect(result.paymentRecord).toHaveProperty('id');
      expect(result.paymentRecord).toHaveProperty('user_id');
      expect(result.paymentRecord).toHaveProperty('plan');
      expect(result.paymentRecord).toHaveProperty('status');
      expect(result.paymentRecord).toHaveProperty('stripe_customer_id');
      expect(result.paymentRecord).toHaveProperty('stripe_subscription_id');
    });
  });
});
