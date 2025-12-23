import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { MapPin, Clock, Fish, User, ExternalLink, Anchor, Calendar, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { LIMITS } from '@/lib/constants';

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
  description?: string | null;
  photo_url?: string;
  fisherman_id?: string;
  fisherman?: {
    id: string;
    boat_name: string;
    photo_url?: string;
    slug?: string;
    bio?: string | null;
    fishing_methods?: string[] | null;
  };
}

interface MapSelectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedType: 'drop' | 'salePoint' | null;
  selectedDrop?: Drop | null;
  selectedSalePoint?: SalePoint | null;
  relatedDrop?: Drop | null;
}

const MapSelectionPanel = ({
  isOpen,
  onClose,
  selectedType,
  selectedDrop,
  selectedSalePoint,
}: MapSelectionPanelProps) => {
  const navigate = useNavigate();

  // Fetch all recent arrivals for this sale point
  const { data: salePointArrivals } = useQuery({
    queryKey: ['sale-point-arrivals', selectedSalePoint?.id],
    queryFn: async () => {
      if (!selectedSalePoint?.id) return [];
      
      const graceMs = LIMITS.ARRIVAL_GRACE_HOURS * 60 * 60 * 1000;
      const minStartTime = new Date(Date.now() - graceMs).toISOString();

      const { data, error } = await supabase
        .from('drops')
        .select(`
          id,
          eta_at,
          sale_start_time,
          drop_species (
            species (name)
          ),
          offers (
            unit_price,
            available_units,
            species (name)
          ),
          fishermen:public_fishermen!fisherman_id (boat_name),
          drop_photos (photo_url, display_order)
        `)
        .eq('sale_point_id', selectedSalePoint.id)
        .in('status', ['scheduled', 'landed'])
        .gte('sale_start_time', minStartTime)
        .order('sale_start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && selectedType === 'salePoint' && !!selectedSalePoint?.id,
  });

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-xl overflow-y-auto">
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

        {/* Sale Point Details with ALL arrivals */}
        {selectedType === 'salePoint' && selectedSalePoint && (
          <div className="space-y-4">
            {/* Photo du point de vente ou pêcheur */}
            <AspectRatio ratio={16 / 9} className="rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              {(selectedSalePoint.photo_url || selectedSalePoint.fisherman?.photo_url) ? (
                <img
                  src={selectedSalePoint.photo_url || selectedSalePoint.fisherman?.photo_url || ''}
                  alt={selectedSalePoint.label}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <MapPin className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </AspectRatio>

            {/* Nom et adresse */}
            <div>
              <h3 className="font-semibold text-xl">{selectedSalePoint.label}</h3>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                {selectedSalePoint.address}
              </p>
            </div>

            {/* Arrivages à ce point de vente */}
            {salePointArrivals && salePointArrivals.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                    <Fish className="h-5 w-5 text-primary" />
                    Arrivages disponibles ({salePointArrivals.length})
                  </h4>
                  <div className="space-y-3 max-h-[180px] overflow-y-auto">
                    {salePointArrivals.map((arrival) => {
                      const firstPhoto = arrival.drop_photos?.sort((a: any, b: any) => a.display_order - b.display_order)?.[0]?.photo_url;
                      // Get species from drop_species AND offers
                      const speciesFromDropSpecies = (arrival as any).drop_species?.map((ds: any) => ds.species?.name).filter(Boolean) || [];
                      const speciesFromOffers = arrival.offers?.map((o: any) => o.species?.name).filter(Boolean) || [];
                      const allSpecies = [...new Set([...speciesFromDropSpecies, ...speciesFromOffers])];
                      const species = allSpecies.length > 0 ? allSpecies.join(', ') : 'Produits de la mer';
                      const price = arrival.offers?.[0]?.unit_price || 0;
                      const units = arrival.offers?.[0]?.available_units || 0;
                      const saleTime = arrival.sale_start_time 
                        ? format(new Date(arrival.sale_start_time), 'HH:mm', { locale: fr })
                        : 'À confirmer';
                      const saleDate = arrival.sale_start_time
                        ? format(new Date(arrival.sale_start_time), 'EEEE d MMMM', { locale: fr })
                        : '';

                      return (
                        <Card 
                          key={arrival.id} 
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => {
                            navigate(`/drop/${arrival.id}`);
                            onClose();
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex gap-3">
                              {firstPhoto && (
                                <img 
                                  src={firstPhoto} 
                                  alt={species}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <p className="font-semibold truncate">{species}</p>
                                  <Badge variant="secondary" className="ml-2 flex-shrink-0">
                                    {price.toFixed(2)}€
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground capitalize">{saleDate}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {saleTime}
                                  </span>
                                  <span>{units} unités</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {salePointArrivals && salePointArrivals.length === 0 && (
              <Card className="bg-muted/50">
                <CardContent className="py-6 text-center">
                  <Fish className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Aucun arrivage prévu pour le moment</p>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Fisherman Card */}
            {selectedSalePoint.fisherman && (
              <div>
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Le pêcheur
                </h4>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {selectedSalePoint.fisherman.photo_url ? (
                        <img
                          src={selectedSalePoint.fisherman.photo_url}
                          alt={selectedSalePoint.fisherman.boat_name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                          <User className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{selectedSalePoint.fisherman.boat_name}</p>
                        {selectedSalePoint.fisherman.fishing_methods && selectedSalePoint.fisherman.fishing_methods.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedSalePoint.fisherman.fishing_methods.slice(0, 3).map((method) => (
                              <Badge key={method} variant="outline" className="text-xs">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {selectedSalePoint.fisherman.bio && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {selectedSalePoint.fisherman.bio}
                          </p>
                        )}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary mt-2"
                          onClick={() => {
                            const target = selectedSalePoint.fisherman?.slug || selectedSalePoint.fisherman?.id;
                            navigate(`/pecheurs/${target}`);
                            onClose();
                          }}
                        >
                          Voir le profil complet →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Description du point de vente */}
            {selectedSalePoint.description && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-base mb-2">À propos de ce point de vente</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedSalePoint.description}
                  </p>
                </div>
              </>
            )}

            {/* Action buttons */}
            <div className="pt-4 space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => {
                  if (selectedSalePoint.fisherman?.id) {
                    navigate(`/arrivages?fisherman=${selectedSalePoint.fisherman.id}`);
                  } else {
                    navigate('/arrivages');
                  }
                  onClose();
                }}
              >
                <Fish className="h-4 w-4 mr-2" />
                Tous les arrivages de ce pêcheur
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MapSelectionPanel;
