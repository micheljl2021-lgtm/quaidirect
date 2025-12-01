import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArrivageCard from "@/components/ArrivageCard";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import SalePointDrawer from "@/components/SalePointDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Filter, Search, MapPin, Fish } from "lucide-react";

const Carte = () => {
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [selectedSalePoint, setSelectedSalePoint] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Silently fail, map will use default center
        }
      );
    }
  }, []);

  // Fetch sale points with fisherman data
  const { data: salePoints } = useQuery({
    queryKey: ['sale-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fisherman_sale_points')
        .select(`
          *,
          fishermen (
            id,
            boat_name,
            photo_url,
            bio,
            fishing_methods,
            company_name,
            slug
          )
        `)
        .order('label');

      if (error) throw error;
      return data;
    },
  });

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

  // Fetch real arrivages from database
  const { data: arrivages } = useQuery({
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
          fisherman_sale_points (
            id,
            label,
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
          )
        `)
        .in('status', ['scheduled', 'landed'])
        .order('eta_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Transform to match ArrivageCard props
  const transformedArrivages = arrivages?.map(arrivage => ({
    id: arrivage.id,
    species: arrivage.offers[0]?.species?.name || 'Poisson',
    scientificName: arrivage.offers[0]?.species?.scientific_name || '',
    port: `${arrivage.ports?.name}`,
    eta: new Date(arrivage.eta_at),
    saleStartTime: arrivage.sale_start_time ? new Date(arrivage.sale_start_time) : undefined,
    pricePerPiece: arrivage.offers[0]?.unit_price || 0,
    quantity: arrivage.offers[0]?.available_units || 0,
    isPremium: arrivage.is_premium,
    fisherman: {
      name: arrivage.fishermen?.boat_name || 'Pêcheur',
      boat: arrivage.fishermen?.boat_name || '',
      isAmbassador: arrivage.fishermen?.is_ambassador || false,
      isPartnerAmbassador: arrivage.fishermen?.is_ambassador && arrivage.fishermen?.ambassador_slot === 1
    }
  })) || [];

  // Transform arrivages for map markers
  const mapDrops = arrivages?.filter(arrivage => {
    // Vérifier qu'on a des coordonnées (priorité: drop coords > sale point > port)
    const lat = arrivage.latitude || arrivage.fisherman_sale_points?.latitude || arrivage.ports?.latitude;
    const lng = arrivage.longitude || arrivage.fisherman_sale_points?.longitude || arrivage.ports?.longitude;
    return lat && lng && arrivage.offers && arrivage.offers.length > 0;
  }).map(arrivage => ({
    id: arrivage.id,
    latitude: arrivage.latitude || arrivage.fisherman_sale_points?.latitude || arrivage.ports?.latitude || 0,
    longitude: arrivage.longitude || arrivage.fisherman_sale_points?.longitude || arrivage.ports?.longitude || 0,
    species: arrivage.offers[0]?.species?.name || 'Poisson',
    price: arrivage.offers[0]?.unit_price || 0,
    saleTime: arrivage.sale_start_time ? new Date(arrivage.sale_start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'À confirmer',
    fishermanName: arrivage.fishermen?.boat_name || 'Pêcheur',
    availableUnits: arrivage.offers[0]?.available_units || 0,
  })) || [];

  const filteredArrivages = transformedArrivages.filter(arrivage => {
    const matchesPort = !selectedPort || arrivage.port.includes(
      ports?.find(p => p.id === selectedPort)?.name || ''
    );
    const matchesSearch = !searchQuery || 
      arrivage.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      arrivage.port.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPort && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Arrivages du jour
            </h1>
            <p className="text-lg text-muted-foreground">
              {filteredArrivages.length} arrivages disponibles
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une espèce ou un port..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>

          {/* Port filters */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedPort === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedPort(null)}
            >
              Tous les ports
            </Badge>
            {ports?.map(port => (
              <Badge
                key={port.id}
                variant={selectedPort === port.id ? "default" : "outline"}
                className="cursor-pointer gap-1"
                onClick={() => setSelectedPort(port.id)}
              >
                <MapPin className="h-3 w-3" />
                {port.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Google Map */}
        <div className="mb-8 aspect-video md:aspect-[21/9] rounded-lg overflow-hidden border border-border shadow-lg">
            <GoogleMapComponent 
              ports={ports || []}
              salePoints={salePoints || []}
              drops={mapDrops}
              selectedPortId={selectedPort}
              onPortClick={setSelectedPort}
              onSalePointClick={handleSalePointClick}
              userLocation={userLocation}
            />
        </div>

        {/* Sale Point Drawer */}
        <SalePointDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          salePoint={selectedSalePoint}
        />

        {/* Arrivages grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArrivages.map(arrivage => (
            <ArrivageCard key={arrivage.id} {...arrivage} />
          ))}
        </div>

        {filteredArrivages.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <Fish className="h-16 w-16 mx-auto text-muted-foreground/50" />
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
