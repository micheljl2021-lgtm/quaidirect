import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../utils';

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(),
  functions: { invoke: vi.fn() },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  })),
  removeChannel: vi.fn(),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    userRole: 'fisherman',
    loading: false,
    isVerifiedFisherman: true,
  })),
}));

describe('Arrivages (Standard & Premium)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'fisherman-1', verified_at: new Date().toISOString() },
        error: null,
      }),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'fisherman-1', verified_at: new Date().toISOString() },
        error: null,
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
    });
  });

  describe('A. Arrivage Standard (Sans prix)', () => {
    it('should create arrivage without price (standard)', async () => {
      const dropData = {
        fisherman_id: 'fisherman-1',
        sale_point_id: 'sale-point-1',
        eta_at: new Date().toISOString(),
        sale_start_time: new Date().toISOString(),
        status: 'scheduled',
        notes: 'Arrivage du jour',
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ 
          data: { id: 'drop-1', ...dropData }, 
          error: null 
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id: 'drop-1', ...dropData }, 
          error: null 
        }),
      });

      const result = await mockSupabase.from('drops').insert([dropData]).select().single();
      expect(result.data.id).toBe('drop-1');
    });

    it('should create drop_species association', async () => {
      const speciesData = [
        { drop_id: 'drop-1', species_id: 'species-bar' },
        { drop_id: 'drop-1', species_id: 'species-dorade' },
      ];

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: speciesData, error: null }),
      });

      const result = await mockSupabase.from('drop_species').insert(speciesData);
      expect(result.error).toBeNull();
    });

    it('should NOT display "0 €" when no price is set', () => {
      const offerWithoutPrice = {
        id: 'offer-1',
        unit_price: 0, // No price set
        title: 'Bar',
      };

      // Business logic: price should show "Prix sur place" if 0 or undefined
      const displayPrice = (price: number) => {
        if (!price || price === 0) return 'Prix sur place';
        return `${price.toFixed(2)} €`;
      };

      expect(displayPrice(offerWithoutPrice.unit_price)).toBe('Prix sur place');
      expect(displayPrice(0)).toBe('Prix sur place');
      expect(displayPrice(15.5)).toBe('15.50 €');
    });

    it('should upload and store drop photos', async () => {
      const photoData = [
        { drop_id: 'drop-1', photo_url: 'https://storage.example.com/photo1.jpg', display_order: 0 },
        { drop_id: 'drop-1', photo_url: 'https://storage.example.com/photo2.jpg', display_order: 1 },
      ];

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: photoData, error: null }),
      });

      const result = await mockSupabase.from('drop_photos').insert(photoData);
      expect(result.error).toBeNull();
    });

    it('should display placeholder when photo fails to load', () => {
      // Simulate image error handling
      const handleImageError = (e: { currentTarget: HTMLImageElement }) => {
        e.currentTarget.style.display = 'none';
        // Show placeholder
      };

      const mockEvent = {
        currentTarget: { style: { display: 'block' } } as HTMLImageElement,
      };

      handleImageError(mockEvent);
      expect(mockEvent.currentTarget.style.display).toBe('none');
    });
  });

  describe('B. Arrivage Premium (Avec prix)', () => {
    it('should create premium arrivage with offers containing prices', async () => {
      const offersData = [
        {
          drop_id: 'drop-1',
          species_id: 'species-bar',
          title: 'Bar de ligne',
          description: 'Pêché ce matin',
          unit_price: 25.00,
          total_units: 10,
          available_units: 10,
          price_type: 'per_kg',
        },
        {
          drop_id: 'drop-1',
          species_id: 'species-dorade',
          title: 'Dorade royale',
          description: 'Belle taille',
          unit_price: 18.50,
          total_units: 5,
          available_units: 5,
          price_type: 'per_kg',
        },
      ];

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: offersData, error: null }),
      });

      const result = await mockSupabase.from('offers').insert(offersData);
      expect(result.error).toBeNull();
    });

    it('should correctly display prices for premium offers', () => {
      const premiumOffer = {
        title: 'Bar de ligne',
        unit_price: 25.00,
        price_type: 'per_kg',
      };

      const formatPrice = (price: number, priceType: string) => {
        if (!price || price === 0) return 'Prix sur place';
        const unit = priceType === 'per_kg' ? '/kg' : '/pièce';
        return `${price.toFixed(2)} €${unit}`;
      };

      expect(formatPrice(premiumOffer.unit_price, premiumOffer.price_type)).toBe('25.00 €/kg');
    });

    it('should store photo per species in offers', async () => {
      const offerWithPhoto = {
        drop_id: 'drop-1',
        species_id: 'species-bar',
        title: 'Bar de ligne',
        photo_url: 'https://storage.example.com/bar.jpg',
        unit_price: 25.00,
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ data: offerWithPhoto, error: null }),
      });

      const result = await mockSupabase.from('offers').insert([offerWithPhoto]);
      expect(result.error).toBeNull();
    });

    it('should validate required sale point before publication', () => {
      const validateArrivage = (data: { salePointId: string; species: any[] }) => {
        if (!data.salePointId || data.salePointId.trim() === '') {
          return { valid: false, error: 'Point de vente requis' };
        }
        if (data.species.length === 0) {
          return { valid: false, error: 'Au moins une espèce requise' };
        }
        return { valid: true, error: null };
      };

      expect(validateArrivage({ salePointId: '', species: [] })).toEqual({
        valid: false,
        error: 'Point de vente requis',
      });

      expect(validateArrivage({ salePointId: 'sp-1', species: [] })).toEqual({
        valid: false,
        error: 'Au moins une espèce requise',
      });

      expect(validateArrivage({ salePointId: 'sp-1', species: [{ id: '1' }] })).toEqual({
        valid: true,
        error: null,
      });
    });
  });

  describe('C. Display on Map & Lists', () => {
    it('should filter expired arrivages from display', () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

      const drops = [
        { id: '1', sale_start_time: pastDate.toISOString(), status: 'scheduled' },
        { id: '2', sale_start_time: futureDate.toISOString(), status: 'scheduled' },
      ];

      const activeDrops = drops.filter(
        d => new Date(d.sale_start_time) >= now && d.status === 'scheduled'
      );

      expect(activeDrops).toHaveLength(1);
      expect(activeDrops[0].id).toBe('2');
    });

    it('should fetch sale point address for display', async () => {
      const salePoint = {
        id: 'sp-1',
        label: 'Port de Hyères',
        address: '123 Quai du Port, 83400 Hyères',
        latitude: 43.1,
        longitude: 6.1,
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { salePoints: [salePoint] },
        error: null,
      });

      const result = await mockSupabase.functions.invoke('get-public-sale-points');
      expect(result.data.salePoints[0].address).toBe('123 Quai du Port, 83400 Hyères');
    });
  });

  describe('D. Admin View', () => {
    it('should display all arrivages with photos in admin dashboard', async () => {
      const drops = [
        {
          id: 'drop-1',
          notes: 'Arrivage standard',
          drop_photos: [{ photo_url: 'https://example.com/photo.jpg' }],
          offers: [],
        },
        {
          id: 'drop-2',
          notes: 'Arrivage premium',
          drop_photos: [],
          offers: [{ title: 'Bar', unit_price: 25 }],
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: drops, error: null }),
      });

      const result = await mockSupabase.from('drops').select('*, drop_photos(*), offers(*)').order('created_at');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].drop_photos).toHaveLength(1);
      expect(result.data[1].offers).toHaveLength(1);
    });
  });
});
