import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { 
  MapPin, 
  Clock, 
  Fish, 
  User, 
  ArrowLeft, 
  ChevronRight, 
  Anchor,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { LIMITS } from '@/lib/constants';

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

interface SalePointFullScreenProps {
  salePoint: SalePoint;
  allSalePointIds: string[];
  onClose: () => void;
  onNavigateToNext: (salePointId: string) => void;
}

const SalePointFullScreen = ({
  salePoint,
  allSalePointIds,
  onClose,
  onNavigateToNext,
}: SalePointFullScreenProps) => {
  const navigate = useNavigate();

  // Find next sale point
  const currentIndex = allSalePointIds.indexOf(salePoint.id);
  const nextIndex = (currentIndex + 1) % allSalePointIds.length;
  const nextSalePointId = allSalePointIds[nextIndex];
  const hasMultipleSalePoints = allSalePointIds.length > 1;

  // Fetch arrivals for this sale point
  const { data: arrivals } = useQuery({
    queryKey: ['sale-point-arrivals', salePoint.id],
    queryFn: async () => {
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
        .eq('sale_point_id', salePoint.id)
        .in('status', ['scheduled', 'landed'])
        .gte('sale_start_time', minStartTime)
        .order('sale_start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const getSpeciesFromArrival = (arrival: any): string => {
    const fromDropSpecies = arrival.drop_species?.map((ds: any) => ds.species?.name).filter(Boolean) || [];
    const fromOffers = arrival.offers?.map((o: any) => o.species?.name).filter(Boolean) || [];
    const allSpecies = [...new Set([...fromDropSpecies, ...fromOffers])];
    return allSpecies.length > 0 ? allSpecies.join(', ') : 'Produits de la mer';
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour à la carte
        </Button>

        {hasMultipleSalePoints && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onNavigateToNext(nextSalePointId)}
            className="gap-2"
          >
            Point suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Photo */}
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
            {(salePoint.photo_url || salePoint.fisherman?.photo_url) ? (
              <img
                src={salePoint.photo_url || salePoint.fisherman?.photo_url || ''}
                alt={salePoint.label}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Anchor className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </AspectRatio>

          {/* Title & Address */}
          <div>
            <h1 className="text-2xl font-bold">{salePoint.label}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              {salePoint.address}
            </p>
          </div>

          {/* Description */}
          {salePoint.description && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{salePoint.description}</p>
            </div>
          )}

          <Separator />

          {/* Arrivals */}
          <div>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Fish className="h-5 w-5 text-primary" />
              Arrivages disponibles
            </h2>

            {arrivals && arrivals.length > 0 ? (
              <div className="space-y-3">
                {arrivals.map((arrival) => {
                  const firstPhoto = arrival.drop_photos?.sort((a: any, b: any) => a.display_order - b.display_order)?.[0]?.photo_url;
                  const species = getSpeciesFromArrival(arrival);
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
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {firstPhoto && (
                            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={firstPhoto} 
                                alt={species}
                                className="w-full h-full object-cover object-center"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="font-semibold truncate">{species}</p>
                              {price > 0 && (
                                <Badge variant="secondary" className="ml-2 flex-shrink-0">
                                  {price.toFixed(2)}€
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize mt-1">{saleDate}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {saleTime}
                              </span>
                              {units > 0 && <span>{units} unités</span>}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="py-8 text-center">
                  <Fish className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">Aucun arrivage prévu pour le moment</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Revenez bientôt !</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator />

          {/* Fisherman */}
          {salePoint.fisherman && (
            <div>
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Le pêcheur
              </h2>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {salePoint.fisherman.photo_url ? (
                      <img
                        src={salePoint.fisherman.photo_url}
                        alt={salePoint.fisherman.boat_name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <User className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{salePoint.fisherman.boat_name}</p>
                      {salePoint.fisherman.fishing_methods && salePoint.fisherman.fishing_methods.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {salePoint.fisherman.fishing_methods.slice(0, 3).map((method) => (
                            <Badge key={method} variant="outline" className="text-xs">
                              {method}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {salePoint.fisherman.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {salePoint.fisherman.bio}
                        </p>
                      )}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary mt-3"
                        onClick={() => {
                          const target = salePoint.fisherman?.slug || salePoint.fisherman?.id;
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

          {/* Actions */}
          <div className="pb-8 space-y-3">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                if (salePoint.fisherman?.id) {
                  navigate(`/arrivages?fisherman=${salePoint.fisherman.id}`);
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
      </div>
    </div>
  );
};

export default SalePointFullScreen;