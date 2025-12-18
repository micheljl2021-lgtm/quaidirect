import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UsePhotoUploadOptions {
  bucket?: string;
  folder?: string;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UsePhotoUploadReturn {
  uploadPhoto: (file: File) => Promise<string | null>;
  uploadPhotos: (files: File[]) => Promise<string[]>;
  uploading: boolean;
}

/**
 * Centralized hook for uploading photos to Supabase Storage.
 * Used by PhotoUpload, DropPhotosUpload, and OfferPhotosUpload components.
 */
export function usePhotoUpload(options: UsePhotoUploadOptions = {}): UsePhotoUploadReturn {
  const { 
    bucket = 'fishermen-photos', 
    folder = '', 
    onSuccess, 
    onError 
  } = options;
  
  const [uploading, setUploading] = useState(false);

  /**
   * Generate a unique file name for storage
   */
  const generateFileName = useCallback((originalName: string): string => {
    const ext = originalName.split('.').pop() || 'jpg';
    const random = Math.random().toString(36).substring(2);
    const timestamp = Date.now();
    return `${random}-${timestamp}.${ext}`;
  }, []);

  /**
   * Build the full file path including folder prefix
   */
  const buildFilePath = useCallback((fileName: string): string => {
    return folder ? `${folder}/${fileName}` : fileName;
  }, [folder]);

  /**
   * Upload a single photo and return its public URL
   */
  const uploadPhoto = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true);

    try {
      const fileName = generateFileName(file.name);
      const filePath = buildFilePath(fileName);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onSuccess?.(publicUrl);
      toast.success('Photo téléchargée avec succès');
      
      return publicUrl;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      console.error('Error uploading photo:', err);
      onError?.(err);
      toast.error('Erreur lors du téléchargement de la photo');
      return null;
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, generateFileName, buildFilePath, onSuccess, onError]);

  /**
   * Upload multiple photos and return array of public URLs
   */
  const uploadPhotos = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const fileName = generateFileName(file.name);
        const filePath = buildFilePath(fileName);

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) {
          console.error('Error uploading file:', file.name, uploadError);
          continue; // Skip failed uploads but continue with others
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
        onSuccess?.(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        toast.success(`${uploadedUrls.length} photo(s) téléchargée(s) avec succès`);
      } else {
        toast.error('Aucune photo n\'a pu être téléchargée');
      }

      return uploadedUrls;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Upload failed');
      console.error('Error uploading photos:', err);
      onError?.(err);
      toast.error('Erreur lors du téléchargement des photos');
      return uploadedUrls;
    } finally {
      setUploading(false);
    }
  }, [bucket, folder, generateFileName, buildFilePath, onSuccess, onError]);

  return { uploadPhoto, uploadPhotos, uploading };
}
