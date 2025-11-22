import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DropPhotosUploadProps {
  maxPhotos?: number;
  onPhotosChange: (photoUrls: string[]) => void;
  initialPhotos?: string[];
}

export const DropPhotosUpload = ({ 
  maxPhotos = 5, 
  onPhotosChange,
  initialPhotos = []
}: DropPhotosUploadProps) => {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Limite atteinte",
        description: `Vous ne pouvez ajouter que ${maxPhotos} photos maximum`,
        variant: "destructive",
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `drop-photos/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('fishermen-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('fishermen-photos')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const newPhotos = [...photos, ...uploadedUrls];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);

      toast({
        title: "Photos ajoutées",
        description: `${uploadedUrls.length} photo(s) ajoutée(s) avec succès`,
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader les photos",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border">
              <img
                src={url}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                Photo {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {photos.length < maxPhotos && (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
          <Camera className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1 text-foreground">
            Photos de votre point de vente
          </p>
          <p className="text-xs text-muted-foreground mb-4 text-center max-w-sm">
            Étal, caisses de poissons, ambiance... {photos.length}/{maxPhotos} photos
          </p>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            asChild
          >
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Upload en cours..." : "Ajouter des photos"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </label>
          </Button>
        </div>
      )}

      {/* Hint */}
      {photos.length >= 2 && (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-xs text-green-800 dark:text-green-200">
            ✅ Parfait ! Des photos attrayantes augmentent vos ventes de 40% en moyenne
          </p>
        </div>
      )}
    </div>
  );
};
