import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Fish, MapPin, Clock, Zap, Bell, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Drop {
  id: string;
  port_id: string;
  eta_at: string;
  visible_at: string;
  public_visible_at: string | null;
  is_premium: boolean;
  status: string;
  ports: {
    name: string;
    city: string;
  };
  offers: Array<{
    id: string;
    title: string;
    unit_price: number;
    available_units: number;
    total_units: number;
    species: {
      name: string;
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
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (userRole !== 'premium') {
      navigate('/dashboard/user');
      return;
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [user, userRole, navigate]);

  // Fetch drops premium (avec accès anticipé)
  const { data: drops, isLoading, refetch } = useQuery({
    queryKey: ['premium-drops', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          id,
          port_id,
          eta_at,
          visible_at,
          public_visible_at,
          is_premium,
          status,
          ports (
            name,
            city
          ),
          offers (
            id,
            title,
            unit_price,
            available_units,
            total_units,
            species (
              name
            )
          )
        `)
        .eq('status', 'scheduled')
        .order('eta_at', { ascending: true });

      if (error) throw error;
      return data as Drop[];
    },
    enabled: !!user,
    refetchInterval: 15000, // Premium users get faster refresh
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
        (payload) => {
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

  const handleReserve = async (offerId: string, dropId: string) => {
    try {
      // Check if user already has a reservation for this drop
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

      // Create reservation (1 unit by default, can be modified later)
      const { error } = await supabase
        .from('reservations')
        .insert({
          user_id: user?.id,
          offer_id: offerId,
          quantity: 1,
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Dashboard Premium
            </h1>
            <Badge className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <Crown className="h-3 w-3" />
              Premium
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Accédez aux meilleurs arrivages 30 minutes avant tout le monde
          </p>
        </div>

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
                          {reservation.offer.drop.ports.name}, {reservation.offer.drop.ports.city}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {drops.map((drop) => {
                const etaDate = new Date(drop.eta_at);
                const portName = `${drop.ports.name}, ${drop.ports.city}`;
                const access = getAccessType(drop);
                
                return (
                  <Card key={drop.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="line-clamp-1">{portName}</span>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Arrivée : {getTimeUntil(etaDate)}
                          </CardDescription>
                        </div>
                        <Badge className={`${access.color} text-white whitespace-nowrap flex-shrink-0`}>
                          {access.type === 'premium' && <Crown className="h-3 w-3 mr-1" />}
                          {access.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {drop.offers.length > 0 ? (
                          <>
                            <div className="space-y-2">
                              {drop.offers.map((offer) => (
                                <div key={offer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Fish className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-medium line-clamp-1">{offer.species.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {offer.available_units}/{offer.total_units} disponibles
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <p className="font-bold text-lg text-primary">{offer.unit_price}€</p>
                                    {access.type === 'premium' && offer.available_units > 0 && (
                                      <Button
                                        size="sm"
                                        className="mt-1"
                                        onClick={() => handleReserve(offer.id, drop.id)}
                                      >
                                        Réserver
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            Aucune offre disponible
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
