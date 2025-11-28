import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { MapPin } from 'lucide-react';

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

const defaultCenter = {
  lat: 43.1177,
  lng: 6.1298, // Hyères
};

// Style personnalisé aux couleurs QuaiDirect
const mapStyles = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#a0d2eb' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#074e7c' }]
  }
];

const GoogleMapComponent = ({ 
  ports, 
  selectedPortId, 
  onPortClick,
  userLocation 
}: GoogleMapComponentProps) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
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
      map.setCenter(defaultCenter);
      map.setZoom(10);
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
      center={defaultCenter}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: mapStyles,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      }}
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

      {/* Marqueurs des ports */}
      {ports.map((port) => (
        <Marker
          key={port.id}
          position={{ lat: port.latitude, lng: port.longitude }}
          onClick={() => {
            onPortClick(port.id);
            setActiveInfoWindow(port.id);
          }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: selectedPortId === port.id ? '#0EA5E9' : '#06B6D4',
            fillOpacity: selectedPortId === port.id ? 1 : 0.7,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: selectedPortId === port.id ? 10 : 8,
          }}
          title={port.name}
        >
          {activeInfoWindow === port.id && (
            <InfoWindow
              onCloseClick={() => {
                setActiveInfoWindow(null);
                onPortClick(null);
              }}
            >
              <div className="p-2">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{port.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{port.city}</p>
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
