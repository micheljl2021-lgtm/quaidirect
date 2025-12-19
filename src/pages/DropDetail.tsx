import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MapPin, Clock, Fish, User, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DropDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: drop, isLoading, error } = useQuery({
    queryKey: ['drop', id],
    queryFn: async () => {
      if (!id) throw new Error('ID manquant');

      const { data, error } = await supabase
        .from('drops')
        .select(`
          *,
          public_fishermen!fisherman_id (
            id,
            boat_name,
            company_name,
            display_name_preference,
            photo_url,
            main_fishing_zone,
            is_ambassador,
            slug
          ),
          ports (
            id,
            name,
            city,
            latitude,
            longitude
          ),
          fisherman_sale_points!sale_point_id (
            id,
            label,
            address
          ),
          drop_photos (
            id,
            photo_url,
            display_order
          ),
          offers (
            id,
            title,
            description,
            unit_price,
            available_units,
            total_units,
            indicative_weight_kg,
            price_type,
            species (
              id,
              name,
              scientific_name
            ),
            offer_photos (
              photo_url,
              display_order
            )
          ),
          drop_species (
            id,
            species (
              id,
              name,
              scientific_name
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Arrivage introuvable');
      
      return data;
    },
    enabled: !!id,
  });

  // Auto-redirect to homepage if drop not found - useEffect MUST be before any returns
  useEffect(() => {
    if (!isLoading && (error || !drop)) {
      const timeout = setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, error, drop, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  if (error || !drop) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Arrivage introuvable</p>
              <p className="text-sm text-muted-foreground mt-2">Redirection vers l'accueil...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Use public_fishermen view for anonymous access
  const fishermanData = (drop as any).public_fishermen;
  const displayName = fishermanData
    ? (fishermanData.display_name_preference === 'company_name'
        ? (fishermanData.company_name || fishermanData.boat_name)
        : fishermanData.boat_name)
    : 'Pêcheur inconnu';

  const photos = drop.drop_photos
    ?.sort((a, b) => a.display_order - b.display_order)
    .map(p => p.photo_url) || [];

  const saleDateTime = drop.sale_start_time ? new Date(drop.sale_start_time) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour
        </Button>

        {/* Photos */}
        {photos.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <Carousel className="w-full">
                <CarouselContent>
                  {photos.map((photo, idx) => (
                    <CarouselItem key={idx}>
                      <img
                        src={photo}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-80 object-cover rounded-t-lg"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {photos.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </>
                )}
              </Carousel>
            </CardContent>
          </Card>
        )}

        {/* Informations principales */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">Arrivage de {displayName}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {drop.status === 'completed' && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      ✓ Vente terminée
                    </Badge>
                  )}
                  {fishermanData?.is_ambassador && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                      🏆 Ambassadeur
                    </Badge>
                  )}
                </div>
              </div>
              {fishermanData && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/pecheurs/${fishermanData?.slug || fishermanData?.id}`)}
                  className="gap-2"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  Voir le profil
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" aria-hidden="true" />
              <span>
                {drop.ports 
                  ? `${drop.ports.name}, ${drop.ports.city}`
                  : user 
                    ? (drop.fisherman_sale_points?.label 
                        ? `${drop.fisherman_sale_points.label}${drop.fisherman_sale_points.address ? ` - ${drop.fisherman_sale_points.address}` : ''}`
                        : 'Point de vente partenaire')
                    : 'Point de vente partenaire'}
              </span>
            </div>
            {saleDateTime && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" aria-hidden="true" />
                <span>
                  Vente le {format(saleDateTime, "EEEE d MMMM 'à' HH'h'mm", { locale: fr })}
                </span>
              </div>
            )}
            {drop.notes && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground whitespace-pre-line">{drop.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Offres */}
        {drop.offers && drop.offers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Fish className="h-5 w-5" aria-hidden="true" />
              Produits disponibles
            </h2>
            {drop.offers.map((offer) => {
              const offerPhotos = offer.offer_photos
                ?.sort((a, b) => a.display_order - b.display_order)
                .map(p => p.photo_url) || [];

              return (
                <Card key={offer.id}>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {offerPhotos.length > 0 && (
                        <div className="relative h-48 rounded-lg overflow-hidden">
                          <img
                            src={offerPhotos[0]}
                            alt={offer.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold">{offer.title}</h3>
                          {offer.species && (
                            <p className="text-sm text-muted-foreground">
                              {offer.species.name}
                              {offer.species.scientific_name && ` (${offer.species.scientific_name})`}
                            </p>
                          )}
                        </div>
                        {offer.description && (
                          <p className="text-sm text-muted-foreground">{offer.description}</p>
                        )}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Prix unitaire</span>
                            <span className="text-lg font-semibold text-primary">
                              {offer.unit_price.toFixed(2)} €
                              {offer.price_type && ` / ${offer.price_type}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Disponible</span>
                            <Badge variant="secondary">
                              {offer.available_units} / {offer.total_units} unités
                            </Badge>
                          </div>
                          {offer.indicative_weight_kg && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Poids indicatif</span>
                              <span className="text-sm">{offer.indicative_weight_kg} kg</span>
                            </div>
                          )}
                        </div>
                        <Button className="w-full" disabled={offer.available_units === 0 || drop.status === 'completed'}>
                          {drop.status === 'completed' ? 'Vente terminée' : offer.available_units === 0 ? 'Épuisé' : 'Réserver'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Espèces (mode simple - sans offres) */}
        {(!drop.offers || drop.offers.length === 0) && (drop as any).drop_species && (drop as any).drop_species.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Fish className="h-5 w-5" aria-hidden="true" />
                Espèces disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(drop as any).drop_species.map((ds: any) => (
                  <Badge key={ds.id} variant="secondary" className="px-3 py-1.5 text-sm">
                    {ds.species?.name}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 italic">
                Prix et disponibilité à confirmer sur place
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default DropDetail;
