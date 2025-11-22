import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, MapPin, Clock, Euro } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ArrivageCardProps {
  id: string;
  species: string;
  scientificName: string;
  port: string;
  eta: Date;
  saleStartTime?: Date;
  pricePerPiece: number;
  quantity: number;
  isPremium?: boolean;
  imageUrl?: string;
  dropPhotos?: Array<{ photo_url: string; display_order: number }>;
  fisherman: {
    name: string;
    boat: string;
  };
}

const ArrivageCard = ({ 
  species, 
  scientificName,
  port, 
  eta,
  saleStartTime,
  pricePerPiece, 
  quantity,
  isPremium,
  imageUrl,
  dropPhotos,
  fisherman
}: ArrivageCardProps) => {
  const displayTime = saleStartTime || eta;
  const timeToSale = formatDistanceToNow(displayTime, { addSuffix: true, locale: fr });
  
  // Utiliser les photos du drop si disponibles, sinon l'image par défaut
  const displayPhotos = dropPhotos && dropPhotos.length > 0 
    ? dropPhotos.sort((a, b) => a.display_order - b.display_order)
    : null;
  
  return (
    <Card className="group overflow-hidden hover:shadow-ocean transition-all duration-300 cursor-pointer">
      {/* Images du point de vente */}
      {displayPhotos && displayPhotos.length > 0 ? (
        <div className="relative">
          {/* Photo principale */}
          <div className="relative aspect-video overflow-hidden bg-muted">
            <img 
              src={displayPhotos[0].photo_url} 
              alt="Point de vente"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {isPremium && (
              <div className="absolute top-3 right-3">
                <Badge className="gap-1 bg-premium text-premium-foreground border-0 shadow-md">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              </div>
            )}
          </div>
          {/* Miniatures des autres photos */}
          {displayPhotos.length > 1 && (
            <div className="flex gap-1 p-2 bg-background/95 backdrop-blur-sm">
              {displayPhotos.slice(1, 4).map((photo, i) => (
                <img
                  key={i}
                  src={photo.photo_url}
                  alt={`Photo ${i + 2}`}
                  className="w-16 h-16 object-cover rounded flex-shrink-0 border border-border"
                />
              ))}
              {displayPhotos.length > 4 && (
                <div className="w-16 h-16 rounded border border-border bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  +{displayPhotos.length - 4}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative aspect-video overflow-hidden bg-muted">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={species}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-sky">
              <MapPin className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {isPremium && (
            <div className="absolute top-3 right-3">
              <Badge className="gap-1 bg-premium text-premium-foreground border-0 shadow-md">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Species */}
        <div>
          <h3 className="font-bold text-lg text-foreground">{species}</h3>
          <p className="text-xs text-muted-foreground italic">{scientificName}</p>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{port}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground text-xs">
              {saleStartTime ? `Retrait ${timeToSale}` : `Arrivée ${timeToSale}`}
            </span>
          </div>
        </div>

        {/* Price & Quantity */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Euro className="h-4 w-4 text-accent" />
            <span className="font-bold text-foreground">~{pricePerPiece.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">/ pièce*</span>
          </div>
          
          <span className="text-sm text-muted-foreground">
            {quantity} pièce{quantity > 1 ? 's' : ''}
          </span>
        </div>

        {/* Fisherman & Note */}
        <div className="pt-2 border-t border-border space-y-1">
          <p className="text-xs text-muted-foreground">
            {fisherman.name} • {fisherman.boat}
          </p>
          <p className="text-[10px] text-muted-foreground/70 italic">
            * Prix indicatif, ajusté après pesée réglementaire au retrait
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArrivageCard;
