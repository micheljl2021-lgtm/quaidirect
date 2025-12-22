import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientSubscriptionLevel } from '@/hooks/useClientSubscriptionLevel';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import ClientPreferencesPanel from '@/components/ClientPreferencesPanel';
import ArrivageCard from '@/components/ArrivageCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Fish, MapPin, Clock, Zap, Bell, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRedirectPathByRole } from '@/lib/authRedirect';
import { TestModeBanner } from '@/components/admin/TestModeBanner';

interface Drop {
  id: string;
  port_id: string | null;
  sale_point_id: string | null;
  eta_at: string;
  sale_start_time: string;
  visible_at: string;
  public_visible_at: string | null;
  is_premium: boolean;
  status: string;
  fisherman_id: string;
  ports: {
    name: string;
    city: string;
  } | null;
  fisherman_sale_points: {
    label: string;
    address: string;
  } | null;
  fishermen: {
    id: string;
    slug: string | null;
    boat_name: string;
    company_name: string | null;
    display_name_preference: string | null;
    photo_url: string | null;
    is_ambassador: boolean | null;
  } | null;
  drop_photos: Array<{
    photo_url: string;
    display_order: number;
  }>;
  offers: Array<{
    id: string;
    title: string;
    unit_price: number;
    available_units: number;
    total_units: number;
    species: {
      name: string;
      scientific_name: string | null;
    };
  }>;
}

interface Reservation {
  id: string;
  quantity: number;
  status: string;
  created_at: string;
  expires_at: string;
  offer: {
    title: string;
    unit_price: number;
    drop: {
      eta_at: string;
      ports: {
        name: string;
        city: string;
      };
    };
  };
}

