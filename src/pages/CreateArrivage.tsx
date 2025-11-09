import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Plus, Trash2, Anchor, MapPin, Calendar, Clock, Fish } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Offer {
  speciesId: string;
  title: string;
  description: string;
  unitPrice: string;
  totalUnits: string;
}

const CreateArrivage = () => {
  const { user, userRole, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form state
  const [portId, setPortId] = useState('');
  const [etaDate, setEtaDate] = useState('');
  const [etaTime, setEtaTime] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [saleTime, setSaleTime] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [notes, setNotes] = useState('');
  const [offers, setOffers] = useState<Offer[]>([
    { speciesId: '', title: '', description: '', unitPrice: '', totalUnits: '' }
  ]);

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

  // Fetch species
  const { data: species } = useQuery({
    queryKey: ['species'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('species')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const addOffer = () => {
    setOffers([...offers, { speciesId: '', title: '', description: '', unitPrice: '', totalUnits: '' }]);
  };

  const removeOffer = (index: number) => {
    if (offers.length > 1) {
      setOffers(offers.filter((_, i) => i !== index));
    }
  };

  const updateOffer = (index: number, field: keyof Offer, value: string) => {
    const newOffers = [...offers];
    newOffers[index][field] = value;
    setOffers(newOffers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!portId || !etaDate || !etaTime || !saleDate || !saleTime) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir tous les champs obligatoires',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const validOffers = offers.filter(o => o.speciesId && o.title && o.unitPrice && o.totalUnits);
      if (validOffers.length === 0) {
        toast({
          title: 'Erreur',
          description: 'Veuillez ajouter au moins une offre complète',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Get fisherman ID
      const { data: fisherman, error: fishermanError } = await supabase
        .from('fishermen')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (fishermanError) throw fishermanError;

      // Create ETA datetime (heure de débarquement)
      const etaAt = new Date(`${etaDate}T${etaTime}`);
      // Create sale start time (heure de mise en vente)
      const saleStartTime = new Date(`${saleDate}T${saleTime}`);
      const visibleAt = new Date(saleStartTime.getTime() - (isPremium ? 2 : 1) * 60 * 60 * 1000); // 2h before for premium, 1h for regular
      const publicVisibleAt = isPremium ? new Date(visibleAt.getTime() + 30 * 60 * 1000) : null; // 30 min after visible_at

      // Create arrivage
      const { data: arrivage, error: arrivageError } = await supabase
        .from('drops')
        .insert({
          fisherman_id: fisherman.id,
          port_id: portId,
          eta_at: etaAt.toISOString(),
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

      // Create offers
      const offersToInsert = validOffers.map(offer => ({
        drop_id: arrivage.id,
        species_id: offer.speciesId,
        title: offer.title,
        description: offer.description || null,
        unit_price: parseFloat(offer.unitPrice),
        total_units: parseInt(offer.totalUnits),
        available_units: parseInt(offer.totalUnits),
      }));

      const { error: offersError } = await supabase
        .from('offers')
        .insert(offersToInsert);

      if (offersError) throw offersError;

      toast({
        title: '✅ Arrivage créé !',
        description: 'Votre arrivage a été publié avec succès',
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
        {/* Header */}
          <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Anchor className="h-6 w-6 text-primary" />
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

              {/* ETA (Débarquement) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Anchor className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-medium">Heure de débarquement</Label>
                </div>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="eta-date">Date *</Label>
                    <Input
                      id="eta-date"
                      type="date"
                      value={etaDate}
                      onChange={(e) => setEtaDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eta-time">Heure *</Label>
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

          {/* Offers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Fish className="h-5 w-5" />
                    Offres de poisson
                  </CardTitle>
                  <CardDescription>
                    Ajoutez les espèces disponibles et leurs prix
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addOffer}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {offers.map((offer, index) => (
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
                          {species?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
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
                        <p className="text-xs text-muted-foreground">
                          Prix ajusté après pesée au moment du retrait
                        </p>
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
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/dashboard/pecheur')}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer l\'arrivage'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateArrivage;
