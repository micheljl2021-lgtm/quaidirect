import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MapPin, Clock, Fish, User, X, ExternalLink, Anchor } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Drop {
  id: string;
  species: string;
  price: number;
  saleTime: string;
  fishermanName: string;
  availableUnits: number;
  photoUrl?: string;
}

interface SalePoint {
  id: string;
  label: string;
  address: string;
  photo_url?: string;
  fisherman?: {
    id: string;
    boat_name: string;
    photo_url?: string;
    slug?: string;
  };
}

interface MapSelectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: 'drop' | 'salePoint' | null;
  selectedDrop?: Drop | null;
  selectedSalePoint?: SalePoint | null;
  relatedDrop?: Drop | null; // Drop linked to a sale point
}

const MapSelectionPanel = ({
  isOpen,
  onClose,
  selectedType,
  selectedDrop,
  selectedSalePoint,
  relatedDrop,
}: MapSelectionPanelProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {selectedType === 'drop' ? (
                <>
                  <Fish className="h-5 w-5 text-primary" />
                  Arrivage
                </>
              ) : (
                <>
                  <Anchor className="h-5 w-5 text-orange-500" />
                  Point de vente
                </>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Drop Details */}
        {selectedType === 'drop' && selectedDrop && (
          <div className="space-y-4">
            {selectedDrop.photoUrl && (
              <div className="relative h-32 rounded-lg overflow-hidden">
                <img
                  src={selectedDrop.photoUrl}
                  alt={selectedDrop.species}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Espèce</p>
                <p className="font-semibold text-lg">{selectedDrop.species}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prix</p>
                <p className="font-semibold text-lg text-primary">{selectedDrop.price.toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pêcheur</p>
                <p className="font-medium">{selectedDrop.fishermanName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Disponible</p>
                <Badge variant="secondary">{selectedDrop.availableUnits} unités</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Vente à {selectedDrop.saleTime}</span>
            </div>
            <Button 
              className="w-full" 
              onClick={() => {
                navigate(`/drop/${selectedDrop.id}`);
                onClose();
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir les détails
            </Button>
          </div>
        )}

        {/* Sale Point Details */}
        {selectedType === 'salePoint' && selectedSalePoint && (
          <div className="space-y-4">
            {selectedSalePoint.photo_url && (
              <div className="relative h-32 rounded-lg overflow-hidden">
                <img
                  src={selectedSalePoint.photo_url}
                  alt={selectedSalePoint.label}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{selectedSalePoint.label}</h3>
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {selectedSalePoint.address}
              </p>
            </div>

            {/* Related Drop if exists */}
            {relatedDrop && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Fish className="h-4 w-4 text-primary" />
                    Arrivage disponible
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{relatedDrop.species}</p>
                      <p className="text-sm text-muted-foreground">{relatedDrop.saleTime}</p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => {
                        navigate(`/drop/${relatedDrop.id}`);
                        onClose();
                      }}
                    >
                      Voir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fisherman Card */}
            {selectedSalePoint.fisherman && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    {selectedSalePoint.fisherman.photo_url ? (
                      <img
                        src={selectedSalePoint.fisherman.photo_url}
                        alt={selectedSalePoint.fisherman.boat_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{selectedSalePoint.fisherman.boat_name}</p>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary"
                        onClick={() => {
                          const target = selectedSalePoint.fisherman?.slug || selectedSalePoint.fisherman?.id;
                          navigate(`/pecheurs/${target}`);
                          onClose();
                        }}
                      >
                        Voir le profil →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MapSelectionPanel;
