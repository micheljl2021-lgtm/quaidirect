import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Upload } from "lucide-react";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { DefaultPhotoSelector } from "@/components/DefaultPhotoSelector";
import { Separator } from "@/components/ui/separator";

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
  const [isDragging, setIsDragging] = useState(false);
  
  const { uploadPhotos, uploading } = usePhotoUpload({
    bucket: 'fishermen-photos',
    folder: 'drop-photos'
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleFilesUpload(Array.from(files));
  };

  const handleFilesUpload = async (files: File[]) => {
    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) return;

    const filesToUpload = files.slice(0, remainingSlots);
    const uploadedUrls = await uploadPhotos(filesToUpload);

    if (uploadedUrls.length > 0) {
      const newPhotos = [...photos, ...uploadedUrls];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      handleFilesUpload(files);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosChange(newPhotos);
  };

  const handleDefaultPhotoSelect = (photoUrl: string) => {
    if (photos.includes(photoUrl)) {
      const newPhotos = photos.filter(p => p !== photoUrl);
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    } else {
      const newPhotos = [...photos, photoUrl];
      setPhotos(newPhotos);
      onPhotosChange(newPhotos);
    }
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

      {/* Upload Button with Drag & Drop */}
      {photos.length < maxPhotos && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-all
            ${isDragging 
              ? "border-primary bg-primary/5 scale-105" 
              : "border-border hover:border-primary"
            }
          `}
        >
          <Camera className={`h-12 w-12 mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          <p className="text-sm font-medium mb-1 text-foreground">
            {isDragging ? "Dépose tes photos ici" : "Photos de vos prises"}
          </p>
          <p className="text-xs text-muted-foreground mb-4 text-center max-w-sm">
            {isDragging 
              ? "Relâche pour uploader" 
              : `Glisse-dépose ou clique pour ajouter • ${photos.length}/${maxPhotos} photos`
            }
          </p>
          {!isDragging && (
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
          )}
        </div>
      )}

      {/* Default Photos Selector - only show if no photos yet */}
      {photos.length === 0 && (
        <>
          <Separator className="my-4" />
          <DefaultPhotoSelector 
            onSelect={handleDefaultPhotoSelect}
            selectedUrl={photos.find(p => p.includes('unsplash.com'))}
          />
        </>
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
