import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { MapPin, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { googleMapsLoaderConfig, defaultMapConfig, quaiDirectMapStyles, isGoogleMapsConfigured } from '@/lib/google-maps';
import { Button } from '@/components/ui/button';

interface Port {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface SalePoint {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  fisherman_id: string;
  photo_url?: string;
  fisherman?: {
    id: string;
    boat_name: string;
    photo_url?: string;
    slug?: string;
  };
}

interface Drop {
  id: string;
  latitude: number;
  longitude: number;
  species: string;
  price: number;
  saleTime: string;
  fishermanName: string;
  availableUnits: number;
}

interface GoogleMapComponentProps {
  ports: Port[];
  salePoints?: SalePoint[];
  drops?: Drop[];
  selectedPortId: string | null;
  selectedSalePointId?: string | null;
  selectedDropId?: string | null;
  onPortClick: (portId: string | null) => void;
  onSalePointClick?: (salePointId: string | null) => void;
  onDropClick?: (dropId: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// Loading timeout in milliseconds
const LOADING_TIMEOUT_MS = 15000;

const GoogleMapComponent = ({
  ports,
  salePoints = [],
  drops = [],
  selectedPortId,
  selectedSalePointId,
  selectedDropId,
  onPortClick,
  onSalePointClick,
  onDropClick,
  userLocation,
}: GoogleMapComponentProps) => {
  const navigate = useNavigate();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use centralized loader config - do NOT override the id to prevent multiple loads
  const { isLoaded, loadError } = useJsApiLoader(googleMapsLoaderConfig);

  const mapOptions = useMemo(() => ({
    styles: quaiDirectMapStyles,
    mapTypeId: 'terrain' as google.maps.MapTypeId,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  }), []);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'port' | 'salePoint' | 'drop' | null>(null);
  const [hoverInfoWindow, setHoverInfoWindow] = useState<string | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // Loading timeout handler
  useEffect(() => {
    if (!isLoaded && !loadError && !hasTimedOut) {
      timeoutRef.current = setTimeout(() => {
        console.error('[Google Maps] Loading timeout exceeded after', LOADING_TIMEOUT_MS, 'ms');
        setHasTimedOut(true);
      }, LOADING_TIMEOUT_MS);
    }

    if (isLoaded || loadError) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setHasTimedOut(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoaded, loadError, hasTimedOut, loadAttempt]);

  // Log loading state for debugging
  useEffect(() => {
    if (loadError) {
      console.error('[Google Maps] Load error:', loadError.message);
    }
    if (isLoaded) {
      console.info('[Google Maps] Successfully loaded');
    }
  }, [isLoaded, loadError]);

  const handleRetry = useCallback(() => {
    console.info('[Google Maps] Retrying by re-mounting map...');
    setHasTimedOut(false);
    // Force re-mount of the GoogleMap component (does not reload the whole page)
    setLoadAttempt(prev => prev + 1);
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Force initial center on Hyères, France
    console.log('[GoogleMap] onLoad: Forcing initial center on Hyères');
    map.setCenter(defaultMapConfig.center);
    map.setZoom(defaultMapConfig.zoom);
  }, []);

  const onUnmount = useCallback(() => {
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    setMap(null);
  }, []);

  // Auto-center map with priority: userLocation > drops (arrivages) > salePoints > default (Hyères)
  useEffect(() => {
    if (!map) return;

    // Priorité 1: Position utilisateur
    if (userLocation) {
      console.log('[GoogleMap] Centering on user location:', userLocation);
      map.setCenter(userLocation);
      map.setZoom(12);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // Priorité 2: Centrer sur les drops actifs (ARRIVAGES EN PRIORITÉ)
    if (drops && drops.length > 0) {
      console.log('[GoogleMap] Found', drops.length, 'drops - centering on arrivals first');
      drops.forEach(drop => {
        if (drop.latitude && drop.longitude) {
          bounds.extend(new google.maps.LatLng(drop.latitude, drop.longitude));
          hasPoints = true;
        }
      });
    }

    // Priorité 3: Centrer sur les points de vente (si pas de drops)
    if (!hasPoints && salePoints && salePoints.length > 0) {
      console.log('[GoogleMap] No drops, found', salePoints.length, 'sale points');
      salePoints.forEach(sp => {
        if (sp.latitude && sp.longitude) {
          bounds.extend(new google.maps.LatLng(sp.latitude, sp.longitude));
          hasPoints = true;
        }
      });
    }

    if (hasPoints) {
      console.log('[GoogleMap] Fitting bounds to points');
      map.fitBounds(bounds);
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 14) {
          map.setZoom(12);
        }
        google.maps.event.removeListener(listener);
      });
    } else {
      // Priorité 4: Centre par défaut (Hyères, France)
      console.log('[GoogleMap] No points found, centering on Hyères (default)');
      map.setCenter(defaultMapConfig.center);
      map.setZoom(defaultMapConfig.zoom);
    }
  }, [map, drops, salePoints, userLocation]);

  // Handle selected port/sale point/drop
  useEffect(() => {
    if (!map) return;

    if (selectedPortId) {
      const selectedPort = ports.find(p => p.id === selectedPortId);
      if (selectedPort) {
        map.panTo({ lat: selectedPort.latitude, lng: selectedPort.longitude });
        map.setZoom(14);
        setActiveInfoWindow(selectedPortId);
        setActiveType('port');
      }
    } else if (selectedSalePointId) {
      const selectedSalePoint = salePoints.find(sp => sp.id === selectedSalePointId);
      if (selectedSalePoint) {
        map.panTo({ lat: selectedSalePoint.latitude, lng: selectedSalePoint.longitude });
        map.setZoom(14);
        setActiveInfoWindow(selectedSalePointId);
        setActiveType('salePoint');
      }
    } else if (selectedDropId) {
      const selectedDrop = drops.find(d => d.id === selectedDropId);
      if (selectedDrop) {
        map.panTo({ lat: selectedDrop.latitude, lng: selectedDrop.longitude });
        map.setZoom(14);
        setActiveInfoWindow(selectedDropId);
        setActiveType('drop');
      }
    }
  }, [map, selectedPortId, selectedSalePointId, selectedDropId, ports, salePoints, drops]);

  // Create markers and clusterer
  useEffect(() => {
    if (!map || !isLoaded) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    const allMarkers: google.maps.Marker[] = [];

    // Sale point markers (orange) - Points de vente des pêcheurs
    const salePointMarkers = salePoints.map((salePoint) => {
      const marker = new google.maps.Marker({
        position: { lat: salePoint.latitude, lng: salePoint.longitude },
        map: map,
        title: salePoint.label,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="16" fill="${selectedSalePointId === salePoint.id ? '#ff6b35' : '#f97316'}" opacity="0.9" stroke="#FFFFFF" stroke-width="3"/>
              <text x="20" y="26" font-size="16" fill="#FFFFFF" text-anchor="middle" font-family="Arial">⚓</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
      });

      marker.addListener('click', () => {
        if (onSalePointClick) {
          onSalePointClick(salePoint.id);
        }
        setActiveInfoWindow(salePoint.id);
        setActiveType('salePoint');
        setHoverInfoWindow(null); // Close hover on click
      });

      // Hover listeners for preview
      marker.addListener('mouseover', () => {
        setHoverInfoWindow(salePoint.id);
      });
      marker.addListener('mouseout', () => {
        setHoverInfoWindow(null);
      });

      return marker;
    });

    // Drop markers (green with fish icon) - PLUS GRANDS ET PRIORITAIRES
    const isSelected = (dropId: string) => selectedDropId === dropId;
    const dropMarkers = drops.map((drop) => {
      const selected = isSelected(drop.id);
      // Marqueurs d'arrivages plus grands (48px vs 40px pour sale points)
      const markerSize = selected ? 56 : 48;
      const circleRadius = selected ? 24 : 20;
      const fontSize = selected ? 22 : 18;
      
      const marker = new google.maps.Marker({
        position: { lat: drop.latitude, lng: drop.longitude },
        map: map,
        title: `🐟 ${drop.species} - ${drop.fishermanName}`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="${markerSize}" height="${markerSize}" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              ${selected ? `<circle cx="${markerSize/2}" cy="${markerSize/2}" r="${circleRadius + 4}" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.5"/>` : ''}
              <circle cx="${markerSize/2}" cy="${markerSize/2}" r="${circleRadius}" fill="${selected ? '#059669' : '#22c55e'}" stroke="#FFFFFF" stroke-width="3" filter="url(#glow)"/>
              <text x="${markerSize/2}" y="${markerSize/2 + 6}" font-size="${fontSize}" fill="#FFFFFF" text-anchor="middle" font-family="Arial">🐟</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(markerSize, markerSize),
          anchor: new google.maps.Point(markerSize / 2, markerSize / 2),
        },
        // zIndex élevé pour que les drops apparaissent AU-DESSUS des sale points
        zIndex: selected ? 2000 : 1500,
      });

      marker.addListener('click', () => {
        if (onDropClick) {
          onDropClick(drop.id);
        }
        setActiveInfoWindow(drop.id);
        setActiveType('drop');
      });

      return marker;
    });

    allMarkers.push(...salePointMarkers, ...dropMarkers);
    markersRef.current = allMarkers;

    clustererRef.current = new MarkerClusterer({
      map,
      markers: allMarkers,
      renderer: {
        render: ({ count, position }) => {
          return new google.maps.Marker({
            position,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="25" cy="25" r="20" fill="#f97316" opacity="0.9" stroke="#FFFFFF" stroke-width="3"/>
                  <text x="25" y="30" font-size="14" font-weight="bold" fill="#FFFFFF" text-anchor="middle" font-family="Arial">${count}</text>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(50, 50),
            },
            zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
          });
        },
      },
    });

    return () => {
      allMarkers.forEach(marker => marker.setMap(null));
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
    };
  }, [map, salePoints, drops, selectedSalePointId, selectedDropId, onSalePointClick, onDropClick, isLoaded]);

  // Check if API key is configured
  if (!isGoogleMapsConfigured()) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-warning mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Carte non disponible
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-4">
          La clé API Google Maps n'est pas configurée. 
          Veuillez contacter l'administrateur.
        </p>
        <p className="text-xs text-muted-foreground/70">
          Code erreur: API_KEY_MISSING
        </p>
      </div>
    );
  }

  // Timeout error state
  if (hasTimedOut) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-warning mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Chargement trop long
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-4">
          La carte met trop de temps à charger. Cela peut être dû à :
        </p>
        <ul className="text-muted-foreground text-xs text-left mb-4 space-y-1">
          <li>• Restrictions de domaine sur la clé API</li>
          <li>• API Maps JavaScript non activée</li>
          <li>• Connexion internet instable</li>
        </ul>
        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
        <p className="text-xs text-muted-foreground/70 mt-4">
          Code erreur: LOADING_TIMEOUT
        </p>
      </div>
    );
  }

  if (loadError) {
    const errorMessage = loadError.message || 'Erreur inconnue';
    const isApiKeyError = errorMessage.includes('ApiNotActivatedMapError') || 
                          errorMessage.includes('InvalidKeyMapError') ||
                          errorMessage.includes('RefererNotAllowedMapError');
    
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted rounded-lg p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isApiKeyError ? 'Configuration API requise' : 'Erreur de chargement'}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-4">
          {isApiKeyError 
            ? 'La clé API Google Maps nécessite une configuration dans Google Cloud Console.'
            : 'Impossible de charger la carte. Veuillez réessayer.'}
        </p>
        {isApiKeyError && (
          <ul className="text-muted-foreground text-xs text-left mb-4 space-y-1">
            <li>• Vérifiez que "Maps JavaScript API" est activée</li>
            <li>• Ajoutez ce domaine aux restrictions HTTP</li>
            <li>• Vérifiez les quotas de l'API</li>
          </ul>
        )}
        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
        <p className="text-xs text-muted-foreground/70 mt-4">
          {errorMessage.slice(0, 100)}
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Chargement de la carte...</p>
          <p className="text-xs text-muted-foreground/60">
            Cela peut prendre quelques secondes
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      key={`google-map-${loadAttempt}`}
      mapContainerStyle={mapContainerStyle}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        ...mapOptions,
        center: defaultMapConfig.center,
        zoom: defaultMapConfig.zoom,
      }}
    >
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#EF4444',
            fillOpacity: 0.8,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8,
          }}
          title="Votre position"
          animation={google.maps.Animation.DROP}
        />
      )}

      {activeInfoWindow && activeType === 'port' && ports.find(p => p.id === activeInfoWindow) && (
        <InfoWindow
          position={{
            lat: ports.find(p => p.id === activeInfoWindow)!.latitude,
            lng: ports.find(p => p.id === activeInfoWindow)!.longitude,
          }}
          onCloseClick={() => {
            setActiveInfoWindow(null);
            setActiveType(null);
            onPortClick(null);
          }}
        >
          <div className="p-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{ports.find(p => p.id === activeInfoWindow)!.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{ports.find(p => p.id === activeInfoWindow)!.city}</p>
          </div>
        </InfoWindow>
      )}

      {/* Hover InfoWindow for SalePoints (preview with photo) */}
      {hoverInfoWindow && !activeInfoWindow && salePoints.find(sp => sp.id === hoverInfoWindow) && (() => {
        const sp = salePoints.find(s => s.id === hoverInfoWindow)!;
        return (
          <InfoWindow
            position={{ lat: sp.latitude, lng: sp.longitude }}
            options={{ disableAutoPan: true }}
          >
            <div className="p-2 min-w-[150px]">
              {sp.photo_url && (
                <img
                  src={sp.photo_url}
                  alt={sp.label}
                  className="w-full h-20 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-semibold text-sm">{sp.label}</h3>
            </div>
          </InfoWindow>
        );
      })()}

      {activeInfoWindow && activeType === 'salePoint' && salePoints.find(sp => sp.id === activeInfoWindow) && (() => {
        const sp = salePoints.find(s => s.id === activeInfoWindow)!;
        return (
          <InfoWindow
            position={{ lat: sp.latitude, lng: sp.longitude }}
            onCloseClick={() => {
              setActiveInfoWindow(null);
              setActiveType(null);
              if (onSalePointClick) onSalePointClick(null);
            }}
          >
            <div className="p-2">
              {sp.photo_url && (
                <img
                  src={sp.photo_url}
                  alt={sp.label}
                  className="w-full h-24 object-cover rounded mb-2"
                />
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚓</span>
                <h3 className="font-semibold">{sp.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{sp.address}</p>
            </div>
          </InfoWindow>
        );
      })()}

      {activeInfoWindow && activeType === 'drop' && drops.find(d => d.id === activeInfoWindow) && (
        <InfoWindow
          position={{
            lat: drops.find(d => d.id === activeInfoWindow)!.latitude,
            lng: drops.find(d => d.id === activeInfoWindow)!.longitude,
          }}
          onCloseClick={() => {
            setActiveInfoWindow(null);
            setActiveType(null);
            if (onDropClick) onDropClick(null);
          }}
        >
          <div className="p-3 min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🐟</span>
              <div>
                <h3 className="font-bold text-base">{drops.find(d => d.id === activeInfoWindow)!.species}</h3>
                <p className="text-xs text-muted-foreground">{drops.find(d => d.id === activeInfoWindow)!.fishermanName}</p>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              <p className="text-sm"><strong>Prix:</strong> {drops.find(d => d.id === activeInfoWindow)!.price.toFixed(2)}€</p>
              <p className="text-sm"><strong>Horaire:</strong> {drops.find(d => d.id === activeInfoWindow)!.saleTime}</p>
              <p className="text-sm"><strong>Dispo:</strong> {drops.find(d => d.id === activeInfoWindow)!.availableUnits} unités</p>
            </div>
            <Button
              onClick={() => {
                const dropId = drops.find(d => d.id === activeInfoWindow)!.id;
                navigate(`/drop/${dropId}`);
              }}
              className="w-full"
            >
              Voir détails
            </Button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
