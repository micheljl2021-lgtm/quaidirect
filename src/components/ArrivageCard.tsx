import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, MapPin, Clock, Euro, ShoppingCart, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import AmbassadorBadge from "@/components/AmbassadorBadge";

interface ArrivageCardProps {
  id: string;
  species: string;
  scientificName: string;
  port: string;
  city?: string;
  eta: Date;
  saleStartTime?: Date;
  pricePerPiece: number;
  quantity: number;
  availableUnits?: number;
  totalUnits?: number;
  isPremium?: boolean;
  imageUrl?: string;
  dropPhotos?: Array<{ photo_url: string; display_order: number }>;
  fisherman: {
    name: string;
    boat: string;
    isAmbassador?: boolean;
    isPartnerAmbassador?: boolean;
  };
  onReserve?: () => void;
  canReserve?: boolean;
  variant?: 'compact' | 'full';
}

const ArrivageCard = ({ 
  species, 
  scientificName,
  port,
  city,
  eta,
  saleStartTime,
  pricePerPiece, 
  quantity,
  availableUnits,
  totalUnits,
  isPremium,
  imageUrl,
  dropPhotos,
  fisherman,
  onReserve,
  canReserve = false,
  variant = 'compact'
}: ArrivageCardProps) => {
  const displayTime = saleStartTime || eta;
  const timeToSale = formatDistanceToNow(displayTime, { addSuffix: true, locale: fr });
  
  // Utiliser les photos du drop si disponibles, sinon l'image par défaut
  const displayPhotos = dropPhotos && dropPhotos.length > 0 
    ? dropPhotos.sort((a, b) => a.display_order - b.display_order)
    : null;
  
  // Calculate stock percentage for full variant
  const stockPercentage = availableUnits && totalUnits 
    ? (availableUnits / totalUnits) * 100 
    : 100;
  
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
            {/* Badges Ambassador */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {fisherman.isPartnerAmbassador && (
                <Badge className="gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-md">
                  <Star className="h-3 w-3" />
                  Ambassadeur Partenaire
                </Badge>
              )}
              {fisherman.isAmbassador && !fisherman.isPartnerAmbassador && (
                <Badge className="gap-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md">
                  <Crown className="h-3 w-3" />
                  Ambassadeur
                </Badge>
              )}
            </div>
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
      ) : imageUrl ? (
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img 
            src={imageUrl} 
            alt={species}
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
      ) : (
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <MapPin className="h-12 w-12 text-muted-foreground/30" />
        </div>
      )}

      <CardContent className={variant === 'full' ? "p-5 space-y-4" : "p-4 space-y-3"}>
        {/* Species */}
        <div>
          <h3 className={`font-bold text-foreground ${variant === 'full' ? 'text-xl' : 'text-lg'}`}>
            {species}
          </h3>
          {scientificName && (
            <p className="text-xs text-muted-foreground italic">{scientificName}</p>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{port}</p>
              {city && variant === 'full' && (
                <p className="text-xs text-muted-foreground truncate">{city}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {saleStartTime ? `Retrait ${timeToSale}` : `Arrivée ${timeToSale}`}
              </p>
              {variant === 'full' && (
                <p className="text-xs font-medium text-foreground">
                  {displayTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stock Bar (full variant only) */}
        {variant === 'full' && availableUnits !== undefined && totalUnits !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Stock disponible</span>
              <span className="font-medium">{availableUnits}/{totalUnits} pièces</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  stockPercentage > 60 ? 'bg-green-500' :
                  stockPercentage > 30 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${stockPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {variant === 'full' ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-primary">{pricePerPiece.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">€/pièce*</span>
              </div>
              
              {canReserve && onReserve && (availableUnits ?? quantity) > 0 && (
                <Button 
                  onClick={onReserve}
                  size="sm"
                  className="gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Commander
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <Euro className="h-4 w-4 text-accent" />
                <span className="font-bold text-foreground">~{pricePerPiece.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">/ pièce*</span>
              </div>
              
              <span className="text-sm text-muted-foreground">
                {quantity} pièce{quantity > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>

        {/* Fisherman & Note */}
        <div className="pt-2 border-t border-border space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {fisherman.name} • {fisherman.boat}
            </p>
            {fisherman.isPartnerAmbassador && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500 text-yellow-600">
                <Star className="h-2.5 w-2.5 mr-0.5" />
                Partenaire
              </Badge>
            )}
            {fisherman.isAmbassador && !fisherman.isPartnerAmbassador && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500 text-blue-600">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                Ambassadeur
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/70 italic">
            * Prix indicatif, ajusté après pesée réglementaire au retrait
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArrivageCard;
