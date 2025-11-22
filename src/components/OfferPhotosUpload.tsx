import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OfferPhotosUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  minPhotos?: number;
}

const OfferPhotosUpload = ({
  photos = [],
  onChange,
  maxPhotos = 5,
  minPhotos = 2,
}: OfferPhotosUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const remainingSlots = maxPhotos - photos.length;

    if (files.length > remainingSlots) {
      toast({
        title: 'Limite atteinte',
        description: `Vous ne pouvez ajouter que ${remainingSlots} photo(s) supplémentaire(s)`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('fishermen-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('fishermen-photos')
          .getPublicUrl(filePath);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...photos, ...uploadedUrls]);

      toast({
        title: 'Photos ajoutées',
        description: `${uploadedUrls.length} photo(s) ajoutée(s) avec succès`,
      });
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger les photos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);
  };

  return (
    <div className="space-y-3">
      <Label>
        Photos de l'offre ({photos.length}/{maxPhotos})
      </Label>
      <p className="text-sm text-muted-foreground">
        Ajoutez entre {minPhotos} et {maxPhotos} photos de ce que vous vendez
      </p>

      {/* Preview des photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'upload */}
      {photos.length < maxPhotos && (
        <div>
          <input
            type="file"
            id={`offer-photos-${Math.random()}`}
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`offer-photos-${Math.random()}`)?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Ajouter des photos ({maxPhotos - photos.length} restantes)
              </>
            )}
          </Button>
        </div>
      )}

      {photos.length > 0 && photos.length < minPhotos && (
        <p className="text-sm text-amber-600 dark:text-amber-500">
          ⚠️ Ajoutez au moins {minPhotos - photos.length} photo(s) supplémentaire(s)
        </p>
      )}
    </div>
  );
};

export default OfferPhotosUpload;