import { Check, ImageIcon, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

// Photos par défaut avec URLs de placeholder
const DEFAULT_PHOTOS = [
  { 
    id: 'filet', 
    label: 'Filet de poisson', 
    url: 'https://images.unsplash.com/photo-1510130387422-82bed34b37e9?w=400&q=80',
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-between p-2 rounded-lg hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          <span>Photos d'illustration</span>
          {selectedUrl && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">1 sélectionnée</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      
      <CollapsibleContent className="pt-2">
        <div className="grid grid-cols-4 gap-2">
          {DEFAULT_PHOTOS.map((photo) => {
            const isSelected = selectedUrl === photo.url;
            
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
                
                {/* Overlay avec emoji */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-xl">{photo.emoji}</span>
                </div>

                {/* Badge sélection */}
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="h-2.5 w-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Ces illustrations indiquent au client que ce n'est pas votre pêche réelle
        </p>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Export pour utilisation dans ArrivageCard
export const DEFAULT_PHOTO_URLS = DEFAULT_PHOTOS.map(p => p.url);
