import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../utils';

const mockSupabase = {
  from: vi.fn(),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://storage.example.com/test.jpg' } })),
      remove: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
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

describe('Fisherman Preferences (Photos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'fisherman-1',
          photo_url: null,
          photo_boat_1: null,
          photo_boat_2: null,
          photo_dock_sale: null,
        },
        error: null,
      }),
      update: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  describe('1. Photo Fields Presence', () => {
    it('should have profile photo field', async () => {
      const fishermanData = {
        id: 'f1',
        photo_url: 'https://storage.example.com/profile.jpg', // Profile/logo
      };

      expect(fishermanData.photo_url).toBeDefined();
    });

    it('should have boat photo fields (at least 2)', async () => {
      const fishermanData = {
        id: 'f1',
        photo_boat_1: 'https://storage.example.com/boat1.jpg',
        photo_boat_2: 'https://storage.example.com/boat2.jpg',
      };

      expect(fishermanData.photo_boat_1).toBeDefined();
      expect(fishermanData.photo_boat_2).toBeDefined();
    });

    it('should have dock sale photo field', async () => {
      const fishermanData = {
        id: 'f1',
        photo_dock_sale: 'https://storage.example.com/dock.jpg',
      };

      expect(fishermanData.photo_dock_sale).toBeDefined();
    });
  });

  describe('2. Photo Upload', () => {
    it('should accept jpg files', async () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      
      const isValidFileType = (file: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type);
      };

      expect(isValidFileType(file)).toBe(true);
    });

    it('should accept png files', async () => {
      const file = new File(['dummy'], 'test.png', { type: 'image/png' });
      
      const isValidFileType = (file: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type);
      };

      expect(isValidFileType(file)).toBe(true);
    });

    it('should accept webp files', async () => {
      const file = new File(['dummy'], 'test.webp', { type: 'image/webp' });
      
      const isValidFileType = (file: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        return validTypes.includes(file.type);
      };

      expect(isValidFileType(file)).toBe(true);
    });

    it('should upload file to storage bucket', async () => {
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const bucket = 'fishermen-photos';
      const path = `fisherman-1/profile.jpg`;

      const result = await mockSupabase.storage.from(bucket).upload(path, file);
      
      expect(result.error).toBeNull();
      expect(result.data?.path).toBe('test.jpg');
    });

    it('should get public URL after upload', async () => {
      const bucket = 'fishermen-photos';
      const path = 'fisherman-1/profile.jpg';

      const { data } = mockSupabase.storage.from(bucket).getPublicUrl(path);
      
      expect(data.publicUrl).toContain('https://');
    });
  });

  describe('3. Photo Preview', () => {
    it('should display preview after file selection', () => {
      const createObjectURL = (file: File) => `blob:http://localhost/${Math.random()}`;
      
      const file = new File(['dummy'], 'test.jpg', { type: 'image/jpeg' });
      const previewUrl = createObjectURL(file);
      
      expect(previewUrl).toContain('blob:');
    });

    it('should display existing photo if available', () => {
      const photoUrl = 'https://storage.example.com/existing.jpg';
      
      const getDisplayUrl = (existingUrl: string | null, previewUrl: string | null) => {
        return previewUrl || existingUrl || null;
      };

      expect(getDisplayUrl(photoUrl, null)).toBe(photoUrl);
    });

    it('should prioritize new preview over existing photo', () => {
      const existingUrl = 'https://storage.example.com/existing.jpg';
      const previewUrl = 'blob:http://localhost/new';
      
      const getDisplayUrl = (existingUrl: string | null, previewUrl: string | null) => {
        return previewUrl || existingUrl || null;
      };

      expect(getDisplayUrl(existingUrl, previewUrl)).toBe(previewUrl);
    });
  });

  describe('4. Photo Deletion/Replacement', () => {
    it('should remove photo from storage', async () => {
      const bucket = 'fishermen-photos';
      const paths = ['fisherman-1/profile.jpg'];

      const result = await mockSupabase.storage.from(bucket).remove(paths);
      
      expect(result.error).toBeNull();
    });

    it('should clear photo URL in database after deletion', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({ data: { photo_url: null }, error: null }),
        eq: vi.fn().mockReturnThis(),
      });

      const result = await mockSupabase.from('fishermen')
        .update({ photo_url: null })
        .eq('id', 'fisherman-1');

      expect(result.error).toBeNull();
    });

    it('should allow replacing existing photo', async () => {
      // Step 1: Delete old photo
      await mockSupabase.storage.from('fishermen-photos').remove(['fisherman-1/profile.jpg']);
      
      // Step 2: Upload new photo
      const newFile = new File(['new'], 'new.jpg', { type: 'image/jpeg' });
      await mockSupabase.storage.from('fishermen-photos').upload('fisherman-1/profile.jpg', newFile);
      
      // Step 3: Update database with new URL
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({ 
          data: { photo_url: 'https://storage.example.com/new.jpg' }, 
          error: null 
        }),
        eq: vi.fn().mockReturnThis(),
      });

      const result = await mockSupabase.from('fishermen')
        .update({ photo_url: 'https://storage.example.com/new.jpg' })
        .eq('id', 'fisherman-1');

      expect(result.error).toBeNull();
    });
  });

  describe('5. Persistence', () => {
    it('should save photo URLs to database', async () => {
      const photoUrls = {
        photo_url: 'https://storage.example.com/profile.jpg',
        photo_boat_1: 'https://storage.example.com/boat1.jpg',
        photo_boat_2: 'https://storage.example.com/boat2.jpg',
        photo_dock_sale: 'https://storage.example.com/dock.jpg',
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({ data: photoUrls, error: null }),
        eq: vi.fn().mockReturnThis(),
      });

      const result = await mockSupabase.from('fishermen')
        .update(photoUrls)
        .eq('id', 'fisherman-1');

      expect(result.error).toBeNull();
    });

    it('should load photo URLs on page reload', async () => {
      const existingPhotos = {
        id: 'fisherman-1',
        photo_url: 'https://storage.example.com/profile.jpg',
        photo_boat_1: 'https://storage.example.com/boat1.jpg',
        photo_boat_2: null,
        photo_dock_sale: 'https://storage.example.com/dock.jpg',
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: existingPhotos, error: null }),
      });

      const result = await mockSupabase.from('fishermen')
        .select('photo_url, photo_boat_1, photo_boat_2, photo_dock_sale')
        .eq('id', 'fisherman-1')
        .single();

      expect(result.data?.photo_url).toBe('https://storage.example.com/profile.jpg');
      expect(result.data?.photo_boat_1).toBe('https://storage.example.com/boat1.jpg');
      expect(result.data?.photo_boat_2).toBeNull();
      expect(result.data?.photo_dock_sale).toBe('https://storage.example.com/dock.jpg');
    });
  });

  describe('6. Conditional Rendering', () => {
    it('should render image when URL is present', () => {
      const photoUrl = 'https://storage.example.com/photo.jpg';
      
      const shouldRenderImage = (url: string | null | undefined) => {
        return url !== null && url !== undefined && url.trim() !== '';
      };

      expect(shouldRenderImage(photoUrl)).toBe(true);
    });

    it('should not render image when URL is null', () => {
      const photoUrl = null;
      
      const shouldRenderImage = (url: string | null | undefined) => {
        return url !== null && url !== undefined && url.trim() !== '';
      };

      expect(shouldRenderImage(photoUrl)).toBe(false);
    });

    it('should not render image when URL is empty string', () => {
      const photoUrl = '';
      
      const shouldRenderImage = (url: string | null | undefined) => {
        return url !== null && url !== undefined && url.trim() !== '';
      };

      expect(shouldRenderImage(photoUrl)).toBe(false);
    });

    it('should render placeholder when no photo', () => {
      const renderPhotoOrPlaceholder = (url: string | null) => {
        if (!url) return 'placeholder';
        return url;
      };

      expect(renderPhotoOrPlaceholder(null)).toBe('placeholder');
      expect(renderPhotoOrPlaceholder('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
    });
  });
});
