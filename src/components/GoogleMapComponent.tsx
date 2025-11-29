import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { MapPin } from 'lucide-react';
import { getGoogleMapsApiKey, defaultMapConfig, quaiDirectMapStyles } from '@/lib/google-maps';

interface Port {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface GoogleMapComponentProps {
  ports: Port[];
  selectedPortId: string | null;
  onPortClick: (portId: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const GoogleMapComponent = ({ 
  ports, 
  selectedPortId, 
  onPortClick,
  userLocation 
}: GoogleMapComponentProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: getGoogleMapsApiKey(),
  });

  // Mémoïser les options de la carte pour éviter les re-renders
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
  const markersRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    // Nettoyer le clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    setMap(null);
  }, []);

  // Centrage automatique sur la position de l'utilisateur (PRIORITAIRE)
  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // PRIORITÉ 1 : Position utilisateur
    if (userLocation) {
      bounds.extend(new google.maps.LatLng(userLocation.lat, userLocation.lng));
      hasPoints = true;
      
      // Zoom serré sur l'utilisateur si on a sa position
      map.setCenter(userLocation);
      map.setZoom(12);
      return; // On s'arrête ici pour prioriser la géolocalisation
    }

    // PRIORITÉ 2 : Ports (seulement si pas de position utilisateur)
    if (ports && ports.length > 0) {
      ports.forEach(port => {
        bounds.extend(new google.maps.LatLng(port.latitude, port.longitude));
      });
      hasPoints = true;
    }

    if (hasPoints) {
      map.fitBounds(bounds);
      
      // Ajuster le zoom si trop proche
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) {
          map.setZoom(12);
        }
        google.maps.event.removeListener(listener);
      });
    } else {
      // PRIORITÉ 3 : Centre par défaut (Hyères)
      map.setCenter(defaultMapConfig.center);
      map.setZoom(defaultMapConfig.zoom);
    }
  }, [map, ports, userLocation]);

  // Gestion du port sélectionné
  useEffect(() => {
    if (!map || !selectedPortId) return;

    const selectedPort = ports.find(p => p.id === selectedPortId);
    if (selectedPort) {
      map.panTo({ lat: selectedPort.latitude, lng: selectedPort.longitude });
      map.setZoom(14);
      setActiveInfoWindow(selectedPortId);
    }
  }, [map, selectedPortId, ports]);

  // Créer les marqueurs et le clusterer pour les ports
  useEffect(() => {
    if (!map || !ports || ports.length === 0) return;

    // Nettoyer les anciens marqueurs
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    // Créer les nouveaux marqueurs
    const newMarkers = ports.map((port) => {
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
      });

      return marker;
    });

    markersRef.current = newMarkers;

    // Créer le clusterer avec les nouveaux marqueurs
    clustererRef.current = new MarkerClusterer({
      map,
      markers: newMarkers,
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
            label: undefined,
            zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
          });
        },
      },
    });

    return () => {
      newMarkers.forEach(marker => marker.setMap(null));
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
    };
  }, [map, ports, selectedPortId, onPortClick]);

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
        <p className="text-muted-foreground">Chargement de la carte...</p>
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
      {/* Marqueur position utilisateur */}
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

      {/* InfoWindows pour les ports (affichées séparément du clustering) */}
      {activeInfoWindow && ports.find(p => p.id === activeInfoWindow) && (
        <InfoWindow
          position={{
            lat: ports.find(p => p.id === activeInfoWindow)!.latitude,
            lng: ports.find(p => p.id === activeInfoWindow)!.longitude,
          }}
          onCloseClick={() => {
            setActiveInfoWindow(null);
            onPortClick(null);
          }}
        >
          <div className="p-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">
                {ports.find(p => p.id === activeInfoWindow)!.name}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {ports.find(p => p.id === activeInfoWindow)!.city}
            </p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
