import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    then: vi.fn(),
  }),
  functions: {
    invoke: vi.fn(),
  },
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn(),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
    }),
  },
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
  }),
};

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  Object.values(mockSupabaseClient).forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          (fn as ReturnType<typeof vi.fn>).mockReset();
        }
      });
    }
  });
};

// Mock data factories
export const createMockDrop = (overrides = {}) => ({
  id: 'drop-1',
  fisherman_id: 'fisherman-1',
  sale_point_id: 'sale-point-1',
  eta_at: new Date().toISOString(),
  sale_start_time: new Date(Date.now() + 86400000).toISOString(),
  status: 'scheduled',
  notes: 'Test notes',
  drop_type: 'standard',
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockFisherman = (overrides = {}) => ({
  id: 'fisherman-1',
  user_id: 'user-1',
  boat_name: 'Test Boat',
  boat_registration: 'ABC123',
  siret: '12345678901234',
  verified_at: new Date().toISOString(),
  photo_url: 'https://example.com/photo.jpg',
  ...overrides,
});

export const createMockDropPhoto = (overrides = {}) => ({
  id: 'photo-1',
  drop_id: 'drop-1',
  photo_url: 'https://example.com/drop-photo.jpg',
  display_order: 0,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockOffer = (overrides = {}) => ({
  id: 'offer-1',
  drop_id: 'drop-1',
  species_id: 'species-1',
  title: 'Fresh Fish',
  unit_price: 15.5,
  available_units: 10,
  total_units: 10,
  ...overrides,
});

export const createMockContact = (overrides = {}) => ({
  id: 'contact-1',
  fisherman_id: 'fisherman-1',
  email: 'contact@example.com',
  first_name: 'John',
  last_name: 'Doe',
  contact_group: 'particuliers',
  ...overrides,
});

export const createMockSalePoint = (overrides = {}) => ({
  id: 'sale-point-1',
  fisherman_id: 'fisherman-1',
  label: 'Port de Hyères',
  address: '123 Quai du Port, 83400 Hyères',
  latitude: 43.1,
  longitude: 6.1,
  is_primary: true,
  ...overrides,
});