const PremiumDashboard = () => {
  const { user, effectiveRole, viewAsRole, isAdmin, loading } = useAuth();
  const { level, isPremium, isPremiumPlus } = useClientSubscriptionLevel();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPreferences, setShowPreferences] = useState(false);

  // Mode test actif si l'admin simule un rôle "premium"
  const isTestMode = isAdmin && viewAsRole === 'premium';

  // Load favorite fishermen for sorting
  const { data: favoriteFishermen } = useQuery({
    queryKey: ['favorite-fishermen', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('fishermen_followers')
        .select('fisherman_id')
        .eq('user_id', user!.id);
      return data?.map(f => f.fisherman_id) || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    // En mode test, on ne redirige PAS l'admin
    if (!isTestMode && effectiveRole === 'admin') {
      navigate('/dashboard/admin');
      return;
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [user, effectiveRole, isTestMode, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculer le début du jour pour le filtre
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Fetch drops premium (avec accès anticipé)
  const { data: drops, isLoading, refetch } = useQuery({
    queryKey: ['premium-drops', user?.id, favoriteFishermen],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          id,
          port_id,
          sale_point_id,
          eta_at,
          sale_start_time,
          visible_at,
          public_visible_at,
          is_premium,
          status,
          fisherman_id,
          ports (
            name,
            city
          ),
          fisherman_sale_points (
            label,
            address
          ),
          fishermen (
            id,
            slug,
            boat_name,
            company_name,
            display_name_preference,
            photo_url,
            is_ambassador
          ),
          drop_photos (
            photo_url,
            display_order
          ),
          offers (
            id,
            title,
            unit_price,
            available_units,
            total_units,
            species (
              name,
              scientific_name
            )
          )
        `)
        .in('status', ['scheduled', 'landed'])
        .gte('sale_start_time', startOfToday.toISOString())
        .order('eta_at', { ascending: true });

      if (error) throw error;
      
      // Sort drops: favorites first, then by eta_at
      const dropsData = data as Drop[];
      return dropsData.sort((a, b) => {
        const aIsFavorite = favoriteFishermen?.includes(a.fisherman_id);
        const bIsFavorite = favoriteFishermen?.includes(b.fisherman_id);
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        return new Date(a.eta_at).getTime() - new Date(b.eta_at).getTime();
      });
    },
    enabled: !!user,
    refetchInterval: 15000,
    retry: 2,
    staleTime: 30000,
  });

  // Fetch user reservations
  const { data: reservations } = useQuery({
    queryKey: ['user-reservations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          quantity,
          status,
          created_at,
          expires_at,
          offer:offers (
            title,
            unit_price,
            drop:drops (
              eta_at,
              ports (
                name,
                city
              )
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Reservation[];
    },
    enabled: !!user,
  });

  // Set up realtime subscription for new drops
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('premium-drops-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drops',
        },
        () => {
          toast({
            title: '🎣 Nouvel arrivage disponible !',
            description: 'Un nouvel arrivage vient d\'être annoncé',
          });
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch, toast]);

  const getTimeUntil = (date: Date) => {
    const diff = date.getTime() - currentTime.getTime();
    if (diff < 0) return 'Maintenant';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Dans ${days}j ${hours % 24}h`;
    }
    
    return `Dans ${hours}h ${minutes}min`;
  };

  const getAccessType = (drop: Drop) => {
    const now = currentTime;
    const visibleAt = new Date(drop.visible_at);
    const publicVisibleAt = drop.public_visible_at 
      ? new Date(drop.public_visible_at)
      : new Date(visibleAt.getTime() + 30 * 60000);
    
    if (now >= publicVisibleAt) {
      return { type: 'public', label: 'Public', color: 'bg-secondary' };
    } else if (now >= visibleAt) {
      return { type: 'premium', label: 'Accès Premium Exclusif', color: 'bg-gradient-to-r from-yellow-500 to-orange-500' };
    } else {
      return { type: 'upcoming', label: `Accès Premium ${getTimeUntil(visibleAt)}`, color: 'bg-primary' };
    }
  };

  const handleReserve = async (offerId: string) => {
    try {
      const { data: existingReservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('user_id', user?.id)
        .eq('offer_id', offerId)
        .eq('status', 'pending');

      if (existingReservations && existingReservations.length > 0) {
        toast({
          title: 'Réservation existante',
          description: 'Vous avez déjà une réservation pour cette offre',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('reservations')
        .insert({
          user_id: user?.id,
          offer_id: offerId,
          quantity: 1,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      toast({
        title: '✅ Réservation confirmée !',
        description: 'Votre poisson est réservé. Vous avez 24h pour confirmer.',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la réservation',
        variant: 'destructive',
      });
    }
  };

  const activeReservations = reservations?.filter(r => r.status === 'pending') || [];
  const premiumDrops = drops?.filter(d => {
    const access = getAccessType(d);
    return access.type === 'premium';
  }) || [];

  const levelLabel = isPremiumPlus ? 'Premium+' : isPremium ? 'Premium' : 'Follower';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        {/* Test Mode Banner */}
        {isTestMode && <TestModeBanner roleLabel="Client Premium" />}
        {/* Premium Header */}
        <Card className="mb-8 border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    Compte {levelLabel} Actif
                    <Badge className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      <Crown className="h-3 w-3" />
                      {levelLabel}
                    </Badge>
                  </h1>
                  <p className="text-muted-foreground">
                    Alertes ciblées • Soutien aux pêcheurs
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShowPreferences(!showPreferences)}>
                {showPreferences ? 'Masquer préférences' : 'Mes préférences'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Panel */}
        {showPreferences && (
          <div className="mb-8">
            <ClientPreferencesPanel />
          </div>
        )}

        {/* Premium Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardDescription>Accès exclusifs</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {premiumDrops.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-primary" />
                <CardDescription>Arrivages disponibles</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {drops?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardDescription>Réservations actives</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {activeReservations.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardDescription>Aujourd'hui</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {drops?.filter(d => {
                  const today = new Date().toDateString();
                  return new Date(d.eta_at).toDateString() === today;
                }).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Premium Alert */}
        {premiumDrops.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-600" />
                    {premiumDrops.length} accès exclusif{premiumDrops.length > 1 ? 's' : ''} disponible{premiumDrops.length > 1 ? 's' : ''} !
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Vous avez accès à ces arrivages avant leur ouverture au public. Réservez maintenant pour garantir votre poisson !
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Reservations */}
        {activeReservations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Mes réservations actives
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeReservations.map((reservation) => (
                <Card key={reservation.id} className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{reservation.offer.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="h-4 w-4" />
                          {reservation.offer.drop.ports?.name && reservation.offer.drop.ports?.city 
                            ? `${reservation.offer.drop.ports.name}, ${reservation.offer.drop.ports.city}`
                            : 'Lieu non spécifié'}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="border-green-600 text-green-600">
                        Réservé
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantité</span>
                        <span className="font-medium">{reservation.quantity} pièce(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prix unitaire</span>
                        <span className="font-medium">{reservation.offer.unit_price}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-bold text-primary">
                          {(reservation.quantity * reservation.offer.unit_price).toFixed(2)}€
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-muted-foreground">Expire</span>
                        <span className="text-xs font-medium">
                          {getTimeUntil(new Date(reservation.expires_at))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Premium Drops List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Arrivages disponibles
            </h2>
            <Button variant="outline" onClick={() => refetch()}>
              <Bell className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 animate-pulse mb-4" />
              <p className="text-muted-foreground">Chargement des arrivages premium...</p>
            </div>
          ) : drops && drops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drops.map((drop) => {
                const speciesNames = drop.offers.map(o => o.species.name).join(', ') || 'Arrivage du jour';
                const scientificName = drop.offers[0]?.species.scientific_name || '';
                const portName = drop.ports?.name || drop.fisherman_sale_points?.label || 'Port';
                const city = drop.ports?.city || '';
                const salePointLabel = drop.fisherman_sale_points?.label;
                const firstOffer = drop.offers[0];
                const totalAvailable = drop.offers.reduce((sum, o) => sum + o.available_units, 0);
                const totalUnits = drop.offers.reduce((sum, o) => sum + o.total_units, 0);
                const isFavorite = favoriteFishermen?.includes(drop.fisherman_id);
                
                // Déterminer le nom d'affichage du pêcheur
                const displayName = drop.fishermen?.display_name_preference === 'company' && drop.fishermen?.company_name
                  ? drop.fishermen.company_name
                  : drop.fishermen?.boat_name || 'Pêcheur';
                
                return (
                  <div key={drop.id} className={`relative ${isFavorite ? 'ring-2 ring-red-200 rounded-lg' : ''}`}>
                    {isFavorite && (
                      <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        ❤️ Favori
                      </div>
                    )}
                    <ArrivageCard
                      id={drop.id}
                      salePointLabel={salePointLabel}
                      species={speciesNames}
                      scientificName={scientificName}
                      port={portName}
                      city={city}
                      eta={new Date(drop.eta_at)}
                      saleStartTime={drop.sale_start_time ? new Date(drop.sale_start_time) : undefined}
                      pricePerPiece={firstOffer?.unit_price}
                      quantity={totalAvailable}
                      availableUnits={totalAvailable}
                      totalUnits={totalUnits}
                      isPremium={drop.is_premium}
                      dropPhotos={drop.drop_photos}
                      fisherman={{
                        id: drop.fishermen?.id,
                        slug: drop.fishermen?.slug || undefined,
                        name: displayName,
                        boat: drop.fishermen?.boat_name || '',
                        isAmbassador: drop.fishermen?.is_ambassador || false,
                      }}
                      variant="full"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Fish className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Aucun arrivage disponible pour le moment.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vous serez notifié dès qu'un nouvel arrivage sera disponible !
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumDashboard;
