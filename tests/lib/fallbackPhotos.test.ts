import { describe, it, expect } from 'vitest';
import { 
  getFallbackPhotoByDropId, 
  isFallbackPhoto, 
  FALLBACK_FISHING_PHOTOS 
} from '@/lib/fallbackPhotos';

describe('fallbackPhotos', () => {
  describe('FALLBACK_FISHING_PHOTOS', () => {
    it('contains at least 10 photos', () => {
      expect(FALLBACK_FISHING_PHOTOS.length).toBeGreaterThanOrEqual(10);
    });

    it('all URLs are valid Unsplash URLs', () => {
      FALLBACK_FISHING_PHOTOS.forEach(url => {
        expect(url).toMatch(/^https:\/\/images\.unsplash\.com\//);
      });
    });

    it('all URLs have width and quality parameters', () => {
      FALLBACK_FISHING_PHOTOS.forEach(url => {
        expect(url).toContain('w=800');
        expect(url).toContain('q=80');
      });
    });

    it('contains no duplicate URLs', () => {
      const uniqueUrls = new Set(FALLBACK_FISHING_PHOTOS);
      expect(uniqueUrls.size).toBe(FALLBACK_FISHING_PHOTOS.length);
    });
  });

  describe('getFallbackPhotoByDropId', () => {
    it('returns a valid URL from the fallback photos array', () => {
      const photo = getFallbackPhotoByDropId('test-drop-id');
      expect(FALLBACK_FISHING_PHOTOS).toContain(photo);
    });

    it('returns the same photo for the same dropId (deterministic)', () => {
      const photo1 = getFallbackPhotoByDropId('drop-123');
      const photo2 = getFallbackPhotoByDropId('drop-123');
      expect(photo1).toBe(photo2);
    });

    it('returns consistent results across multiple calls', () => {
      const dropId = 'consistent-test-id';
      const results = Array.from({ length: 100 }, () => getFallbackPhotoByDropId(dropId));
      const allSame = results.every(r => r === results[0]);
      expect(allSame).toBe(true);
    });

    it('returns different photos for different dropIds', () => {
      // Test with a variety of IDs to ensure distribution
      const photos = new Set([
        getFallbackPhotoByDropId('drop-1'),
        getFallbackPhotoByDropId('drop-2'),
        getFallbackPhotoByDropId('drop-3'),
        getFallbackPhotoByDropId('drop-4'),
        getFallbackPhotoByDropId('drop-5'),
        getFallbackPhotoByDropId('drop-abc'),
        getFallbackPhotoByDropId('drop-xyz'),
        getFallbackPhotoByDropId('another-id'),
      ]);
      // Should have at least 2 different photos among 8 IDs
      expect(photos.size).toBeGreaterThanOrEqual(2);
    });

    it('handles empty string dropId', () => {
      const photo = getFallbackPhotoByDropId('');
      expect(FALLBACK_FISHING_PHOTOS).toContain(photo);
    });

    it('handles special characters in dropId', () => {
      const photo = getFallbackPhotoByDropId('drop-with-émojis-🐟-and-accents-éàü');
      expect(FALLBACK_FISHING_PHOTOS).toContain(photo);
    });

    it('handles UUID format dropIds', () => {
      const photo = getFallbackPhotoByDropId('550e8400-e29b-41d4-a716-446655440000');
      expect(FALLBACK_FISHING_PHOTOS).toContain(photo);
    });

    it('handles very long dropIds', () => {
      const longId = 'a'.repeat(1000);
      const photo = getFallbackPhotoByDropId(longId);
      expect(FALLBACK_FISHING_PHOTOS).toContain(photo);
    });
  });

  describe('isFallbackPhoto', () => {
    it('returns true for fallback photo URLs', () => {
      FALLBACK_FISHING_PHOTOS.forEach(url => {
        expect(isFallbackPhoto(url)).toBe(true);
      });
    });

    it('returns false for custom photo URLs', () => {
      expect(isFallbackPhoto('https://example.com/custom-photo.jpg')).toBe(false);
    });

    it('returns false for Supabase storage URLs', () => {
      expect(isFallbackPhoto('https://topqlhxdflykejrlbuqx.supabase.co/storage/v1/object/public/photos/image.jpg')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isFallbackPhoto('')).toBe(false);
    });

    it('returns false for partial URL match', () => {
      expect(isFallbackPhoto('https://images.unsplash.com/different-photo-not-in-list')).toBe(false);
    });

    it('returns false for similar but different URLs', () => {
      // Take a fallback URL and modify it slightly
      const modifiedUrl = FALLBACK_FISHING_PHOTOS[0].replace('w=800', 'w=400');
      expect(isFallbackPhoto(modifiedUrl)).toBe(false);
    });

    it('returns false for null-like values', () => {
      expect(isFallbackPhoto(undefined as unknown as string)).toBe(false);
    });
  });
});
