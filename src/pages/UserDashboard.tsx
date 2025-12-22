import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import ArrivageCard from '@/components/ArrivageCard';
import ClientPreferencesPanel from '@/components/ClientPreferencesPanel';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Fish, MapPin, Clock, TrendingUp, Calendar, ArrowRight, Loader2, Bell } from 'lucide-react';
import { getRedirectPathByRole } from '@/lib/authRedirect';
import { TestModeBanner } from '@/components/admin/TestModeBanner';

const UserDashboard = () => {
  const { user, effectiveRole, viewAsRole, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mode test actif si l'admin simule un rôle "user"
  const isTestMode = isAdmin && viewAsRole === 'user';

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    // En mode test, on ne redirige PAS l'admin vers un autre dashboard
    if (!isTestMode && effectiveRole && effectiveRole !== 'user') {
      navigate(getRedirectPathByRole(effectiveRole));
      return;
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

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

  const { data: drops, isLoading } = useQuery({
    queryKey: ['user-dashboard-drops', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          *,
          fishermen:public_fishermen!fisherman_id (
            id,
            boat_name,
            company_name,
            display_name_preference,
            photo_url,
            slug,
            is_ambassador
          ),
          ports (
            id,
            name,
            city
          ),
          fisherman_sale_points (
            id,
            label,
            address
          ),
          drop_photos (
            id,
            photo_url,
            display_order
          ),
          drop_species (
            id,
            species (
              id,
              name,
              scientific_name
            )
          ),
          offers (
            id,
            title,
            unit_price,
            available_units,
            species (
              id,
              name
            )
          )
        `)
        .eq('status', 'scheduled')
        .gte('sale_start_time', startOfToday.toISOString())
        .order('eta_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
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
        {/* Test Mode Banner */}
        {isTestMode && <TestModeBanner roleLabel="Utilisateur standard" />}

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Bienvenue sur QuaiDirect
          </h1>
          <p className="text-lg text-muted-foreground">
            Découvrez les arrivages de poisson frais directement des pêcheurs
          </p>
        </div>

        {/* Notifications Section */}
        <Card className="mb-8 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notifications push</CardTitle>
                  <CardDescription>
                    Recevez une alerte dès qu'un pêcheur publie un nouvel arrivage
                  </CardDescription>
                </div>
              </div>
              <PushNotificationToggle />
            </div>
          </CardHeader>
        </Card>

        {/* Preferences Panel */}
        <div className="mb-8">
          <ClientPreferencesPanel />
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
                  Accédez aux drops 30 minutes avant tout le monde, recevez des alertes email et soutenez vos pêcheurs favoris
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
                // Get species list from drop_species or offers
                const speciesList = drop.drop_species?.map((ds: any) => ds.species?.name).filter(Boolean) || 
                  drop.offers?.map((o: any) => o.species?.name).filter(Boolean) || [];
                const species = speciesList.join(', ') || 'Espèces à découvrir';
                
                // Get location
                const salePoint = drop.fisherman_sale_points;
                const port = drop.ports;
                const locationDisplay = salePoint?.label || (port ? `${port.name}, ${port.city}` : 'Lieu non spécifié');
                
                // Get fisherman name
                const fisherman = drop.fishermen;
                const fisherName = fisherman?.display_name_preference === 'company_name'
                  ? (fisherman?.company_name || fisherman?.boat_name)
                  : fisherman?.boat_name;
                
                // Get first offer price
                const firstOffer = drop.offers?.[0];
                
                return (
                  <ArrivageCard
                    key={drop.id}
                    id={drop.id}
                    salePointLabel={salePoint?.label}
                    species={species}
                    scientificName=""
                    port={locationDisplay}
                    eta={new Date(drop.eta_at)}
                    saleStartTime={drop.sale_start_time ? new Date(drop.sale_start_time) : undefined}
                    pricePerPiece={firstOffer?.unit_price}
                    quantity={firstOffer?.available_units || 0}
                    availableUnits={firstOffer?.available_units}
                    totalUnits={firstOffer?.available_units}
                    dropPhotos={drop.drop_photos}
                    fisherman={{
                      id: fisherman?.id,
                      slug: fisherman?.slug,
                      name: fisherName || 'Pêcheur',
                      boat: fisherman?.boat_name || '',
                      isAmbassador: fisherman?.is_ambassador
                    }}
                    canReserve={false}
                    variant="compact"
                  />
                );
              })}
            </div>
          ) : (
            <Card className="text-center py-16 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardContent className="space-y-6">
                <Fish className="h-16 w-16 mx-auto text-primary/30" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Aucun arrivage disponible</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Les pêcheurs publient leurs arrivages régulièrement. 
                    Explorez la carte ou passez Premium pour être alerté en priorité !
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate('/carte')}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Voir la carte
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/premium')}>
                    Découvrir Premium
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
