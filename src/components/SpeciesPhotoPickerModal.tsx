import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';
import { toast } from 'sonner';
import { Camera, ImageIcon, Loader2, Check, X, Fish } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeciesPhotoPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dropId: string;
  speciesName: string;
  onComplete: () => void;
}

export function SpeciesPhotoPickerModal({
  open,
  onOpenChange,
  dropId,
  speciesName,
  onComplete,
}: SpeciesPhotoPickerModalProps) {
  const [pixabayImages, setPixabayImages] = useState<string[]>([]);
  const [loadingPixabay, setLoadingPixabay] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadPhoto, uploading } = usePhotoUpload({
    bucket: 'fishermen-photos',
    folder: 'drops',
  });

  // Fetch Pixabay images when modal opens
  useEffect(() => {
    if (open && speciesName && pixabayImages.length === 0) {
      fetchPixabayImages();
    }
  }, [open, speciesName]);

  const fetchPixabayImages = async () => {
    setLoadingPixabay(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-species-photo', {
        body: { speciesName },
      });

      if (error) {
        console.error('Error fetching Pixabay images:', error);
        return;
      }

      if (data?.images && Array.isArray(data.images)) {
        setPixabayImages(data.images);
      }
    } catch (error) {
      console.error('Error in fetchPixabayImages:', error);
    } finally {
      setLoadingPixabay(false);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleGallerySelect = () => {
    galleryInputRef.current?.click();
  };

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

  const handlePixabaySelect = async (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsSaving(true);
    await savePhotoToDrop(imageUrl);
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
        setSelectedImage(null);
        return;
      }

      toast.success('Photo ajoutée à l\'arrivage !');
      onComplete();
    } catch (error) {
      console.error('Error in savePhotoToDrop:', error);
      toast.error('Erreur lors de l\'ajout de la photo');
      setIsSaving(false);
      setSelectedImage(null);
    }
  };

  const handleSkip = () => {
    onComplete();
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
          {/* Camera and Gallery options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-20 flex-col gap-2"
              onClick={handleCameraCapture}
              disabled={isProcessing}
            >
              <Camera className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm">Prendre une photo</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="h-20 flex-col gap-2"
              onClick={handleGallerySelect}
              disabled={isProcessing}
            >
              <ImageIcon className="h-6 w-6" aria-hidden="true" />
              <span className="text-sm">Galerie</span>
            </Button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <Separator className="my-4" />

          {/* Pixabay suggestions */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Fish className="h-4 w-4" aria-hidden="true" />
              Ou choisissez une suggestion :
            </p>
            
            {loadingPixabay ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : pixabayImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {pixabayImages.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => handlePixabaySelect(url)}
                    disabled={isProcessing}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary",
                      selectedImage === url ? "border-primary ring-2 ring-primary" : "border-muted",
                      isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <img
                      src={url}
                      alt={`${speciesName} - option ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {selectedImage === url && isSaving && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                    {selectedImage === url && !isSaving && (
                      <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                        <Check className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                Aucune suggestion disponible
              </div>
            )}
          </div>
        </div>

        {/* Skip button */}
        <Button
          variant="ghost"
          onClick={handleSkip}
          disabled={isProcessing}
          className="w-full text-muted-foreground"
        >
          <X className="h-4 w-4 mr-2" aria-hidden="true" />
          Passer cette étape
        </Button>
      </DialogContent>
    </Dialog>
  );
}
