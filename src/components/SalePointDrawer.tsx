import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, Heart, Fish } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

interface SalePoint {
  id: string;
  label: string;
  address: string;
  description: string | null;
  is_primary: boolean;
  fisherman: {
    id: string;
    boat_name: string;
    photo_url: string | null;
    bio: string | null;
    fishing_methods: string[] | null;
    company_name: string | null;
    slug: string | null;
  };
}

interface SalePointDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salePoint: SalePoint | null;
}

const SalePointDrawer = ({ open, onOpenChange, salePoint }: SalePointDrawerProps) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  if (!salePoint) return null;

  const handleAddToFavorites = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "Retiré des favoris" : "Ajouté aux favoris");
  };

  const handleViewArrivals = () => {
    navigate(`/arrivages?fisherman=${salePoint.fisherman.id}`);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{salePoint.label}</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="fisherman" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fisherman">Fiche Pêcheur</TabsTrigger>
            <TabsTrigger value="salepoint">Point de vente</TabsTrigger>
          </TabsList>

          <TabsContent value="fisherman" className="space-y-4 mt-4">
            {/* Photo du pêcheur */}
            <div className="aspect-video rounded-lg overflow-hidden bg-gradient-ocean flex items-center justify-center">
              {salePoint.fisherman.photo_url ? (
                <img
                  src={salePoint.fisherman.photo_url}
                  alt={salePoint.fisherman.boat_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Fish className="h-24 w-24 text-white/50" />
              )}
            </div>

            {/* Nom du bateau */}
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {salePoint.fisherman.boat_name}
              </h3>
              {salePoint.fisherman.company_name && (
                <p className="text-sm text-muted-foreground">
                  {salePoint.fisherman.company_name}
                </p>
              )}
            </div>

            {/* Méthodes de pêche */}
            {salePoint.fisherman.fishing_methods && salePoint.fisherman.fishing_methods.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Méthodes de pêche
                </p>
                <div className="flex flex-wrap gap-2">
                  {salePoint.fisherman.fishing_methods.map((method) => (
                    <Badge key={method} variant="secondary">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {salePoint.fisherman.bio && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  À propos
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {salePoint.fisherman.bio}
                </p>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleViewArrivals}
                className="w-full"
                size="lg"
              >
                <Fish className="mr-2 h-5 w-5" />
                Voir les arrivages
              </Button>
              <Button
                onClick={handleAddToFavorites}
                variant={isFavorite ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                <Heart className={`mr-2 h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "Retiré des favoris" : "Ajouter aux favoris"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="salepoint" className="space-y-4 mt-4">
            {/* Photo du point de vente */}
            <div className="aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <MapPin className="h-24 w-24 text-muted-foreground/50" />
            </div>

            {/* Type de point de vente */}
            <div>
              <Badge variant="outline" className="text-base px-3 py-1">
                Point de vente
              </Badge>
            </div>

            {/* Adresse */}
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Adresse</p>
                <p className="text-sm text-muted-foreground">{salePoint.address}</p>
              </div>
            </div>

            {/* Horaires */}
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Horaires</p>
                <p className="text-sm text-muted-foreground">
                  Variable selon les arrivages
                </p>
              </div>
            </div>

            {/* Description */}
            {salePoint.description && (
              <div>
                <p className="font-medium text-foreground mb-2">Description</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {salePoint.description}
                </p>
              </div>
            )}

            {/* Badge primaire */}
            {salePoint.is_primary && (
              <Badge variant="default" className="w-fit">
                Point de vente principal
              </Badge>
            )}

            {/* Boutons d'action */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleViewArrivals}
                className="w-full"
                size="lg"
              >
                <Fish className="mr-2 h-5 w-5" />
                Voir les arrivages de ce point
              </Button>
              <Button
                onClick={handleAddToFavorites}
                variant={isFavorite ? "default" : "outline"}
                className="w-full"
                size="lg"
              >
                <Heart className={`mr-2 h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "Retiré des favoris" : "Ajouter aux favoris"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default SalePointDrawer;
