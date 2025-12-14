import { Check, ImageIcon, Star } from "lucide-react";

interface FavoritePhotoSelectorProps {
  onSelect: (photoUrl: string) => void;
  selectedPhotoUrl?: string;
  photoUrl?: string;
  photoBoat1?: string;
  photoBoat2?: string;
  photoDockSale?: string;
}

export function FavoritePhotoSelector({
  onSelect,
  selectedPhotoUrl,
  photoUrl,
  photoBoat1,
  photoBoat2,
  photoDockSale,
}: FavoritePhotoSelectorProps) {
  // Build dynamic photo list from fisherman's actual photos
  const photos: { id: string; label: string; url: string; emoji: string }[] = [];
  
  if (photoUrl) {
    photos.push({ id: 'photo_url', label: 'Photo de profil', url: photoUrl, emoji: '👤' });
  }
  if (photoBoat1) {
    photos.push({ id: 'photo_boat_1', label: 'Photo bateau 1', url: photoBoat1, emoji: '🚢' });
  }
  if (photoBoat2) {
    photos.push({ id: 'photo_boat_2', label: 'Photo bateau 2', url: photoBoat2, emoji: '⛵' });
  }
  if (photoDockSale) {
    photos.push({ id: 'photo_dock_sale', label: 'Photo vente à quai', url: photoDockSale, emoji: '🎣' });
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Ajoutez des photos à votre profil pour en sélectionner une comme favorite</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Star className="h-4 w-4" />
        <span>Choisissez la photo qui apparaîtra sur la carte et dans vos emails</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {photos.map((photo) => {
          const isSelected = selectedPhotoUrl === photo.url;
          
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onSelect(photo.url)}
              className={`
                relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                ${isSelected 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
                }
              `}
              title={photo.label}
            >
              <img
                src={photo.url}
                alt={photo.label}
                className="w-full h-full object-cover"
              />
              
              {/* Label overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 px-2">
                <span className="text-xs text-white truncate block">{photo.label}</span>
              </div>

              {/* Selection badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
