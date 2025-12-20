import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArrivageCard from "@/components/ArrivageCard";
import { ArrivageCardSkeletonGrid } from "@/components/ArrivageCardSkeleton";
import GoogleMapComponent from "@/components/GoogleMapComponent";
import MapSelectionPanel from "@/components/MapSelectionPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSalePoints } from "@/hooks/useSalePoints";
import { useFishermanZone } from "@/hooks/useFishermanZone";
import { getDropLocationLabel } from "@/lib/dropLocationUtils";
import { Search, Fish, Locate, Loader2, AlertTriangle, UserPlus, MapPin, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { LIMITS } from "@/lib/constants";
import { toast } from "sonner";

type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

const Carte = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fishermanZone, isFisherman } = useFishermanZone();
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  
  // Toggle "Ma zone / Partout" - par défaut sur "Ma zone" pour les pêcheurs
  const [showMyZoneOnly, setShowMyZoneOnly] = useState(true);
  
  // Dialog for anonymous users
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  
  // Map selection state for panel
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'drop' | 'salePoint' | null>(null);
  const [selectedDropId, setSelectedDropId] = useState<string | null>(null);
  const [selectedSalePointId, setSelectedSalePointId] = useState<string | null>(null);

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

  // Sale points: Publics pour tous les utilisateurs (anonymes et connectés)
  // Les anonymes voient les points de vente sur la carte mais pas les détails
  const { data: salePointsData } = useSalePoints({ enabled: true });
  
  // Filter and transform sale points for map (fishermen -> fisherman)
  const validSalePoints = salePointsData
    ? salePointsData
        .filter(sp => sp.latitude != null && sp.longitude != null)
        .map(sp => ({
          id: sp.id,
          label: sp.label,
          address: sp.address,
          latitude: sp.latitude as number,
          longitude: sp.longitude as number,
          fisherman_id: sp.fisherman_id,
          photo_url: sp.photo_url,
          description: sp.description,
          is_primary: sp.is_primary,
          fisherman: sp.fishermen ? {
            id: sp.fishermen.id,
            boat_name: sp.fishermen.boat_name,
            photo_url: sp.fishermen.photo_url,
            slug: sp.fishermen.slug,
            bio: sp.fishermen.bio,
            fishing_methods: sp.fishermen.fishing_methods,
          } : undefined,
        }))
    : [];

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

  // Fetch real arrivages from database - ONLY for authenticated users
  const { data: arrivages, isLoading: arrivagesLoading } = useQuery({
    queryKey: ['arrivages-map', user?.id],
    queryFn: async () => {
      // Grace period: show arrivals up to X hours after their sale_start_time
      const graceMs = LIMITS.ARRIVAL_GRACE_HOURS * 60 * 60 * 1000;
      const minStartTime = new Date(Date.now() - graceMs).toISOString();

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
          drop_species (
            id,
            species (
              id,
              name,
              scientific_name
            )
          ),
          offers (
            unit_price,
            available_units,
            species (
              id,
              name,
              scientific_name
            )
          ),
          fishermen:public_fishermen!fisherman_id (
            id,
            boat_name,
            is_ambassador,
            slug,
            main_fishing_zone
          ),
          drop_photos (
            id,
            photo_url,
            display_order
          )
        `)
        .in('status', ['scheduled', 'landed'])
        .gte('sale_start_time', minStartTime)
        .order('eta_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!user, // Only fetch if user is authenticated
    refetchInterval: 30000,
  });

  // Transform arrivages for display using consistent location helper
  const transformedArrivages = arrivages?.map(arrivage => {
    const hasOffers = arrivage.offers && arrivage.offers.length > 0 && arrivage.offers[0]?.unit_price;
    const locationLabel = getDropLocationLabel({
      isAuthenticated: !!user,
      salePointId: arrivage.sale_point_id,
      salePoints: validSalePoints,
      port: arrivage.ports,
    });
    // Récupérer le label du point de vente
    const salePoint = validSalePoints.find(sp => sp.id === arrivage.sale_point_id);
    const salePointLabel = salePoint?.label || null;

    // Récupérer les espèces depuis drop_species ET offers
    const speciesFromDropSpecies = arrivage.drop_species?.map(ds => ds.species?.name).filter(Boolean) || [];
    const speciesFromOffers = arrivage.offers?.map(o => o.species?.name).filter(Boolean) || [];
    // Combiner et dédupliquer les espèces
    const allSpecies = [...new Set([...speciesFromDropSpecies, ...speciesFromOffers])];
    const speciesName = allSpecies.length > 0 ? allSpecies.join(', ') : 'Poisson frais';

    return {
      id: arrivage.id,
      salePointLabel, // Titre principal de la carte
      species: speciesName,
      scientificName: arrivage.drop_species?.[0]?.species?.scientific_name || 
                      arrivage.offers?.[0]?.species?.scientific_name || '',
      port: locationLabel,
      eta: new Date(arrivage.eta_at),
      saleStartTime: arrivage.sale_start_time ? new Date(arrivage.sale_start_time) : undefined,
      pricePerPiece: hasOffers ? arrivage.offers[0].unit_price : undefined,
      quantity: arrivage.offers[0]?.available_units || 0,
      isPremium: arrivage.is_premium,
      dropPhotos: arrivage.drop_photos,
      salePointId: arrivage.sale_point_id,
      mainFishingZone: arrivage.fishermen?.main_fishing_zone || null,
      fisherman: {
        id: arrivage.fishermen?.id,
        slug: arrivage.fishermen?.slug,
        name: arrivage.fishermen?.boat_name || 'Pêcheur',
        boat: arrivage.fishermen?.boat_name || '',
        isAmbassador: arrivage.fishermen?.is_ambassador || false,
      },
    };
  }) || [];

  // Transform arrivages for map markers
  const mapDrops = arrivages?.filter(arrivage => {
    const lat = arrivage.latitude || arrivage.ports?.latitude;
    const lng = arrivage.longitude || arrivage.ports?.longitude;
    return lat && lng && arrivage.offers && arrivage.offers.length > 0;
  }).map(arrivage => {
    const firstPhoto = arrivage.drop_photos?.sort((a, b) => a.display_order - b.display_order)?.[0]?.photo_url;
    
    // Récupérer toutes les espèces (drop_species + offers)
    const speciesFromDropSpecies = arrivage.drop_species?.map(ds => ds.species?.name).filter(Boolean) || [];
    const speciesFromOffers = arrivage.offers?.map(o => o.species?.name).filter(Boolean) || [];
    const allSpecies = [...new Set([...speciesFromDropSpecies, ...speciesFromOffers])];
    const speciesName = allSpecies.length > 0 ? allSpecies.join(', ') : 'Poisson frais';
    
    return {
      id: arrivage.id,
      latitude: arrivage.latitude || arrivage.ports?.latitude || 0,
      longitude: arrivage.longitude || arrivage.ports?.longitude || 0,
      species: speciesName,
      price: arrivage.offers[0]?.unit_price || 0,
      saleTime: arrivage.sale_start_time
        ? new Date(arrivage.sale_start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : 'À confirmer',
      fishermanName: arrivage.fishermen?.boat_name || 'Pêcheur',
      availableUnits: arrivage.offers[0]?.available_units || 0,
      salePointId: arrivage.sale_point_id,
      photoUrl: firstPhoto,
    };
  }) || [];

  // Handlers for map marker clicks
  const handleDropClick = (dropId: string | null) => {
    if (!user) {
      // Anonymous users: show signup dialog
      setShowSignupDialog(true);
      return;
    }
    if (dropId) {
      setSelectedDropId(dropId);
      setSelectedSalePointId(null);
      setSelectedType('drop');
      setSelectionOpen(true);
    }
  };

  const handleSalePointClick = (salePointId: string | null) => {
    if (!user) {
      // Anonymous users: show signup dialog
      setShowSignupDialog(true);
      return;
    }
    if (salePointId) {
      setSelectedSalePointId(salePointId);
      setSelectedDropId(null);
      setSelectedType('salePoint');
      setSelectionOpen(true);
    }
  };

  const handleClosePanel = () => {
    setSelectionOpen(false);
    setSelectedType(null);
    setSelectedDropId(null);
    setSelectedSalePointId(null);
  };

  // Get selected items for panel
  const selectedDrop = selectedDropId ? mapDrops.find(d => d.id === selectedDropId) : null;
  
  // Transform sale point to match panel interface (fishermen -> fisherman)
  const rawSalePoint = selectedSalePointId ? validSalePoints.find(sp => sp.id === selectedSalePointId) : null;
  const selectedSalePoint = rawSalePoint ? {
    id: rawSalePoint.id,
    label: rawSalePoint.label,
    address: rawSalePoint.address,
    description: rawSalePoint.description,
    photo_url: rawSalePoint.photo_url,
    fisherman_id: rawSalePoint.fisherman_id,
    fisherman: rawSalePoint.fisherman ? {
      id: rawSalePoint.fisherman.id,
      boat_name: rawSalePoint.fisherman.boat_name,
      photo_url: rawSalePoint.fisherman.photo_url,
      slug: rawSalePoint.fisherman.slug,
      bio: rawSalePoint.fisherman.bio,
      fishing_methods: rawSalePoint.fisherman.fishing_methods,
    } : undefined,
  } : null;
  
  // Find related drop for a sale point (if any active drop is at this sale point)
  const relatedDrop = selectedSalePointId 
    ? mapDrops.find(d => d.salePointId === selectedSalePointId) 
    : null;

  const filteredArrivages = transformedArrivages.filter(arrivage => {
    // Filtre "Ma zone" pour les pêcheurs (prioritaire)
    if (isFisherman && showMyZoneOnly && fishermanZone) {
      if (arrivage.mainFishingZone !== fishermanZone) {
        return false;
      }
    }
    
    const matchesSearch = !searchQuery || 
      arrivage.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      arrivage.port.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  // Filter map drops by zone for fishermen
  const filteredMapDrops = mapDrops.filter(drop => {
    if (isFisherman && showMyZoneOnly && fishermanZone) {
      const arrivage = arrivages?.find(a => a.id === drop.id);
      if (arrivage?.fishermen?.main_fishing_zone !== fishermanZone) {
        return false;
      }
    }
    return true;
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
            {user 
              ? `${filteredArrivages.length} arrivages disponibles`
              : `${validSalePoints.length} points de vente à découvrir`
            }
          </p>
          {!user && (
            <p className="text-sm text-primary mt-2">
              Inscrivez-vous pour voir les arrivages et accéder aux détails
            </p>
          )}
        </div>

        {/* Toggle Ma zone / Partout pour les pêcheurs */}
        {user && isFisherman && fishermanZone && (
          <Card className="border-primary/30 bg-primary/5 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {showMyZoneOnly ? (
                    <MapPin className="h-5 w-5 text-primary" />
                  ) : (
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {showMyZoneOnly ? 'Ma zone' : 'Toutes les zones'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {showMyZoneOnly 
                        ? `Arrivages en ${fishermanZone}`
                        : 'Voir tous les arrivages de France'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Partout</span>
                  <Switch 
                    checked={showMyZoneOnly}
                    onCheckedChange={setShowMyZoneOnly}
                  />
                  <span className="text-sm text-muted-foreground">Ma zone</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Geolocation Error Alert */}
        {geoStatus === 'denied' && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Géolocalisation refusée</AlertTitle>
            <AlertDescription>
              Vous avez refusé l'accès à votre position. Pour activer la géolocalisation :
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Chrome/Edge : Cliquez sur l'icône cadenas dans la barre d'adresse</li>
                <li>Firefox : Cliquez sur l'icône info et modifiez les permissions</li>
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
          <div className="aspect-[4/3] sm:aspect-video md:aspect-[21/9] min-h-[280px] sm:min-h-[320px] rounded-lg overflow-hidden border border-border shadow-lg">
            <GoogleMapComponent 
              ports={ports || []}
              salePoints={validSalePoints}
              drops={filteredMapDrops}
              selectedPortId={null}
              selectedDropId={selectedDropId}
              selectedSalePointId={selectedSalePointId}
              onPortClick={() => {}}
              onDropClick={handleDropClick}
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

        {/* Search bar - only for authenticated users */}
        {user && (
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
        )}

        {/* Arrivages grid - ONLY for authenticated users */}
        {user && (
          <>
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
              </div>
            )}
          </>
        )}

        {/* CTA for anonymous users */}
        {!user && (
          <div className="text-center py-12 space-y-6">
            <div className="max-w-md mx-auto">
              <UserPlus className="h-16 w-16 mx-auto text-primary mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Accédez aux arrivages
              </h2>
              <p className="text-muted-foreground mb-6">
                Créez un compte gratuit pour voir les arrivages de poisson frais, 
                connaître les horaires de vente et être alerté des nouveautés.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/auth')} size="lg">
                  Créer un compte gratuit
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
                  Se connecter
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Selection Panel - only for authenticated users */}
      {user && (
        <MapSelectionPanel
          isOpen={selectionOpen}
          onClose={handleClosePanel}
          selectedType={selectedType}
          selectedDrop={selectedDrop}
          selectedSalePoint={selectedSalePoint}
          relatedDrop={relatedDrop}
        />
      )}

      {/* Signup Dialog for anonymous users */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Inscription requise
            </DialogTitle>
            <DialogDescription>
              Pour voir les détails des points de vente et accéder aux arrivages, 
              créez un compte gratuit ou connectez-vous.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Fish className="h-4 w-4 text-primary" />
                Voir les arrivages en temps réel
              </li>
              <li className="flex items-center gap-2">
                <Fish className="h-4 w-4 text-primary" />
                Connaître les horaires de vente
              </li>
              <li className="flex items-center gap-2">
                <Fish className="h-4 w-4 text-primary" />
                Recevoir des alertes personnalisées
              </li>
            </ul>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSignupDialog(false)}>
              Plus tard
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Créer un compte gratuit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Carte;
