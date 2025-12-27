import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { defaultMapConfig } from '@/lib/google-maps';
import { Loader2, MapPin } from 'lucide-react';
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader';

interface MapPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

export function MapPickerDialog({ 
  open, 
  onOpenChange, 
  onSelect, 
  initialLat, 
  initialLng 
}: MapPickerDialogProps) {
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );
  const [address, setAddress] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const { isLoaded, apiKey, apiKeyLoading, loadError } = useGoogleMapsLoader();

  const handleMapLoad = useCallback(() => {
    if (!geocoderRef.current && window.google) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, []);

  const handleMapClick = useCallback(async (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelectedPosition({ lat, lng });

    // Reverse geocoding
    if (geocoderRef.current) {
      setIsGeocoding(true);
      try {
        const response = await geocoderRef.current.geocode({ location: { lat, lng } });
        if (response.results && response.results[0]) {
          setAddress(response.results[0].formatted_address);
        } else {
          setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      } finally {
        setIsGeocoding(false);
      }
    }
  }, []);

  const handleConfirm = () => {
    if (selectedPosition) {
      onSelect(selectedPosition.lat, selectedPosition.lng, address);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setSelectedPosition(null);
    setAddress('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Sélectionner un emplacement sur la carte
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cliquez sur la carte pour définir l'emplacement de votre point de vente
          </p>

          {apiKeyLoading ? (
            <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !apiKey || loadError ? (
            <div className="h-[400px] bg-muted/60 border border-dashed border-warning/60 rounded-lg flex items-center justify-center text-center p-6">
              <div className="space-y-2">
                <p className="font-semibold text-foreground">Carte indisponible</p>
                <p className="text-sm text-muted-foreground">
                  Impossible de charger Google Maps. Vérifiez la clé API (restriction de domaine, activation Maps JavaScript).
                </p>
                {loadError && (
                  <p className="text-xs text-muted-foreground/80">
                    {loadError.message}
                  </p>
                )}
              </div>
            </div>
          ) : !isLoaded ? (
            <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={selectedPosition || defaultMapConfig.center}
                zoom={selectedPosition ? 15 : defaultMapConfig.zoom}
                onClick={handleMapClick}
                onLoad={handleMapLoad}
                options={{
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: false,
                }}
              >
                {selectedPosition && (
                  <Marker 
                    position={selectedPosition}
                    animation={google.maps.Animation.DROP}
                  />
                )}
              </GoogleMap>
            </div>
          )}

          {selectedPosition && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Position sélectionnée :</p>
              {isGeocoding ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recherche de l'adresse...
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{address || 'Adresse non trouvée'}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                GPS: {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedPosition || isGeocoding}
          >
            Confirmer cet emplacement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
