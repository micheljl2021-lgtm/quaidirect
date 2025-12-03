import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, MapPin, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { geocodeAddress } from '@/lib/google-geocode';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { googleMapsLoaderConfig } from '@/lib/google-maps';
import { getUserFriendlyError } from '@/lib/errorMessages';

interface SalePoint {
  id?: string;
  label: string;
  address: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '200px',
};

export default function EditSalePoints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [salePoints, setSalePoints] = useState<SalePoint[]>([]);
  const [geocoding, setGeocoding] = useState<{ [key: number]: boolean }>({});

  const { isLoaded } = useJsApiLoader(googleMapsLoaderConfig);

  useEffect(() => {
    if (user) {
      loadSalePoints();
    }
  }, [user]);

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
        })));
      } else {
        setSalePoints([{
          label: '',
          address: '',
          description: '',
          latitude: null,
          longitude: null,
          is_primary: true,
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
        // Mise à jour atomique de tous les champs pour éviter le stale state
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
      toast.error('Veuillez localiser toutes les adresses (bouton "Localiser")');
      return;
    }

    setSaving(true);
    try {
      // Récupérer les IDs existants pour déterminer les opérations UPSERT/DELETE
      const existingIds = salePoints.filter(p => p.id).map(p => p.id);
      const currentPointIds = salePoints.map(p => p.id).filter(Boolean);

      // Supprimer les points qui ne sont plus dans la liste (point supprimé par l'utilisateur)
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

      // UPSERT chaque point individuellement
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
        };

        if (point.id) {
          // UPDATE existant
          const { error: updateError } = await supabase
            .from('fisherman_sale_points')
            .update(pointData)
            .eq('id', point.id);

          if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
          }
        } else {
          // INSERT nouveau
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
                      <div className="flex gap-2">
                        <Input
                          id={`address-${index}`}
                          placeholder="Quai Cronstadt, 83400 Hyères"
                          value={point.address}
                          onChange={(e) => handleChange(index, 'address', e.target.value)}
                          required
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleGeocode(index)}
                          disabled={!point.address || geocoding[index]}
                        >
                          {geocoding[index] ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Localiser'
                          )}
                        </Button>
                      </div>
                      {point.latitude && point.longitude && (
                        <p className="text-xs text-muted-foreground">
                          ✓ Localisé: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
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
