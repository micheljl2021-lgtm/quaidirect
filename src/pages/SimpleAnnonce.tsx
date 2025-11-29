import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropPhotosUpload } from '@/components/DropPhotosUpload';
import { CalendarIcon, Clock, MapPin, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DESCRIPTION_TEMPLATES = [
  {
    label: 'Poisson de roche pour soupe',
    value: 'Poisson de roche idéal pour soupe de poisson, vendu au kilo. Arrivage du matin.',
  },
  {
    label: 'Mélange grillade',
    value: 'Mélange de poissons frais pour grillades, arrivage du matin. Vendu au kilo.',
  },
  {
    label: 'Poisson frais du jour',
    value: 'Poisson frais du jour, venez tôt ! Quantité limitée.',
  },
];

const TIME_SLOTS = [
  { value: 'matin', label: '7h - 9h (Matin)' },
  { value: 'fin_matinee', label: '9h - 11h (Fin de matinée)' },
  { value: 'midi', label: '11h - 13h (Midi)' },
  { value: 'apres_midi', label: '14h - 17h (Après-midi)' },
];

export default function SimpleAnnonce() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [salePoints, setSalePoints] = useState<any[]>([]);
  const [allSpecies, setAllSpecies] = useState<any[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    salePointId: '',
    date: new Date(),
    timeSlot: 'matin',
    description: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch fisherman
      const { data: fisherman } = await supabase
        .from('fishermen')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!fisherman) return;

      // Fetch sale points
      const { data: points } = await supabase
        .from('fisherman_sale_points')
        .select('*')
        .eq('fisherman_id', fisherman.id)
        .order('is_primary', { ascending: false });

      setSalePoints(points || []);

      // Pre-select first point
      if (points && points.length > 0) {
        setFormData(prev => ({ ...prev, salePointId: points[0].id }));
      }

      // Fetch species
      const { data: species } = await supabase
        .from('species')
        .select('id, name')
        .order('name');

      setAllSpecies(species || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleTemplateSelect = (template: string) => {
    setFormData(prev => ({ ...prev, description: template }));
  };

  const toggleSpecies = (speciesId: string) => {
    setSelectedSpecies(prev => 
      prev.includes(speciesId)
        ? prev.filter(id => id !== speciesId)
        : [...prev, speciesId]
    );
  };

  const handlePublish = async () => {
    if (!formData.salePointId) {
      toast.error('Sélectionnez un point de vente');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Ajoutez une description');
      return;
    }

    setLoading(true);

    try {
      // Get fisherman ID and favorite port
      const { data: fisherman } = await supabase
        .from('fishermen')
        .select('id, zone_id')
        .eq('user_id', user?.id)
        .single();

      if (!fisherman) throw new Error('Pêcheur non trouvé');
      if (!fisherman.zone_id) throw new Error('Port favori non configuré. Complétez votre profil.');

      // Get sale point details
      const { data: salePoint } = await supabase
        .from('fisherman_sale_points')
        .select('*')
        .eq('id', formData.salePointId)
        .single();

      // Create time from slot
      const timeSlotMap: Record<string, { start: string }> = {
        matin: { start: '07:00' },
        fin_matinee: { start: '09:00' },
        midi: { start: '11:00' },
        apres_midi: { start: '14:00' },
      };

      const slot = timeSlotMap[formData.timeSlot] || timeSlotMap.matin;
      const etaDate = new Date(formData.date);
      etaDate.setHours(parseInt(slot.start.split(':')[0]), parseInt(slot.start.split(':')[1]));

      // Insert drop (simple type) - use fisherman's favorite port as reference
      const { data: drop, error: dropError } = await supabase
        .from('drops')
        .insert({
          fisherman_id: fisherman.id,
          port_id: fisherman.zone_id, // Use favorite port as reference
          eta_at: etaDate.toISOString(),
          sale_start_time: etaDate.toISOString(),
          visible_at: new Date().toISOString(),
          status: 'scheduled',
          drop_type: 'simple',
          notes: `${formData.description}\n\nLieu: ${salePoint?.label} - ${salePoint?.address}`,
          latitude: salePoint?.latitude,
          longitude: salePoint?.longitude,
        })
        .select()
        .single();

      if (dropError) throw dropError;

      // Insert species associations if any
      if (selectedSpecies.length > 0) {
        const dropSpeciesData = selectedSpecies.map(speciesId => ({
          drop_id: drop.id,
          species_id: speciesId,
        }));

        await supabase.from('drop_species').insert(dropSpeciesData);
      }

      // Insert photos if any
      if (photos.length > 0) {
        const photosData = photos.map((url, index) => ({
          drop_id: drop.id,
          photo_url: url,
          display_order: index,
        }));

        await supabase.from('drop_photos').insert(photosData);
      }

      toast.success('Annonce publiée !');
      navigate('/pecheur/dashboard');
    } catch (error: any) {
      console.error('Error publishing:', error);
      toast.error(error.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/pecheur/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au dashboard
          </Button>
          <h1 className="text-3xl font-bold mb-2">Annonce simple point de vente</h1>
          <p className="text-muted-foreground">
            Pour poisson de roche, mélange, vente au kilo sans détail par espèce
          </p>
        </div>

        <div className="space-y-6">
          {/* Sale Point */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Point de vente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.salePointId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, salePointId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un point de vente" />
                </SelectTrigger>
                <SelectContent>
                  {salePoints.map(point => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.label} - {point.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {salePoints.length === 0 && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                    Aucun point de vente configuré. Configure d'abord tes lieux de vente dans ton profil.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/pecheur/edit-profile')}
                  >
                    Configurer mes points de vente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Date et horaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.date, 'PPP', { locale: fr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Créneau horaire</Label>
                <Select
                  value={formData.timeSlot}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timeSlot: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(slot => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <CardDescription>
                Sélectionnez un modèle ou rédigez votre propre texte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {DESCRIPTION_TEMPLATES.map(template => (
                  <Button
                    key={template.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect(template.value)}
                  >
                    {template.label}
                  </Button>
                ))}
              </div>

              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre vente..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos (optionnel, jusqu'à 3)</CardTitle>
            </CardHeader>
            <CardContent>
              <DropPhotosUpload
                initialPhotos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={3}
              />
            </CardContent>
          </Card>

          {/* Species Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Espèces (optionnel)</CardTitle>
              <CardDescription>
                Ajoutez des tags d'espèces sans détail de prix/quantité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allSpecies.map(species => (
                  <Badge
                    key={species.id}
                    variant={selectedSpecies.includes(species.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSpecies(species.id)}
                  >
                    {species.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 sticky bottom-4">
            <Button
              variant="outline"
              onClick={() => navigate('/pecheur/dashboard')}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePublish}
              disabled={loading}
              className="flex-1"
              size="lg"
            >
              {loading ? 'Publication...' : 'Publier l\'annonce'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
