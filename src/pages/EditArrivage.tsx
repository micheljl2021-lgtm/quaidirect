import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Anchor, MapPin, Calendar, Clock, Fish, Camera, Search, ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import OfferPhotosUpload from '@/components/OfferPhotosUpload';
import { DropPhotosUpload } from '@/components/DropPhotosUpload';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Offer {
  id?: string;
  speciesId: string;
  title: string;
  description: string;
  unitPrice: string;
  totalUnits: string;
  availableUnits: string;
  photos: string[];
}

const EditArrivage = () => {
  const { dropId } = useParams<{ dropId: string }>();
  const { user, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingDrop, setLoadingDrop] = useState(true);

  // Form state
  const [salePointId, setSalePointId] = useState('');
  const [etaDate, setEtaDate] = useState('');
  const [etaTime, setEtaTime] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [saleTime, setSaleTime] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [notes, setNotes] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<string[]>([]);
  const [dropPhotos, setDropPhotos] = useState<string[]>([]);
  const [speciesSearch, setSpeciesSearch] = useState("");

  useEffect(() => {
    if (!user || !isVerifiedFisherman) {
      navigate('/dashboard/pecheur');
      return;
    }
  }, [user, isVerifiedFisherman, navigate]);

  // Charger l'arrivage existant
  const { data: existingDrop, isLoading: isLoadingDrop } = useQuery({
    queryKey: ['drop', dropId],
    queryFn: async () => {
      if (!dropId) throw new Error('Drop ID manquant');
      
      const { data, error } = await supabase
        .from('drops')
        .select(`
          *,
          offers(*),
          drop_species(species_id),
          drop_photos(photo_url, display_order),
          fishermen(id, user_id)
        `)
        .eq('id', dropId)
        .single();

      if (error) throw error;
      
      // Vérifier que le pêcheur est propriétaire
      if (data.fishermen.user_id !== user?.id) {
        throw new Error('Vous n\'êtes pas autorisé à modifier cet arrivage');
      }

      // Vérifier le statut
      if (data.status !== 'scheduled' && data.status !== 'landed') {
        throw new Error('Impossible de modifier un arrivage terminé ou annulé');
      }

      return data;
    },
    enabled: !!dropId && !!user,
  });

  // Pré-remplir le formulaire quand les données sont chargées
  useEffect(() => {
    const loadDropData = async () => {
      if (existingDrop) {
        // Priorité: sale_point_id, sinon port_id pour compatibilité
        setSalePointId(existingDrop.sale_point_id || existingDrop.port_id || '');
        
        if (existingDrop.eta_at) {
          const etaDate = new Date(existingDrop.eta_at);
          setEtaDate(etaDate.toISOString().split('T')[0]);
          setEtaTime(etaDate.toTimeString().slice(0, 5));
        }
        
        if (existingDrop.sale_start_time) {
          const saleDate = new Date(existingDrop.sale_start_time);
          setSaleDate(saleDate.toISOString().split('T')[0]);
          setSaleTime(saleDate.toTimeString().slice(0, 5));
        }
        
        setIsPremium(existingDrop.is_premium || false);
        setNotes(existingDrop.notes || '');
        
        // Charger les espèces sélectionnées
        if (existingDrop.drop_species) {
          setSelectedSpeciesIds(existingDrop.drop_species.map((ds: any) => ds.species_id));
        }
        
        // Charger les photos du drop
        if (existingDrop.drop_photos) {
          const photos = existingDrop.drop_photos
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((dp: any) => dp.photo_url);
          setDropPhotos(photos);
        }
        
        // Charger les offres existantes
        if (existingDrop.offers && existingDrop.offers.length > 0) {
          const loadedOffers = await Promise.all(existingDrop.offers.map(async (offer: any) => {
            // Charger les photos de l'offre
            const { data: offerPhotos } = await supabase
              .from('offer_photos')
              .select('photo_url')
              .eq('offer_id', offer.id)
              .order('display_order');
            
            return {
              id: offer.id,
              speciesId: offer.species_id,
              title: offer.title,
              description: offer.description || '',
              unitPrice: offer.unit_price.toString(),
              totalUnits: offer.total_units.toString(),
              availableUnits: offer.available_units.toString(),
              photos: offerPhotos?.map((p: any) => p.photo_url) || [],
            };
          }));
          setOffers(loadedOffers);
        }
        
        setLoadingDrop(false);
      }
    };
    
    loadDropData();
  }, [existingDrop]);

  // Récupérer la zone de pêche du pêcheur
  const { data: fishermanData } = useQuery({
    queryKey: ['fisherman-zone', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('fishermen')
        .select('id, main_fishing_zone')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const getFishingArea = (mainZone: string | null): string => {
    if (!mainZone) return 'all';
    const zone = mainZone.toLowerCase();
    if (zone.includes('méditerranée') || zone.includes('hyeres') || zone.includes('marseille') || zone.includes('toulon')) {
      return 'mediterranee';
    }
    if (zone.includes('atlantique') || zone.includes('bretagne') || zone.includes('vendée') || zone.includes('charente')) {
      return 'atlantique';
    }
    if (zone.includes('manche') || zone.includes('normandie') || zone.includes('calais')) {
      return 'manche';
    }
    return 'all';
  };

  const fishingAreaType = getFishingArea(fishermanData?.main_fishing_zone || null);

  // Fetch fisherman sale points
  const { data: salePoints } = useQuery({
    queryKey: ['fisherman-sale-points', fishermanData?.id],
    queryFn: async () => {
      if (!fishermanData?.id) return [];
      const { data, error } = await supabase
        .from('fisherman_sale_points')
        .select('*')
        .eq('fisherman_id', fishermanData.id)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!fishermanData?.id,
  });

  // Récupérer les espèces filtrées par zone
  const { data: species } = useQuery({
    queryKey: ['species', fishingAreaType],
    queryFn: async () => {
      let query = supabase
        .from('species')
        .select('id, name, scientific_name, fishing_area, indicative_price, price_unit, presentation')
        .order('name');
      
      if (fishingAreaType !== 'all') {
        query = query.in('fishing_area', [fishingAreaType as any, 'all']);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!fishingAreaType,
  });

  // Fetch fisherman's preferred species
  const { data: fishermenSpecies } = useQuery({
    queryKey: ['fisherman-species', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: fisherman } = await supabase
        .from('fishermen')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!fisherman) return [];

      const { data, error } = await supabase
        .from('fishermen_species')
        .select('species_id, is_primary')
        .eq('fisherman_id', fisherman.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const sortedSpecies = species ? [...species].sort((a, b) => {
    const aPreferred = fishermenSpecies?.find(fs => fs.species_id === a.id);
    const bPreferred = fishermenSpecies?.find(fs => fs.species_id === b.id);
    
    if (aPreferred?.is_primary) return -1;
    if (bPreferred?.is_primary) return 1;
    if (aPreferred && !bPreferred) return -1;
    if (bPreferred && !aPreferred) return 1;
    
    return a.name.localeCompare(b.name);
  }) : [];

  const filteredSpecies = sortedSpecies.filter(s => 
    s.name.toLowerCase().includes(speciesSearch.toLowerCase()) ||
    (s.scientific_name && s.scientific_name.toLowerCase().includes(speciesSearch.toLowerCase()))
  );

  const addOffer = () => {
    setOffers([...offers, { speciesId: '', title: '', description: '', unitPrice: '', totalUnits: '', availableUnits: '', photos: [] }]);
  };

  const removeOffer = (index: number) => {
    setOffers(offers.filter((_, i) => i !== index));
  };

  const updateOffer = (index: number, field: keyof Offer, value: string | string[]) => {
    const newOffers = [...offers];
    (newOffers[index][field] as any) = value;
    
    if (field === 'speciesId' && typeof value === 'string') {
      const selectedSpecies = species?.find(s => s.id === value);
      if (selectedSpecies?.indicative_price) {
        newOffers[index].unitPrice = selectedSpecies.indicative_price.toString();
      }
    }
    
    setOffers(newOffers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!salePointId || !saleDate || !saleTime) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un point de vente et remplir les horaires',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const etaAt = etaDate && etaTime ? new Date(`${etaDate}T${etaTime}`) : null;
      const saleStartTime = new Date(`${saleDate}T${saleTime}`);
      const visibleAt = new Date(saleStartTime.getTime() - (isPremium ? 2 : 1) * 60 * 60 * 1000);
      const publicVisibleAt = isPremium ? new Date(visibleAt.getTime() + 30 * 60 * 1000) : null;

      // Mettre à jour l'arrivage avec sale_point_id
      const { error: updateError } = await supabase
        .from('drops')
        .update({
          sale_point_id: salePointId,
          port_id: null, // Nettoyer l'ancien champ
          eta_at: etaAt?.toISOString(),
          sale_start_time: saleStartTime.toISOString(),
          visible_at: visibleAt.toISOString(),
          public_visible_at: publicVisibleAt?.toISOString(),
          is_premium: isPremium,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dropId);

      if (updateError) throw updateError;

      // Mettre à jour drop_species (DELETE puis INSERT)
      await supabase.from('drop_species').delete().eq('drop_id', dropId);
      
      if (selectedSpeciesIds.length > 0) {
        const dropSpeciesToInsert = selectedSpeciesIds.map(speciesId => ({
          drop_id: dropId,
          species_id: speciesId,
        }));
        const { error: speciesError } = await supabase
          .from('drop_species')
          .insert(dropSpeciesToInsert);
        if (speciesError) throw speciesError;
      }

      // Mettre à jour drop_photos (DELETE puis INSERT)
      await supabase.from('drop_photos').delete().eq('drop_id', dropId);
      
      if (dropPhotos.length > 0) {
        const dropPhotoInserts = dropPhotos.map((url, index) => ({
          drop_id: dropId,
          photo_url: url,
          display_order: index,
        }));
        const { error: photosError } = await supabase
          .from('drop_photos')
          .insert(dropPhotoInserts);
        if (photosError) throw photosError;
      }

      // Gérer les offres
      const validOffers = offers.filter(o => o.speciesId && o.title && o.unitPrice && o.totalUnits);
      
      // Supprimer les anciennes offres et leurs photos
      const existingOfferIds = existingDrop?.offers?.map((o: any) => o.id) || [];
      for (const offerId of existingOfferIds) {
        await supabase.from('offer_photos').delete().eq('offer_id', offerId);
      }
      await supabase.from('offers').delete().eq('drop_id', dropId);

      // Créer les nouvelles offres
      if (validOffers.length > 0) {
        const offersToInsert = validOffers.map(offer => ({
          drop_id: dropId,
          species_id: offer.speciesId,
          title: offer.title,
          description: offer.description || null,
          unit_price: parseFloat(offer.unitPrice),
          total_units: parseInt(offer.totalUnits),
          available_units: parseInt(offer.availableUnits || offer.totalUnits),
        }));

        const { data: insertedOffers, error: offersError } = await supabase
          .from('offers')
          .insert(offersToInsert)
          .select();

        if (offersError) throw offersError;

        // Insérer les photos des offres
        if (insertedOffers) {
          for (let i = 0; i < insertedOffers.length; i++) {
            const offer = validOffers[i];
            const insertedOffer = insertedOffers[i];
            
            if (offer.photos && offer.photos.length > 0) {
              const photosToInsert = offer.photos.map((photoUrl, index) => ({
                offer_id: insertedOffer.id,
                photo_url: photoUrl,
                display_order: index,
              }));

              await supabase.from('offer_photos').insert(photosToInsert);
            }
          }
        }
      }

      toast({
        title: '✅ Arrivage modifié !',
        description: 'Les modifications ont été enregistrées avec succès',
      });

      navigate('/dashboard/pecheur');
    } catch (error: any) {
      console.error('Error updating arrivage:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier l\'arrivage',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingDrop || loadingDrop) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <p className="text-center text-muted-foreground">Chargement de l'arrivage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/pecheur')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Anchor className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Modifier l'arrivage
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Modifiez les informations de votre point de vente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de disponibilité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Informations de disponibilité
              </CardTitle>
              <CardDescription>
                Séparez l'heure de débarquement et l'heure de mise en vente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="sale-point">Point de vente *</Label>
                <Select value={salePointId} onValueChange={setSalePointId}>
                  <SelectTrigger id="sale-point">
                    <SelectValue placeholder="Sélectionnez un point de vente" />
                  </SelectTrigger>
                  <SelectContent>
                    {salePoints?.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.label} - {sp.address}
                        {sp.is_primary && ' (Principal)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!salePoints || salePoints.length === 0) && (
                  <p className="text-sm text-amber-600">
                    Aucun point de vente configuré. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/pecheur/edit-sale-points')}>Configurer</Button>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Anchor className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-medium">Heure de débarquement (optionnel)</Label>
                </div>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="eta-date">Date</Label>
                    <Input
                      id="eta-date"
                      type="date"
                      value={etaDate}
                      onChange={(e) => setEtaDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eta-time">Heure</Label>
                    <Input
                      id="eta-time"
                      type="time"
                      value={etaTime}
                      onChange={(e) => setEtaTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <Label className="text-base font-medium">Heure de mise en vente *</Label>
                </div>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="sale-date">Date *</Label>
                    <Input
                      id="sale-date"
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale-time">Heure *</Label>
                    <Input
                      id="sale-time"
                      type="time"
                      value={saleTime}
                      onChange={(e) => setSaleTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label htmlFor="premium" className="text-base font-medium">
                    Arrivage Premium
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Visible 30 min avant pour les membres Premium
                  </p>
                </div>
                <Switch
                  id="premium"
                  checked={isPremium}
                  onCheckedChange={setIsPremium}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Informations complémentaires..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sélection des espèces */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5" />
                Espèces disponibles
              </CardTitle>
              <CardDescription>
                Sélectionnez les espèces que vous vendrez (optionnel)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une espèce..."
                  value={speciesSearch}
                  onChange={(e) => setSpeciesSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2">
                {filteredSpecies.map((s) => {
                  const isPreferred = fishermenSpecies?.find(fs => fs.species_id === s.id);
                  const isPrimary = isPreferred?.is_primary;
                  
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center space-x-2 p-3 rounded-lg border transition-colors ${
                        selectedSpeciesIds.includes(s.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      } ${isPrimary ? 'ring-2 ring-primary/50' : ''}`}
                    >
                      <Checkbox
                        id={`species-${s.id}`}
                        checked={selectedSpeciesIds.includes(s.id)}
                        onCheckedChange={(checked) => {
                          setSelectedSpeciesIds(
                            checked
                              ? [...selectedSpeciesIds, s.id]
                              : selectedSpeciesIds.filter(id => id !== s.id)
                          );
                        }}
                      />
                      <Label
                        htmlFor={`species-${s.id}`}
                        className="flex-1 cursor-pointer text-sm font-medium"
                      >
                        {s.name}
                        {isPrimary && <span className="ml-1 text-primary">★</span>}
                      </Label>
                    </div>
                  );
                })}
              </div>

              {selectedSpeciesIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedSpeciesIds.length} espèce(s) sélectionnée(s)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Photos générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photos du point de vente
              </CardTitle>
              <CardDescription>
                Ajoutez 2 à 5 photos de votre étal (optionnel)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DropPhotosUpload
                onPhotosChange={setDropPhotos}
                initialPhotos={dropPhotos}
              />
            </CardContent>
          </Card>

          {/* Offres détaillées */}
          <Card>
            <CardHeader>
              <CardTitle>Offres détaillées (optionnel)</CardTitle>
              <CardDescription>
                Créez des offres précises avec prix, quantité et photos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {offers.map((offer, index) => (
                <Card key={index} className="p-4 bg-muted/50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Offre {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOffer(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Espèce *</Label>
                        <Select
                          value={offer.speciesId}
                          onValueChange={(value) => updateOffer(index, 'speciesId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            {species?.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Titre *</Label>
                        <Input
                          value={offer.title}
                          onChange={(e) => updateOffer(index, 'title', e.target.value)}
                          placeholder="Ex: Rougets frais du matin"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Prix unitaire (€) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={offer.unitPrice}
                          onChange={(e) => updateOffer(index, 'unitPrice', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantité totale *</Label>
                        <Input
                          type="number"
                          value={offer.totalUnits}
                          onChange={(e) => {
                            updateOffer(index, 'totalUnits', e.target.value);
                            if (!offer.availableUnits) {
                              updateOffer(index, 'availableUnits', e.target.value);
                            }
                          }}
                          placeholder="Ex: 5"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={offer.description}
                          onChange={(e) => updateOffer(index, 'description', e.target.value)}
                          placeholder="Détails supplémentaires..."
                          rows={2}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Photos de l'offre (2-5)</Label>
                        <OfferPhotosUpload
                          photos={offer.photos}
                          onChange={(photos) => updateOffer(index, 'photos', photos)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addOffer}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une offre détaillée
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/pecheur')}
              className="flex-1"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditArrivage;
