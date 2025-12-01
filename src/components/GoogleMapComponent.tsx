import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { MapPin } from 'lucide-react';
import { googleMapsLoaderConfig, defaultMapConfig, quaiDirectMapStyles } from '@/lib/google-maps';

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
  const { isLoaded, loadError } = useJsApiLoader(googleMapsLoaderConfig);

  const mapOptions = useMemo(() => ({
    styles: quaiDirectMapStyles,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
  }), []);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'port' | 'salePoint' | 'drop' | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    setMap(null);
  }, []);

  // Auto-center on user location (PRIORITY)
  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (userLocation) {
      bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
      hasPoints = true;
      map.setCenter(userLocation);
      map.setZoom(12);
      return;
    }

    if (ports && ports.length > 0) {
      ports.forEach(port => {
        bounds.extend(new google.maps.LatLng(port.latitude, port.longitude));
      });
      hasPoints = true;
    }

    if (hasPoints) {
      map.fitBounds(bounds);
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) {
          map.setZoom(12);
        }
        google.maps.event.removeListener(listener);
      });
    } else {
      map.setCenter(defaultMapConfig.center);
      map.setZoom(defaultMapConfig.zoom);
    }
  }, [map, ports, userLocation]);

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

    // Port markers (blue circles)
    const portMarkers = ports.map((port) => {
      const marker = new google.maps.Marker({
        position: { lat: port.latitude, lng: port.longitude },
        map: map,
        title: port.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: selectedPortId === port.id ? '#0EA5E9' : '#06B6D4',
          fillOpacity: selectedPortId === port.id ? 1 : 0.7,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: selectedPortId === port.id ? 10 : 8,
        },
      });

      marker.addListener('click', () => {
        onPortClick(port.id);
        setActiveInfoWindow(port.id);
        setActiveType('port');
      });

      return marker;
    });

    // Sale point markers (orange)
    const salePointMarkers = salePoints.map((salePoint) => {
      const marker = new google.maps.Marker({
        position: { lat: salePoint.latitude, lng: salePoint.longitude },
        map: map,
        title: salePoint.label,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: selectedSalePointId === salePoint.id ? '#ff6b35' : '#f97316',
          fillOpacity: 0.9,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: selectedSalePointId === salePoint.id ? 12 : 10,
        },
      });

      marker.addListener('click', () => {
        if (onSalePointClick) {
          onSalePointClick(salePoint.id);
        }
        setActiveInfoWindow(salePoint.id);
        setActiveType('salePoint');
      });

      return marker;
    });

    // Drop markers (green with fish icon)
    const dropMarkers = drops.map((drop) => {
      const marker = new google.maps.Marker({
        position: { lat: drop.latitude, lng: drop.longitude },
        map: map,
        title: `${drop.species} - ${drop.fishermanName}`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="16" fill="${selectedDropId === drop.id ? '#10b981' : '#22c55e'}" opacity="${selectedDropId === drop.id ? '1' : '0.9'}" stroke="#FFFFFF" stroke-width="3"/>
              <text x="20" y="26" font-size="16" fill="#FFFFFF" text-anchor="middle" font-family="Arial">🐟</text>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(20, 20),
        },
        zIndex: 1000,
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

    allMarkers.push(...portMarkers, ...salePointMarkers, ...dropMarkers);
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
                  <circle cx="25" cy="25" r="20" fill="#0EA5E9" opacity="0.9" stroke="#FFFFFF" stroke-width="3"/>
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
  }, [map, ports, salePoints, drops, selectedPortId, selectedSalePointId, selectedDropId, onPortClick, onSalePointClick, onDropClick, isLoaded]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p className="text-destructive">Erreur de chargement de la carte</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-muted rounded-lg">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultMapConfig.center}
      zoom={defaultMapConfig.zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
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

      {activeInfoWindow && activeType === 'salePoint' && salePoints.find(sp => sp.id === activeInfoWindow) && (
        <InfoWindow
          position={{
            lat: salePoints.find(sp => sp.id === activeInfoWindow)!.latitude,
            lng: salePoints.find(sp => sp.id === activeInfoWindow)!.longitude,
          }}
          onCloseClick={() => {
            setActiveInfoWindow(null);
            setActiveType(null);
            if (onSalePointClick) onSalePointClick(null);
          }}
        >
          <div className="p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🐟</span>
              <h3 className="font-semibold">{salePoints.find(sp => sp.id === activeInfoWindow)!.label}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{salePoints.find(sp => sp.id === activeInfoWindow)!.address}</p>
          </div>
        </InfoWindow>
      )}

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
            <button
              onClick={() => window.location.href = `/arrivage/${drops.find(d => d.id === activeInfoWindow)!.id}`}
              className="w-full bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Voir détails
            </button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;