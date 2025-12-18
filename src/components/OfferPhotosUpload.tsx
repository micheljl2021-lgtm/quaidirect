import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { toast } from 'sonner';

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
  const inputId = useId();
  const { uploadPhotos, uploading } = usePhotoUpload({
    bucket: 'fishermen-photos',
    folder: ''
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const remainingSlots = maxPhotos - photos.length;

    if (files.length > remainingSlots) {
      toast.error(`Vous ne pouvez ajouter que ${remainingSlots} photo(s) supplémentaire(s)`);
      return;
    }

    const uploadedUrls = await uploadPhotos(files);
    if (uploadedUrls.length > 0) {
      onChange([...photos, ...uploadedUrls]);
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
            id={inputId}
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(inputId)?.click()}
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
