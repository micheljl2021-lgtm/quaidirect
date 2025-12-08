import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { Plus, Trash2, Anchor, MapPin, Calendar, Clock, Fish, Camera, Search, X, Loader2, ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import OfferPhotosUpload from '@/components/OfferPhotosUpload';
import { DropPhotosUpload } from '@/components/DropPhotosUpload';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Offer {
  speciesId: string;
  title: string;
  description: string;
  unitPrice: string;
  totalUnits: string;
  photos: string[];
}

const CreateArrivage = () => {
  const { user, userRole, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Check if duplicating
  const searchParams = new URLSearchParams(location.search);
  const isDuplicating = searchParams.get('duplicate') === 'true';

  // Form state
  const [portId, setPortId] = useState('');
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
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!isVerifiedFisherman) {
      navigate('/dashboard/pecheur');
      return;
    }
  }, [user, isVerifiedFisherman, navigate]);

  // Récupérer le pêcheur avec sa zone
  const { data: fishermanData } = useQuery({
    queryKey: ['fisherman-zone', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('fishermen')
        .select('id, zone_id, main_fishing_zone')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Fetch ports
  const { data: ports } = useQuery({
    queryKey: ['ports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ports')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  // Récupérer le nom de la zone
  const { data: zoneData } = useQuery({
    queryKey: ['zone-name', fishermanData?.zone_id],
    queryFn: async () => {
      if (!fishermanData?.zone_id) return null;
      const { data } = await supabase
        .from('zones_peche')
        .select('name, region')
        .eq('id', fishermanData.zone_id)
        .single();
      return data;
    },
    enabled: !!fishermanData?.zone_id,
  });

  // Récupérer les espèces filtrées par zone du pêcheur
  const { data: species } = useQuery({
    queryKey: ['species-by-zone', fishermanData?.zone_id],
    queryFn: async () => {
      // Si le pêcheur a une zone définie, filtrer via zones_especes
      if (fishermanData?.zone_id) {
        const { data: zoneSpecies, error } = await supabase
          .from('zones_especes')
          .select(`
            species:species (
              id, name, scientific_name, fishing_area, indicative_price, price_unit, presentation
            )
          `)
          .eq('zone_id', fishermanData.zone_id);

        if (error) throw error;
        return zoneSpecies?.map(zs => zs.species).filter(Boolean) || [];
      }

      // Sinon, afficher toutes les espèces
      const { data, error } = await supabase
        .from('species')
        .select('id, name, scientific_name, fishing_area, indicative_price, price_unit, presentation')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!fishermanData,
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

  // Load duplication data if duplicating
  useEffect(() => {
    if (isDuplicating) {
      const duplicateData = sessionStorage.getItem('duplicateDropData');
      if (duplicateData) {
        try {
          const data = JSON.parse(duplicateData);
          setPortId(data.port_id || '');
          setIsPremium(data.is_premium || false);
          setNotes(data.notes || '');
          setDropPhotos(data.drop_photos?.map((p: any) => p.photo_url) || []);
          setSelectedSpeciesIds(data.species || []);
          setOffers(data.offers?.map((o: any) => ({
            speciesId: o.species_id,
            title: o.title,
            description: o.description || '',
            unitPrice: o.unit_price?.toString() || '',
            totalUnits: o.total_units?.toString() || '',
            photos: o.photos?.map((p: any) => p.url) || []
          })) || []);
          
          sessionStorage.removeItem('duplicateDropData');
          
          toast({
            title: "Arrivage dupliqué",
            description: "Modifiez la date et l'heure, puis validez pour créer le nouvel arrivage",
          });
        } catch (error) {
          console.error('Error loading duplicate data:', error);
        }
      }
    }
  }, [isDuplicating, toast]);

  // Trier les espèces : favorites en premier, puis alphabétique
  const sortedSpecies = species ? [...species].sort((a, b) => {
    const aPreferred = fishermenSpecies?.find(fs => fs.species_id === a.id);
    const bPreferred = fishermenSpecies?.find(fs => fs.species_id === b.id);
    
    if (aPreferred?.is_primary) return -1;
    if (bPreferred?.is_primary) return 1;
    if (aPreferred && !bPreferred) return -1;
    if (bPreferred && !aPreferred) return 1;
    
    return a.name.localeCompare(b.name);
  }) : [];

  // Filtrer les espèces par recherche
  const filteredSpecies = sortedSpecies.filter(s => 
    s.name.toLowerCase().includes(speciesSearch.toLowerCase()) ||
    (s.scientific_name && s.scientific_name.toLowerCase().includes(speciesSearch.toLowerCase()))
  );

  const addOffer = () => {
    setOffers([...offers, { speciesId: '', title: '', description: '', unitPrice: '', totalUnits: '', photos: [] }]);
  };

  const removeOffer = (index: number) => {
    setOffers(offers.filter((_, i) => i !== index));
  };

  const updateOffer = (index: number, field: keyof Offer, value: string | string[]) => {
    const newOffers = [...offers];
    (newOffers[index][field] as any) = value;
    
    // Auto-fill price when species is selected
    if (field === 'speciesId' && typeof value === 'string') {
      const selectedSpecies = species?.find(s => s.id === value);
      if (selectedSpecies?.indicative_price) {
        newOffers[index].unitPrice = selectedSpecies.indicative_price.toString();
        toast({
          title: "💰 Prix suggéré",
          description: `${selectedSpecies.name} (${selectedSpecies.presentation || 'entier'}) : ${selectedSpecies.indicative_price}${selectedSpecies.price_unit || '€/kg'}`,
        });
      }
    }
    
    setOffers(newOffers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!portId || !saleDate || !saleTime) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir tous les champs obligatoires (port, date et heure de vente)',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const validOffers = offers.filter(o => o.speciesId && o.title && o.unitPrice && o.totalUnits);

      // Get fisherman ID
      const { data: fisherman, error: fishermanError } = await supabase
        .from('fishermen')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (fishermanError) throw fishermanError;

      // Create ETA datetime (heure de débarquement) - optionnel
      const etaAt = etaDate && etaTime ? new Date(`${etaDate}T${etaTime}`) : null;
      // Create sale start time (heure de mise en vente) - obligatoire
      const saleStartTime = new Date(`${saleDate}T${saleTime}`);
      const visibleAt = new Date(saleStartTime.getTime() - (isPremium ? 2 : 1) * 60 * 60 * 1000); // 2h before for premium, 1h for regular
      const publicVisibleAt = isPremium ? new Date(visibleAt.getTime() + 30 * 60 * 1000) : null; // 30 min after visible_at

      // Create arrivage
      const { data: arrivage, error: arrivageError } = await supabase
        .from('drops')
        .insert({
          fisherman_id: fisherman.id,
          port_id: portId,
          eta_at: etaAt?.toISOString(),
          sale_start_time: saleStartTime.toISOString(),
          visible_at: visibleAt.toISOString(),
          public_visible_at: publicVisibleAt?.toISOString(),
          is_premium: isPremium,
          status: 'scheduled',
          notes: notes || null,
        })
        .select()
        .single();

      if (arrivageError) throw arrivageError;

      // Save selected species (if any)
      if (selectedSpeciesIds.length > 0) {
        const dropSpeciesToInsert = selectedSpeciesIds.map(speciesId => ({
          drop_id: arrivage.id,
          species_id: speciesId,
        }));

        const { error: dropSpeciesError } = await supabase
          .from('drop_species')
          .insert(dropSpeciesToInsert);

        if (dropSpeciesError) throw dropSpeciesError;
      }

      // Insérer les photos générales du drop
      if (dropPhotos.length > 0) {
        const dropPhotoInserts = dropPhotos.map((url, index) => ({
          drop_id: arrivage.id,
          photo_url: url,
          display_order: index,
        }));

        const { error: dropPhotosError } = await supabase
          .from('drop_photos')
          .insert(dropPhotoInserts);

        if (dropPhotosError) {
          console.error('Error inserting drop photos:', dropPhotosError);
          throw dropPhotosError;
        }
      }

      // Create offers (only if there are valid offers)
      if (validOffers.length > 0) {
        const offersToInsert = validOffers.map(offer => ({
          drop_id: arrivage.id,
          species_id: offer.speciesId,
          title: offer.title,
          description: offer.description || null,
          unit_price: parseFloat(offer.unitPrice),
          total_units: parseInt(offer.totalUnits),
          available_units: parseInt(offer.totalUnits),
        }));

        const { data: insertedOffers, error: offersError } = await supabase
          .from('offers')
          .insert(offersToInsert)
          .select();

        if (offersError) throw offersError;

        // Insert offer photos
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

              const { error: photosError } = await supabase
                .from('offer_photos')
                .insert(photosToInsert);

              if (photosError) console.error('Error inserting photos:', photosError);
            }
          }
        }
      }

      toast({
        title: '✅ Arrivage créé !',
        description: validOffers.length > 0 
          ? `Arrivage publié avec ${validOffers.length} offre(s) détaillée(s)`
          : selectedSpeciesIds.length > 0
            ? `Arrivage publié avec ${selectedSpeciesIds.length} espèce(s)`
            : 'Arrivage publié. Vous pourrez ajouter des détails plus tard.',
      });

      navigate('/dashboard/pecheur');
    } catch (error: any) {
      console.error('Error creating arrivage:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'arrivage',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/pecheur')} 
          className="gap-2 mb-4"
          aria-label="Retour au dashboard pêcheur"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Anchor className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Nouvel arrivage
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Annoncez quand votre pêche sera disponible à la vente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Arrivage Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Informations de disponibilité
              </CardTitle>
              <CardDescription>
                Séparez l'heure de débarquement et l'heure de mise en vente (vente directe réglementaire)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Port */}
              <div className="space-y-2">
                <Label htmlFor="port">Port d'arrivée *</Label>
                <Select value={portId} onValueChange={setPortId}>
                  <SelectTrigger id="port">
                    <SelectValue placeholder="Sélectionnez un port" />
                  </SelectTrigger>
                  <SelectContent>
                    {ports?.map((port) => (
                      <SelectItem key={port.id} value={port.id}>
                        {port.name}, {port.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ETA (Débarquement) - Optionnel */}
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
                      min={new Date().toISOString().split('T')[0]}
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
                <p className="text-xs text-muted-foreground pl-6">
                  Ex: Retour au port à 2h00 du matin
                </p>
              </div>

              {/* Sale Start Time (Mise en vente) */}
              <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <Label className="text-base font-medium">Heure de mise en vente</Label>
                </div>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="sale-date">Date *</Label>
                    <Input
                      id="sale-date"
                      type="date"
                      value={saleDate}
                      onChange={(e) => setSaleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
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
                <p className="text-xs text-muted-foreground pl-6">
                  Ex: Vente à partir de 8h00 (les clients viendront à cette heure)
                </p>
              </div>

              {/* Premium Arrivage */}
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

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ex: Pêché cette nuit, poisson trié et prêt dès 7h..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sélection des espèces - Nouveau style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5" />
                Espèces disponibles
              </CardTitle>
              <CardDescription>
                Sélectionnez les espèces que vous allez vendre
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Message de zone détectée */}
              {zoneData && (
                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <div className="flex gap-2">
                    <span className="text-xl">📍</span>
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                      Zone détectée : <strong>{zoneData.name} ({zoneData.region})</strong>
                      <br />
                      Seules les espèces de votre zone sont affichées pour faciliter la sélection.
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={speciesSearch}
                  onChange={(e) => setSpeciesSearch(e.target.value)}
                  placeholder="Rechercher un poisson ou crustacé..."
                  className="pl-10"
                />
              </div>

              {/* Grille de checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                {filteredSpecies.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <Fish className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Aucune espèce trouvée</p>
                  </div>
                ) : (
                  filteredSpecies.map((species) => (
                    <div
                      key={species.id}
                      className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={species.id}
                        checked={selectedSpeciesIds.includes(species.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSpeciesIds([...selectedSpeciesIds, species.id]);
                          } else {
                            setSelectedSpeciesIds(selectedSpeciesIds.filter(id => id !== species.id));
                          }
                        }}
                      />
                      <label htmlFor={species.id} className="flex-1 text-sm cursor-pointer">
                        <div className="font-medium">{species.name}</div>
                        {species.scientific_name && (
                          <div className="text-xs text-muted-foreground italic">
                            {species.scientific_name}
                          </div>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>

              {/* Compteur */}
              <div className="text-sm text-muted-foreground text-center pt-2 border-t">
                {selectedSpeciesIds.length} espèce{selectedSpeciesIds.length > 1 ? 's' : ''} sélectionnée{selectedSpeciesIds.length > 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>

          {/* Photos générales de l'arrivage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Photos de votre point de vente
              </CardTitle>
              <CardDescription>
                Ajoutez 2-5 photos de votre étal, vos caisses de poissons, l'ambiance du point de vente.
                Ces photos seront visibles sur la carte d'arrivage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DropPhotosUpload
                maxPhotos={5}
                onPhotosChange={(urls) => setDropPhotos(urls)}
                initialPhotos={dropPhotos}
              />
            </CardContent>
          </Card>

          {/* Offers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Fish className="h-5 w-5" />
                    Photos et détails de vos poissons
                  </CardTitle>
                  <CardDescription>
                    Ajoutez des photos pour chaque espèce (2-5 photos par offre). Plus vous ajoutez de détails, plus vous attirerez de clients.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="lg" onClick={addOffer} className="h-12">
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter une offre
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {offers.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/50">
                  <Fish className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">Aucune offre avec photos ajoutée</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Cliquez sur "Ajouter" ci-dessus pour créer une offre avec photos et prix détaillés
                  </p>
                </div>
              ) : (
                offers.map((offer, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-6 space-y-4">
                    {offers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeOffer(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}

                    {/* Species */}
                    <div className="space-y-2">
                      <Label>Espèce *</Label>
                      <Select
                        value={offer.speciesId}
                        onValueChange={(value) => updateOffer(index, 'speciesId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une espèce" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedSpecies?.map((s) => {
                            const preferredSpecies = fishermenSpecies?.find(fs => fs.species_id === s.id);
                            const isPrimary = preferredSpecies?.is_primary;
                            const isPreferred = !!preferredSpecies;

                            return (
                              <SelectItem key={s.id} value={s.id}>
                                <div className="flex items-center justify-between gap-2 w-full">
                                  <div className="flex items-center gap-1">
                                    {isPrimary && <span className="text-primary">★</span>}
                                    <span>{s.name}</span>
                                    {isPreferred && !isPrimary && (
                                      <span className="text-xs text-muted-foreground ml-1">(habituelle)</span>
                                    )}
                                  </div>
                                  {s.indicative_price && (
                                    <span className="text-xs text-muted-foreground">
                                      {s.presentation && `${s.presentation} - `}
                                      {s.indicative_price}{s.price_unit || '€/kg'}
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <Label>Titre de l'offre *</Label>
                      <Input
                        placeholder="Ex: Bar de ligne frais du matin"
                        value={offer.title}
                        onChange={(e) => updateOffer(index, 'title', e.target.value)}
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Description (optionnel)</Label>
                      <Textarea
                        placeholder="Ex: Bar de ligne pêché cette nuit, calibre 1-2kg"
                        value={offer.description}
                        onChange={(e) => updateOffer(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>

                    {/* Price & Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prix indicatif à la pièce (€) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={offer.unitPrice}
                          onChange={(e) => updateOffer(index, 'unitPrice', e.target.value)}
                        />
                        {(() => {
                          const selectedSpecies = species?.find(s => s.id === offer.speciesId);
                          return selectedSpecies?.indicative_price ? (
                            <p className="text-xs text-primary">
                              💡 Prix suggéré : {selectedSpecies.indicative_price}{selectedSpecies.price_unit || '€/kg'} 
                              {selectedSpecies.presentation && ` (${selectedSpecies.presentation})`}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Prix ajusté après pesée au moment du retrait
                            </p>
                          );
                        })()}
                      </div>

                      <div className="space-y-2">
                        <Label>Nombre de pièces *</Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="0"
                          value={offer.totalUnits}
                          onChange={(e) => updateOffer(index, 'totalUnits', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Poissons disponibles
                        </p>
                      </div>
                    </div>

                    {/* Photos */}
                    <OfferPhotosUpload
                      photos={offer.photos}
                      onChange={(photos) => updateOffer(index, 'photos', photos)}
                      maxPhotos={5}
                      minPhotos={2}
                    />
                  </CardContent>
                </Card>
              ))
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-14 text-base"
              size="lg"
              onClick={() => navigate('/dashboard/pecheur')}
              disabled={loading}
            >
              <X className="h-5 w-5 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 h-14 text-base font-bold"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Anchor className="h-5 w-5 mr-2" />
                  Créer l'arrivage
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateArrivage;
