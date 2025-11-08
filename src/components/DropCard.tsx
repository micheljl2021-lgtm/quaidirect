import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, MapPin, Clock, Euro } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DropCardProps {
  id: string;
  species: string;
  scientificName: string;
  port: string;
  eta: Date;
  pricePerPiece: number;
  quantity: number;
  isPremium?: boolean;
  imageUrl?: string;
  fisherman: {
    name: string;
    boat: string;
  };
}

const DropCard = ({ 
  species, 
  scientificName,
  port, 
  eta, 
  pricePerPiece, 
  quantity,
  isPremium,
  imageUrl,
  fisherman
}: DropCardProps) => {
  const timeToEta = formatDistanceToNow(eta, { addSuffix: true, locale: fr });
  
  return (
    <Card className="group overflow-hidden hover:shadow-ocean transition-all duration-300 cursor-pointer">
      {/* Image */}
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
            <span className="text-muted-foreground">{timeToEta}</span>
          </div>
        </div>

        {/* Price & Quantity */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1">
            <Euro className="h-4 w-4 text-accent" />
            <span className="font-bold text-foreground">{pricePerPiece.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">/ pièce</span>
          </div>
          
          <span className="text-sm text-muted-foreground">
            ~{quantity} pièces
          </span>
        </div>

        {/* Fisherman */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {fisherman.name} • {fisherman.boat}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DropCard;
