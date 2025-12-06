import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, MapPin, Plus, Trash2, ArrowLeft, Camera, Map, X } from 'lucide-react';
import Header from '@/components/Header';
import { geocodeAddress } from '@/lib/google-geocode';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { googleMapsLoaderConfig, defaultMapConfig } from '@/lib/google-maps';
import { getUserFriendlyError } from '@/lib/errorMessages';
import { PhotoUpload } from '@/components/PhotoUpload';

interface SalePoint {
  id?: string;
  label: string;
  address: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
  photo_url: string | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '200px',
};

const overlayMapStyle = {
  width: '100%',
  height: '100%',
};

export default function EditSalePoints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [salePoints, setSalePoints] = useState<SalePoint[]>([]);
  const [geocoding, setGeocoding] = useState<{ [key: number]: boolean }>({});
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const { isLoaded } = useJsApiLoader(googleMapsLoaderConfig);

  useEffect(() => {
    if (user) {
      loadSalePoints();
    }
  }, [user]);

  // Initialiser le geocoder quand Google Maps est chargé
  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  const loadSalePoints = async () => {
    try {
      setLoading(true);

      const { data: fisherman, error: fishermanError } = await supabase
        .from('fishermen')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (fishermanError) throw fishermanError;
      setFishermanId(fisherman.id);

      const { data: points, error: pointsError } = await supabase
        .from('fisherman_sale_points')
        .select('*')
        .eq('fisherman_id', fisherman.id)
        .order('is_primary', { ascending: false });

      if (pointsError) throw pointsError;

      if (points && points.length > 0) {
        setSalePoints(points.map(p => ({
          id: p.id,
          label: p.label,
          address: p.address,
          description: p.description || '',
          latitude: p.latitude,
          longitude: p.longitude,
          is_primary: p.is_primary || false,
          photo_url: p.photo_url || null,
        })));
      } else {
        setSalePoints([{
          label: '',
          address: '',
          description: '',
          latitude: null,
          longitude: null,
          is_primary: true,
          photo_url: null,
        }]);
      }
    } catch (error: any) {
      console.error('Error loading sale points:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoint = () => {
    if (salePoints.length >= 2) {
      toast.error('Maximum 2 points de vente autorisés');
      return;
    }
    setSalePoints([...salePoints, {
      label: '',
      address: '',
      description: '',
      latitude: null,
      longitude: null,
      is_primary: false,
      photo_url: null,
    }]);
  };

  const handleRemovePoint = (index: number) => {
    if (salePoints.length === 1) {
      toast.error('Vous devez avoir au moins 1 point de vente');
      return;
    }
    setSalePoints(salePoints.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof SalePoint, value: any) => {
    const newPoints = [...salePoints];
    newPoints[index] = { ...newPoints[index], [field]: value };
    setSalePoints(newPoints);
  };

  const handleGeocode = async (index: number) => {
    const point = salePoints[index];
    if (!point.address) {
      toast.error('Veuillez saisir une adresse');
      return;
    }

    setGeocoding({ ...geocoding, [index]: true });
    try {
      const result = await geocodeAddress(point.address);
      if (result) {
        setSalePoints(prevPoints => {
          const newPoints = [...prevPoints];
          newPoints[index] = {
            ...newPoints[index],
            latitude: result.lat,
            longitude: result.lng,
            address: result.formattedAddress
          };
          return newPoints;
        });
        toast.success('Adresse localisée avec succès');
      } else {
        toast.error('Impossible de localiser cette adresse');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Erreur lors de la localisation');
    } finally {
      setGeocoding({ ...geocoding, [index]: false });
    }
  };

  const handleSelectOnMap = (index: number) => {
    setSelectingIndex(index);
    // Si le point a déjà des coordonnées, on les utilise comme position initiale du marqueur
    const point = salePoints[index];
    if (point.latitude && point.longitude) {
      setTempMarker({ lat: point.latitude, lng: point.longitude });
    } else {
      setTempMarker(null);
    }
  };

  const handleMapClick = async (event: google.maps.MapMouseEvent) => {
    if (selectingIndex === null || !event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Mettre à jour le marqueur temporaire immédiatement
    setTempMarker({ lat, lng });

    // Reverse geocoding pour obtenir l'adresse
    if (geocoderRef.current) {
      try {
        const response = await geocoderRef.current.geocode({ location: { lat, lng } });
        if (response.results && response.results[0]) {
          const formattedAddress = response.results[0].formatted_address;
          
          // Mise à jour atomique du point de vente
          setSalePoints(prevPoints => {
            const newPoints = [...prevPoints];
            newPoints[selectingIndex] = {
              ...newPoints[selectingIndex],
              latitude: lat,
              longitude: lng,
              address: formattedAddress
            };
            return newPoints;
          });

          toast.success('Position sélectionnée avec succès');
          setSelectingIndex(null);
          setTempMarker(null);
        } else {
          // Pas d'adresse trouvée, on garde quand même les coordonnées
          setSalePoints(prevPoints => {
            const newPoints = [...prevPoints];
            newPoints[selectingIndex] = {
              ...newPoints[selectingIndex],
              latitude: lat,
              longitude: lng
            };
            return newPoints;
          });
          toast.info('Position enregistrée (adresse non trouvée)');
          setSelectingIndex(null);
          setTempMarker(null);
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        // En cas d'erreur, on garde quand même les coordonnées
        setSalePoints(prevPoints => {
          const newPoints = [...prevPoints];
          newPoints[selectingIndex] = {
            ...newPoints[selectingIndex],
            latitude: lat,
            longitude: lng
          };
          return newPoints;
        });
        toast.info('Position enregistrée (erreur de géocodage)');
        setSelectingIndex(null);
        setTempMarker(null);
      }
    }
  };

  const handleCancelSelection = () => {
    setSelectingIndex(null);
    setTempMarker(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fishermanId) return;

    const invalidPoints = salePoints.filter(p => !p.label || !p.address);
    if (invalidPoints.length > 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const notGeocodedPoints = salePoints.filter(p => !p.latitude || !p.longitude);
    if (notGeocodedPoints.length > 0) {
      toast.error('Veuillez localiser toutes les adresses en utilisant "Sélectionner sur la carte"');
      return;
    }

    setSaving(true);
    try {
      const existingIds = salePoints.filter(p => p.id).map(p => p.id);
      const currentPointIds = salePoints.map(p => p.id).filter(Boolean);

      if (existingIds.length > 0) {
        const idsToDelete = existingIds.filter(id => !currentPointIds.includes(id));
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('fisherman_sale_points')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) {
            console.error('Delete error:', deleteError);
            throw deleteError;
          }
        }
      }

      for (let index = 0; index < salePoints.length; index++) {
        const point = salePoints[index];
        const pointData = {
          fisherman_id: fishermanId,
          label: point.label,
          address: point.address,
          description: point.description || null,
          latitude: point.latitude,
          longitude: point.longitude,
          is_primary: index === 0,
          photo_url: point.photo_url || null,
        };

        if (point.id) {
          const { error: updateError } = await supabase
            .from('fisherman_sale_points')
            .update(pointData)
            .eq('id', point.id);

          if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
          }
        } else {
          const { error: insertError } = await supabase
            .from('fisherman_sale_points')
            .insert(pointData);

          if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
          }
        }
      }

      toast.success('Points de vente enregistrés');
      navigate('/dashboard/pecheur');
    } catch (error: any) {
      console.error('Error saving sale points:', error);
      toast.error(getUserFriendlyError(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Overlay carte pour sélection */}
      {selectingIndex !== null && isLoaded && (
        <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
          <div className="p-4 bg-card border-b flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Sélectionner un emplacement</h2>
              <p className="text-sm text-muted-foreground">Cliquez sur la carte pour définir le point de vente</p>
            </div>
            <Button variant="outline" onClick={handleCancelSelection}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
          <div className="flex-1">
            <GoogleMap
              mapContainerStyle={overlayMapStyle}
              center={tempMarker || defaultMapConfig.center}
              zoom={tempMarker ? 15 : defaultMapConfig.zoom}
              onClick={handleMapClick}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
              }}
            >
              {tempMarker && (
                <Marker 
                  position={tempMarker}
                  animation={google.maps.Animation.DROP}
                />
              )}
            </GoogleMap>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/pecheur')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Mes points de vente</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Configure jusqu'à 2 points de vente. Ils apparaîtront sur la carte publique.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {salePoints.map((point, index) => (
                <Card key={point.id || `new-${index}`} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Point {index + 1}
                        {point.is_primary && <span className="text-sm text-primary">(Principal)</span>}
                      </CardTitle>
                      {salePoints.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePoint(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`label-${index}`}>Nom *</Label>
                      <Input
                        id={`label-${index}`}
                        placeholder="Ex: Marché du port"
                        value={point.label}
                        onChange={(e) => handleChange(index, 'label', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`address-${index}`}>Adresse complète *</Label>
                      <Input
                        id={`address-${index}`}
                        placeholder="Quai Cronstadt, 83400 Hyères"
                        value={point.address}
                        onChange={(e) => handleChange(index, 'address', e.target.value)}
                        required
                      />
                      
                      {/* Bouton sélection sur carte */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectOnMap(index)}
                        className="w-full mt-2"
                      >
                        <Map className="h-4 w-4 mr-2" />
                        Sélectionner sur la carte
                      </Button>

                      {point.latitude && point.longitude ? (
                        <p className="text-xs text-muted-foreground">
                          ✓ Localisé: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Sélectionnez un emplacement sur la carte pour localiser le point de vente
                        </p>
                      )}
                    </div>

                    {isLoaded && point.latitude && point.longitude && (
                      <div className="space-y-2">
                        <Label>Aperçu</Label>
                        <GoogleMap
                          mapContainerStyle={mapContainerStyle}
                          center={{ lat: point.latitude, lng: point.longitude }}
                          zoom={15}
                        >
                          <Marker position={{ lat: point.latitude, lng: point.longitude }} />
                        </GoogleMap>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`desc-${index}`}>Description</Label>
                      <Textarea
                        id={`desc-${index}`}
                        placeholder="Ex: À côté de la glacière bleue..."
                        value={point.description}
                        onChange={(e) => handleChange(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Photo du point de vente
                      </Label>
                      <PhotoUpload
                        label=""
                        value={point.photo_url}
                        onChange={(url) => handleChange(index, 'photo_url', url)}
                        bucket="fishermen-photos"
                      />
                      <p className="text-xs text-muted-foreground">
                        Une photo aide les clients à vous trouver facilement
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {salePoints.length < 2 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleAddPoint}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un 2ème point
                </Button>
              )}

              {salePoints.length === 2 && (
                <p className="text-sm text-muted-foreground text-center">
                  Maximum 2 points atteint
                </p>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/pecheur')}
                  disabled={saving}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
