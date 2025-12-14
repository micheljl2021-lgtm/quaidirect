import { useState, useCallback, useRef } from 'react';
import { Plus, Trash2, MapPin, Loader2, CheckCircle, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { MapPickerDialog } from './MapPickerDialog';

const libraries: ("places")[] = ["places"];

interface Step6PointsVenteProps {
  formData: {
    salePoint1Label?: string;
    salePoint1Address?: string;
    salePoint1Description?: string;
    salePoint1Lat?: number;
    salePoint1Lng?: number;
    salePoint2Label?: string;
    salePoint2Address?: string;
    salePoint2Description?: string;
    salePoint2Lat?: number;
    salePoint2Lng?: number;
  };
  onChange: (field: string, value: any) => void;
}

export const Step6PointsVente = ({ formData, onChange }: Step6PointsVenteProps) => {
  const [showSecondPoint, setShowSecondPoint] = useState(!!formData.salePoint2Label);
  const [mapPickerPoint, setMapPickerPoint] = useState<1 | 2 | null>(null);
  const autocomplete1Ref = useRef<google.maps.places.Autocomplete | null>(null);
  const autocomplete2Ref = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const handlePlaceChanged1 = useCallback(() => {
    if (autocomplete1Ref.current) {
      const place = autocomplete1Ref.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || place.name || '';
        
        onChange('salePoint1Address', formattedAddress);
        onChange('salePoint1Lat', lat);
        onChange('salePoint1Lng', lng);
      }
    }
  }, [onChange]);

  const handlePlaceChanged2 = useCallback(() => {
    if (autocomplete2Ref.current) {
      const place = autocomplete2Ref.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || place.name || '';
        
        onChange('salePoint2Address', formattedAddress);
        onChange('salePoint2Lat', lat);
        onChange('salePoint2Lng', lng);
      }
    }
  }, [onChange]);

  const onLoad1 = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocomplete1Ref.current = autocomplete;
  }, []);

  const onLoad2 = useCallback((autocomplete: google.maps.places.Autocomplete) => {
    autocomplete2Ref.current = autocomplete;
  }, []);

  const autocompleteOptions = {
    componentRestrictions: { country: 'fr' },
    types: ['address', 'establishment'],
  };

  const handleMapSelect = (pointNumber: 1 | 2, lat: number, lng: number, address: string) => {
    if (pointNumber === 1) {
      onChange('salePoint1Lat', lat);
      onChange('salePoint1Lng', lng);
      onChange('salePoint1Address', address);
    } else {
      onChange('salePoint2Lat', lat);
      onChange('salePoint2Lng', lng);
      onChange('salePoint2Address', address);
    }
  };

  const renderAddressInput = (
    id: string,
    value: string,
    lat: number | undefined,
    lng: number | undefined,
    onLoadFn: (autocomplete: google.maps.places.Autocomplete) => void,
    onPlaceChangedFn: () => void,
    onChangeFn: (value: string) => void,
    pointNumber: 1 | 2
  ) => {
    return (
      <div className="space-y-3">
        {/* Map picker button - Primary action */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setMapPickerPoint(pointNumber)}
          className="w-full justify-start gap-2 h-12 border-primary/50 hover:border-primary hover:bg-primary/5"
        >
          <Map className="h-5 w-5 text-primary" />
          <span className="font-medium">Choisir sur la carte</span>
          {lat && lng && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
        </Button>

        {/* Autocomplete as secondary option */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            ou
          </span>
          {loadError ? (
            <Input
              id={id}
              placeholder="Tapez une adresse..."
              value={value}
              onChange={(e) => onChangeFn(e.target.value)}
              className="pl-10"
            />
          ) : !isLoaded ? (
            <div className="flex items-center gap-2 text-muted-foreground h-10 pl-10">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : (
            <Autocomplete
              onLoad={onLoadFn}
              onPlaceChanged={onPlaceChangedFn}
              options={autocompleteOptions}
            >
              <Input
                id={id}
                placeholder="Tapez une adresse pour la rechercher..."
                value={value}
                onChange={(e) => onChangeFn(e.target.value)}
                className="pl-10"
              />
            </Autocomplete>
          )}
        </div>

        {/* GPS coordinates indicator */}
        {lat && lng && (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded-md">
            <CheckCircle className="h-3 w-3" />
            <span>Coordonnées GPS enregistrées ({lat.toFixed(4)}, {lng.toFixed(4)})</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Mes points de vente</h2>
        <p className="text-muted-foreground">
          Où vends-tu habituellement ton poisson ? (1 à 2 points maximum)
        </p>
      </div>

      {/* Map Picker Dialog */}
      <MapPickerDialog
        open={mapPickerPoint !== null}
        onOpenChange={(open) => !open && setMapPickerPoint(null)}
        onSelect={(lat, lng, address) => {
          if (mapPickerPoint) {
            handleMapSelect(mapPickerPoint, lat, lng, address);
          }
        }}
        initialLat={mapPickerPoint === 1 ? formData.salePoint1Lat : formData.salePoint2Lat}
        initialLng={mapPickerPoint === 1 ? formData.salePoint1Lng : formData.salePoint2Lng}
      />

      {/* Point de vente 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" aria-hidden="true" />
            Point de vente 1
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salePoint1Label">Nom du point de vente *</Label>
            <Input
              id="salePoint1Label"
              placeholder="Ex: Marché du port, Quai de la criée..."
              value={formData.salePoint1Label || ''}
              onChange={(e) => onChange('salePoint1Label', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salePoint1Address">Adresse ou lieu *</Label>
            {renderAddressInput(
              'salePoint1Address',
              formData.salePoint1Address || '',
              formData.salePoint1Lat,
              formData.salePoint1Lng,
              onLoad1,
              handlePlaceChanged1,
              (val) => onChange('salePoint1Address', val),
              1
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salePoint1Description">Description courte</Label>
            <Textarea
              id="salePoint1Description"
              placeholder="Ex: Sur le quai, à côté de la glacière bleue..."
              value={formData.salePoint1Description || ''}
              onChange={(e) => onChange('salePoint1Description', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Point de vente 2 */}
      {showSecondPoint ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" aria-hidden="true" />
                Point de vente 2
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSecondPoint(false);
                  onChange('salePoint2Label', '');
                  onChange('salePoint2Address', '');
                  onChange('salePoint2Description', '');
                  onChange('salePoint2Lat', undefined);
                  onChange('salePoint2Lng', undefined);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salePoint2Label">Nom du point de vente</Label>
              <Input
                id="salePoint2Label"
                placeholder="Ex: Parking du port..."
                value={formData.salePoint2Label || ''}
                onChange={(e) => onChange('salePoint2Label', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePoint2Address">Adresse ou lieu</Label>
              {renderAddressInput(
                'salePoint2Address',
                formData.salePoint2Address || '',
                formData.salePoint2Lat,
                formData.salePoint2Lng,
                onLoad2,
                handlePlaceChanged2,
                (val) => onChange('salePoint2Address', val),
                2
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePoint2Description">Description courte</Label>
              <Textarea
                id="salePoint2Description"
                placeholder="Ex: Devant la poissonnerie..."
                value={formData.salePoint2Description || ''}
                onChange={(e) => onChange('salePoint2Description', e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowSecondPoint(true)}
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Ajouter un deuxième point de vente
        </Button>
      )}
    </div>
  );
};