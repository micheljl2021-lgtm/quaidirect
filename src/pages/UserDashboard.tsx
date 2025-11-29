import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fish, MapPin, Clock, TrendingUp, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRedirectPathByRole } from '@/lib/authRedirect';

interface Drop {
  id: string;
  port_id: string;
  eta_at: string;
  visible_at: string;
  public_visible_at: string | null;
  is_premium: boolean;
  ports: {
    name: string;
    city: string;
  };
  offers: Array<{
    id: string;
    title: string;
    unit_price: number;
    available_units: number;
    species: {
      name: string;
    };
  }>;
}

const UserDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Redirect users with higher roles to their appropriate dashboard
    if (userRole && userRole !== 'user') {
      navigate(getRedirectPathByRole(userRole));
      return;
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [user, userRole, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Fetch drops publics disponibles
  const { data: drops, isLoading } = useQuery({
    queryKey: ['public-drops', user?.id],
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
    refetchInterval: 30000,
  });

  // Fetch forfaits disponibles
  const { data: packages } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const getTimeUntil = (date: Date) => {
    const diff = date.getTime() - currentTime.getTime();
    if (diff < 0) return 'Maintenant disponible';
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Dans ${days}j ${hours % 24}h`;
    }
    
    return `Dans ${hours}h ${minutes}min`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Bienvenue sur QuaiDirect
          </h1>
          <p className="text-lg text-muted-foreground">
            Découvrez les arrivages de poisson frais directement des pêcheurs
          </p>
        </div>

        {/* Info Premium Banner */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  Passez Premium pour des avantages exclusifs
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Accédez aux drops 30 minutes avant tout le monde et réservez votre poisson en priorité
                </p>
                <Button onClick={() => navigate('/premium')} className="gap-2">
                  Découvrir Premium
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-primary" />
                <CardDescription>Drops disponibles</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {drops?.length || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardDescription>Arrivages aujourd'hui</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {drops?.filter(d => {
                  const today = new Date().toDateString();
                  return new Date(d.eta_at).toDateString() === today;
                }).length || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardDescription>Ports actifs</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {drops ? new Set(drops.map(d => d.port_id)).size : 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Liste des Drops */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">
              Arrivages disponibles
            </h2>
            <Button variant="outline" onClick={() => navigate('/arrivages')}>
              Voir tous les arrivages
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 animate-pulse mb-4" />
              <p className="text-muted-foreground">Chargement des arrivages...</p>
            </div>
          ) : drops && drops.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {drops.slice(0, 4).map((drop) => {
                const etaDate = new Date(drop.eta_at);
                const portName = `${drop.ports.name}, ${drop.ports.city}`;
                
                return (
                  <Card key={drop.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="line-clamp-1">{portName}</span>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {getTimeUntil(etaDate)}
                          </CardDescription>
                        </div>
                        {drop.is_premium && (
                          <Badge variant="secondary" className="ml-2 flex-shrink-0">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {drop.offers.length > 0 ? (
                          <>
                            <div className="space-y-2">
                              {drop.offers.slice(0, 2).map((offer) => (
                                <div key={offer.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                                  <div className="flex items-center gap-2">
                                    <Fish className="h-4 w-4 text-primary flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm line-clamp-1">{offer.species.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {offer.available_units} disponibles
                                      </p>
                                    </div>
                                  </div>
                                  <p className="font-bold text-primary flex-shrink-0">{offer.unit_price}€</p>
                                </div>
                              ))}
                              {drop.offers.length > 2 && (
                                <p className="text-xs text-muted-foreground text-center">
                                  +{drop.offers.length - 2} autres offres
                                </p>
                              )}
                            </div>
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => navigate('/arrivages')}
                            >
                              Voir les détails
                            </Button>
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
                  Revenez plus tard ou passez Premium pour voir les drops en avant-première !
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Paniers disponibles */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Nos paniers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages?.slice(0, 3).map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{pkg.price}€</p>
                    <p className="text-sm text-muted-foreground">
                      Pour {pkg.duration_days} jours
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quota poisson</span>
                      <span className="font-medium">{pkg.fish_quota} pièces</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => navigate('/panier')}
                  >
                    Souscrire
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
