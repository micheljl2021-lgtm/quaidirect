import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { toast } from 'sonner';
import { Camera, ImageIcon, Loader2, X } from 'lucide-react';

interface FallbackPhotos {
  boatPhoto?: string | null;
  salePointPhoto?: string | null;
  favoritePhoto?: string | null;
}

interface SpeciesPhotoPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dropId: string;
  speciesName: string;
  onComplete: () => void;
  fallbackPhotos?: FallbackPhotos;
}

export function SpeciesPhotoPickerModal({
  open,
  onOpenChange,
  dropId,
  speciesName,
  onComplete,
  fallbackPhotos,
}: SpeciesPhotoPickerModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const { uploadPhoto, uploading } = usePhotoUpload({
    bucket: 'fishermen-photos',
    folder: 'drops',
  });

  // Determine which fallback photo will be used and its label
  const fallbackInfo = useMemo(() => {
    if (fallbackPhotos?.salePointPhoto) {
      return { url: fallbackPhotos.salePointPhoto, label: "photo du point de vente" };
    }
    if (fallbackPhotos?.boatPhoto) {
      return { url: fallbackPhotos.boatPhoto, label: "photo du bateau" };
    }
    if (fallbackPhotos?.favoritePhoto) {
      return { url: fallbackPhotos.favoritePhoto, label: "photo favorite" };
    }
    return null;
  }, [fallbackPhotos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    const photoUrl = await uploadPhoto(file);
    
    if (photoUrl) {
      await savePhotoToDrop(photoUrl);
    } else {
      setIsSaving(false);
    }
    
    // Reset the input
    e.target.value = '';
  };

  const savePhotoToDrop = async (photoUrl: string) => {
    try {
      const { error } = await supabase
        .from('drop_photos')
        .insert({
          drop_id: dropId,
          photo_url: photoUrl,
          display_order: 0,
        });

      if (error) {
        console.error('Error saving photo to drop:', error);
        toast.error('Erreur lors de l\'ajout de la photo');
        setIsSaving(false);
        return;
      }

      toast.success('Photo ajoutée à l\'arrivage !');
      onComplete();
    } catch (error) {
      console.error('Error in savePhotoToDrop:', error);
      toast.error('Erreur lors de l\'ajout de la photo');
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (fallbackInfo?.url) {
      setIsSaving(true);
      await savePhotoToDrop(fallbackInfo.url);
    } else {
      onComplete();
    }
  };

  const isProcessing = uploading || isSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
            Ajouter une photo
          </DialogTitle>
          <DialogDescription>
            Illustrez votre arrivage avec une photo de <strong>{speciesName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Camera and Gallery options - using native labels for mobile compatibility */}
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <div className={`h-24 flex flex-col items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <Camera className="h-8 w-8" aria-hidden="true" />
                <span className="text-sm font-medium">Prendre une photo</span>
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
            
            <label className="cursor-pointer">
              <div className={`h-24 flex flex-col items-center justify-center gap-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                <ImageIcon className="h-8 w-8" aria-hidden="true" />
                <span className="text-sm font-medium">Galerie</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* Loading state */}
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground">Traitement en cours...</span>
            </div>
          )}

          {/* Fallback photo preview */}
          {fallbackInfo && !isProcessing && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground mb-2">
                Si vous passez, nous utiliserons :
              </p>
              <div className="flex items-center gap-3">
                <img 
                  src={fallbackInfo.url} 
                  alt="Photo par défaut" 
                  className="w-14 h-14 rounded-lg object-cover border border-border"
                />
                <span className="text-sm font-medium">Votre {fallbackInfo.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Skip button with dynamic label */}
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={isProcessing}
          className="w-full text-muted-foreground"
        >
          <X className="h-4 w-4 mr-2" aria-hidden="true" />
          {fallbackInfo 
            ? `Utiliser la ${fallbackInfo.label}` 
            : 'Passer sans photo'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
