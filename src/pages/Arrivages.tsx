import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Fish, MapPin, Anchor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Drop {
  id: string;
  port_id: string;
  fisherman_id: string;
  eta_at: string | null;
  sale_start_time: string | null;
  visible_at: string;
  public_visible_at: string | null;
  is_premium: boolean;
  ports: {
    name: string;
    city: string;
  };
  fishermen: {
    id: string;
    slug: string;
    boat_name: string;
    company_name: string | null;
    display_name_preference: string | null;
    photo_url: string | null;
  };
  offers: Array<{
    id: string;
    title: string;
    unit_price: number;
    available_units: number;
    species: {
      name: string;
    };
    offer_photos: Array<{
      photo_url: string;
      display_order: number;
    }>;
  }>;
}

const Arrivages = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every second for countdown display
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch drops with RLS enforced server-side
  const { data: drops, isLoading, error } = useQuery({
    queryKey: ['drops', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          id,
          port_id,
          fisherman_id,
          eta_at,
          sale_start_time,
          visible_at,
          public_visible_at,
          is_premium,
          status,
          ports (
            name,
            city
          ),
          fishermen (
            id,
            slug,
            boat_name,
            company_name,
            display_name_preference,
            photo_url
          ),
          offers (
            id,
            title,
            unit_price,
            available_units,
            species (
              name
            ),
            offer_photos (
              photo_url,
              display_order
            )
          )
        `)
        .in('status', ['scheduled', 'landed'])
        .order('sale_start_time', { ascending: true });

      if (error) throw error;
      return data as Drop[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up realtime subscription for drops
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('drops-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drops',
        },
        () => {
          // Refetch when drops change
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getTimeUntil = (date: Date) => {
    const diff = date.getTime() - currentTime.getTime();
    if (diff < 0) return 'Maintenant';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    }
    
    return `${minutes}min ${seconds}s`;
  };

  const getAccessBadge = (drop: Drop) => {
    const isPremiumUser = userRole === 'premium';
    const visibleAt = new Date(drop.visible_at);
    const publicVisibleAt = drop.public_visible_at 
      ? new Date(drop.public_visible_at)
      : new Date(visibleAt.getTime() + 30 * 60000); // Default: 30 min after visible_at
    
    // If user can see it and is premium, and it's not yet public
    if (isPremiumUser && currentTime < publicVisibleAt) {
      return (
        <Badge className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500">
          ⭐ Accès Premium
        </Badge>
      );
    }
    
    return null;
  };

  const handleReserve = async (offerId: string) => {
    toast({
      title: 'Réservation',
      description: 'Fonctionnalité de réservation bientôt disponible',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Arrivages à venir</h1>
          <p className="text-muted-foreground">
            {userRole === 'premium' ? (
              <span className="flex items-center gap-2">
                ⭐ <strong>Accès Premium</strong> : Vous voyez les arrivages 30 min avant tout le monde
              </span>
            ) : (
              'Découvrez les prochains arrivages de poisson frais'
            )}
          </p>
        </div>

        {/* Statut utilisateur */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Votre statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type de compte</span>
              <Badge variant={userRole === 'premium' ? 'default' : 'secondary'}>
                {userRole === 'premium' ? '⭐ Premium' : 'Gratuit'}
              </Badge>
            </div>
            {userRole !== 'premium' && (
              <Button className="w-full mt-4" onClick={() => window.location.href = '/premium'}>
                Passer Premium pour voir en avant-première
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 animate-pulse mb-4" />
            <p className="text-muted-foreground">Chargement des arrivages...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">
                Erreur lors du chargement des arrivages. Veuillez réessayer.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!isLoading && !error && drops && drops.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Fish className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Aucun arrivage prévu pour le moment.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Revenez plus tard ou activez les notifications pour être alerté !
              </p>
            </CardContent>
          </Card>
        )}

        {/* Liste des drops */}
        <div className="space-y-4">
          {drops?.map((drop) => {
            const etaDate = drop.eta_at ? new Date(drop.eta_at) : null;
            const saleDate = drop.sale_start_time ? new Date(drop.sale_start_time) : null;
            const displayDate = saleDate || etaDate;
            const portName = `${drop.ports.name}, ${drop.ports.city}`;
            const displayName = drop.fishermen.display_name_preference === 'company_name' 
              ? (drop.fishermen.company_name || drop.fishermen.boat_name)
              : drop.fishermen.boat_name;
            
            return (
              <Card key={drop.id}>
                <CardHeader>
                  {/* Photo du pêcheur si disponible */}
                  {drop.fishermen.photo_url && (
                    <div className="mb-4">
                      <img 
                        src={drop.fishermen.photo_url} 
                        alt={displayName}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {portName}
                      </CardTitle>
                      {drop.fishermen && (
                        <button
                          onClick={() => navigate(`/pecheurs/${drop.fishermen.slug}`)}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Anchor className="h-4 w-4" />
                          <span className="font-medium">
                            {displayName}
                          </span>
                        </button>
                      )}
                      <CardDescription>
                        {saleDate && displayDate ? (
                          <>
                            Retrait à partir de : {displayDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {displayDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                            {etaDate && (
                              <span className="block text-xs text-muted-foreground/70 mt-1">
                                (Débarqué le {etaDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {etaDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                          </>
                        ) : displayDate ? (
                          <>
                            Arrivée prévue : {displayDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {displayDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                          </>
                        ) : null}
                      </CardDescription>
                    </div>
                    {getAccessBadge(drop)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {drop.offers.length > 0 ? (
                      <>
                        <div className="grid gap-2">
                          {drop.offers.map((offer) => (
                            <div key={offer.id} className="space-y-2">
                              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div className="flex items-center gap-3">
                                  <Fish className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="font-medium">{offer.species.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {offer.available_units} unités disponibles
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">~{offer.unit_price}€</p>
                                  <p className="text-xs text-muted-foreground">/ pièce*</p>
                                </div>
                              </div>
                              
                              {/* Photos de l'offre */}
                              {offer.offer_photos && offer.offer_photos.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 px-3">
                                  {offer.offer_photos
                                    .sort((a, b) => a.display_order - b.display_order)
                                    .slice(0, 3)
                                    .map((photo, idx) => (
                                      <img 
                                        key={idx}
                                        src={photo.photo_url} 
                                        alt={`${offer.species.name} ${idx + 1}`}
                                        className="w-full h-24 object-cover rounded-lg border border-border"
                                      />
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Button 
                            className="w-full" 
                            onClick={() => drop.offers[0] && handleReserve(drop.offers[0].id)}
                          >
                            {userRole === 'premium' ? 'Pré-réserver ma pièce' : 'Réserver ma pièce'}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            * Prix indicatif, ajusté après pesée réglementaire au retrait
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <Fish className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Aucune offre disponible pour cet arrivage
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Arrivages;
