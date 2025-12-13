import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArrivageCard from "@/components/ArrivageCard";
import { ArrivageCardSkeletonGrid } from "@/components/ArrivageCardSkeleton";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import SalePointDrawer from "@/components/SalePointDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Filter, Search, MapPin, Fish, Locate, Loader2, AlertTriangle } from "lucide-react";
import { useSalePoints } from "@/hooks/useSalePoints";

type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

const Carte = () => {
  const [selectedSalePoint, setSelectedSalePoint] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');

  // Get user's geolocation with enhanced options and error handling
  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.log('[Geoloc] Geolocation not supported by browser');
      setGeoStatus('error');
      return;
    }

    console.log('[Geoloc] Requesting user location...');
    setGeoStatus('loading');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        console.log('[Geoloc] Location obtained:', location);
        setUserLocation(location);
        setGeoStatus('granted');
      },
      (error) => {
        console.log('[Geoloc] Error:', error.code, error.message);
        
        // Determine error type
        if (error.code === error.PERMISSION_DENIED) {
          console.log('[Geoloc] Permission denied by user');
          setGeoStatus('denied');
        } else if (error.code === error.TIMEOUT) {
          console.log('[Geoloc] Request timeout');
          setGeoStatus('error');
        } else {
          console.log('[Geoloc] Position unavailable');
          setGeoStatus('error');
        }
        
        // Map will use default center (Hyères)
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 30000,
      }
    );
  }, []);

  // Auto-request geolocation on mount
  useEffect(() => {
    requestGeolocation();
  }, [requestGeolocation]);

  // Fetch sale points via centralized hook (cached 10 min)
  const { data: salePoints } = useSalePoints();

  // Fetch real ports from database
  const { data: ports } = useQuery({
    queryKey: ['ports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ports')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const handleSalePointClick = (salePointId: string) => {
    const salePoint = salePoints?.find(sp => sp.id === salePointId);
    if (salePoint) {
      setSelectedSalePoint(salePoint);
      setDrawerOpen(true);
    }
  };

  // Fetch real arrivages from database (without joining sale points to avoid RLS)
  const { data: arrivages, isLoading: arrivagesLoading } = useQuery({
    queryKey: ['arrivages-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          id,
          eta_at,
          sale_start_time,
          is_premium,
          latitude,
          longitude,
          sale_point_id,
          port_id,
          ports (
            id,
            name,
            city,
            latitude,
            longitude
          ),
          offers (
            unit_price,
            available_units,
            species (
              name,
              scientific_name
            )
          ),
          fishermen (
            boat_name,
            is_ambassador,
            ambassador_slot
          ),
          drop_photos (
            id,
            photo_url,
            display_order
          )
        `)
        .in('status', ['scheduled', 'landed'])
        .gte('sale_start_time', new Date().toISOString())
        .order('eta_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Trouver le point de vente associé pour chaque arrivage
  const transformedArrivages = arrivages?.map(arrivage => {
    const salePoint = salePoints?.find((sp: any) => sp.id === arrivage.sale_point_id);
    const hasOffers = arrivage.offers && arrivage.offers.length > 0 && arrivage.offers[0]?.unit_price;
    return {
      id: arrivage.id,
      species: arrivage.offers[0]?.species?.name || 'Poisson',
      scientificName: arrivage.offers[0]?.species?.scientific_name || '',
      port: arrivage.ports?.name
        ? arrivage.ports.name
        : (salePoint?.address || salePoint?.label || 'Point de vente'),
      eta: new Date(arrivage.eta_at),
      saleStartTime: arrivage.sale_start_time ? new Date(arrivage.sale_start_time) : undefined,
      pricePerPiece: hasOffers ? arrivage.offers[0].unit_price : undefined,
      quantity: arrivage.offers[0]?.available_units || 0,
      isPremium: arrivage.is_premium,
      dropPhotos: arrivage.drop_photos,
      fisherman: {
        name: arrivage.fishermen?.boat_name || 'Pêcheur',
        boat: arrivage.fishermen?.boat_name || '',
        isAmbassador: arrivage.fishermen?.is_ambassador || false,
        isPartnerAmbassador: arrivage.fishermen?.is_ambassador && arrivage.fishermen?.ambassador_slot === 1,
      },
    };
  }) || [];

  // Transform arrivages for map markers
  const mapDrops = arrivages?.filter(arrivage => {
    const salePoint = salePoints?.find((sp: any) => sp.id === arrivage.sale_point_id);

    // Vérifier qu'on a des coordonnées (priorité: drop coords > sale point > port)
    const lat = arrivage.latitude || salePoint?.latitude || arrivage.ports?.latitude;
    const lng = arrivage.longitude || salePoint?.longitude || arrivage.ports?.longitude;
    return lat && lng && arrivage.offers && arrivage.offers.length > 0;
  }).map(arrivage => {
    const salePoint = salePoints?.find((sp: any) => sp.id === arrivage.sale_point_id);

    return {
      id: arrivage.id,
      latitude: arrivage.latitude || salePoint?.latitude || arrivage.ports?.latitude || 0,
      longitude: arrivage.longitude || salePoint?.longitude || arrivage.ports?.longitude || 0,
      species: arrivage.offers[0]?.species?.name || 'Poisson',
      price: arrivage.offers[0]?.unit_price || 0,
      saleTime: arrivage.sale_start_time
        ? new Date(arrivage.sale_start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : 'À confirmer',
      fishermanName: arrivage.fishermen?.boat_name || 'Pêcheur',
      availableUnits: arrivage.offers[0]?.available_units || 0,
    };
  }) || [];

  const filteredArrivages = transformedArrivages.filter(arrivage => {
    const matchesSearch = !searchQuery || 
      arrivage.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      arrivage.port.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Carte des points de vente
          </h1>
          <p className="text-lg text-muted-foreground">
            {filteredArrivages.length} arrivages disponibles
          </p>
        </div>

        {/* Geolocation Error Alert */}
        {geoStatus === 'denied' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Géolocalisation refusée</AlertTitle>
            <AlertDescription>
              Vous avez refusé l'accès à votre position. Pour activer la géolocalisation :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Chrome/Edge : Cliquez sur l'icône 🔒 dans la barre d'adresse</li>
                <li>Firefox : Cliquez sur l'icône ⓘ et modifiez les permissions</li>
                <li>Safari : Préférences → Sites web → Localisation</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {geoStatus === 'error' && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Géolocalisation indisponible</AlertTitle>
            <AlertDescription>
              Impossible d'obtenir votre position. La carte affiche la zone par défaut.
            </AlertDescription>
          </Alert>
        )}

        {/* Google Map with Localization Button */}
        <div className="mb-6 relative">
          <div className="aspect-video md:aspect-[21/9] rounded-lg overflow-hidden border border-border shadow-lg">
            <GoogleMapComponent 
              ports={ports || []}
              salePoints={salePoints || []}
              drops={mapDrops}
              selectedPortId={null}
              onPortClick={() => {}}
              onSalePointClick={handleSalePointClick}
              userLocation={userLocation}
            />
          </div>
          
          {/* Locate Me Button */}
          <Button
            onClick={requestGeolocation}
            disabled={geoStatus === 'loading'}
            variant={geoStatus === 'granted' ? 'default' : 'secondary'}
            size="icon"
            className="absolute top-4 right-4 shadow-lg"
            title="Me localiser"
          >
            {geoStatus === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Locate className={`h-4 w-4 ${geoStatus === 'granted' ? 'text-primary-foreground' : ''}`} />
            )}
          </Button>
        </div>

        {/* Search bar - below map */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Rechercher une espèce ou un lieu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Sale Point Drawer */}
        <SalePointDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          salePoint={selectedSalePoint}
        />

        {/* Arrivages grid */}
        {arrivagesLoading ? (
          <ArrivageCardSkeletonGrid count={6} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArrivages.map(arrivage => (
              <ArrivageCard key={arrivage.id} {...arrivage} dropPhotos={arrivage.dropPhotos} />
            ))}
          </div>
        )}

        {filteredArrivages.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <Fish className="h-16 w-16 mx-auto text-muted-foreground/50" aria-hidden="true" />
            <div>
              <p className="text-lg font-medium text-foreground mb-2">
                {arrivages && arrivages.length > 0 
                  ? "Aucun arrivage ne correspond à votre recherche"
                  : "Aucun arrivage disponible pour le moment"
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {arrivages && arrivages.length > 0
                  ? "Essayez de modifier vos filtres ou votre recherche"
                  : "Les pêcheurs publient leurs arrivages régulièrement. Revenez bientôt !"
                }
              </p>
            </div>
            {(!arrivages || arrivages.length === 0) && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button onClick={() => window.location.href = '/auth'}>
                  Créer un compte pour être alerté
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/premium'}>
                  Découvrir Premium
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Carte;
