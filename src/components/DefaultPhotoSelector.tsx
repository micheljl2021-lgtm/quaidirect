import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ImageIcon } from "lucide-react";

// Photos par défaut avec URLs de placeholder qui seront remplacées par des images réelles
const DEFAULT_PHOTOS = [
  { 
    id: 'filet', 
    label: 'Filet de poisson', 
    url: 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400&q=80',
    emoji: '🐟'
  },
  { 
    id: 'casier', 
    label: 'Casier crustacés', 
    url: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&q=80',
    emoji: '🦞'
  },
  { 
    id: 'ligne', 
    label: 'Poisson à la ligne', 
    url: 'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=400&q=80',
    emoji: '🎣'
  },
  { 
    id: 'mixte', 
    label: 'Pêche du jour', 
    url: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&q=80',
    emoji: '🌊'
  },
];

interface DefaultPhotoSelectorProps {
  onSelect: (photoUrl: string) => void;
  selectedUrl?: string;
}

export function DefaultPhotoSelector({ onSelect, selectedUrl }: DefaultPhotoSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
        <span>Ou choisir une photo d'illustration</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {DEFAULT_PHOTOS.map((photo) => {
          const isSelected = selectedUrl === photo.url;
          
          return (
            <button
              key={photo.id}
              type="button"
              onClick={() => onSelect(photo.url)}
              onMouseEnter={() => setHoveredId(photo.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`
                relative aspect-video rounded-lg overflow-hidden border-2 transition-all
                ${isSelected 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
                }
              `}
            >
              <img
                src={photo.url}
                alt={photo.label}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay avec label */}
              <div className={`
                absolute inset-0 bg-gradient-to-t from-black/70 to-transparent
                flex flex-col items-center justify-end p-2 transition-opacity
                ${hoveredId === photo.id || isSelected ? 'opacity-100' : 'opacity-70'}
              `}>
                <span className="text-2xl mb-1">{photo.emoji}</span>
                <span className="text-xs text-white font-medium text-center">
                  {photo.label}
                </span>
              </div>

              {/* Badge sélection */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}

              {/* Badge "Illustration" */}
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                Illustration
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Ces photos d'illustration indiquent au client que ce n'est pas votre pêche réelle
      </p>
    </div>
  );
}

// Export pour utilisation dans ArrivageCard
export const DEFAULT_PHOTO_URLS = DEFAULT_PHOTOS.map(p => p.url);
