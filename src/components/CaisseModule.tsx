import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Banknote, Loader2, Shield, Anchor, Fish } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Reservation {
  id: string;
  quantity: number;
  created_at: string;
  user_id: string;
  offer: {
    id: string;
    title: string;
    unit_price: number;
    species: {
      name: string;
      scientific_name: string;
    };
    drop: {
      port: {
        name: string;
        city: string;
      };
      fisherman: {
        boat_name: string;
        boat_registration: string;
      };
    };
  };
}

export default function CaisseModule() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Form states for each reservation
  const [formData, setFormData] = useState<Record<string, {
    finalWeight: string;
    finalPrice: string;
    paidMethod: string;
  }>>({});

  useEffect(() => {
    fetchPendingReservations();
  }, []);

  const fetchPendingReservations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get fisherman ID
      const { data: fisherman } = await supabase
        .from('fishermen')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!fisherman) return;

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch pending reservations
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          quantity,
          created_at,
          user_id,
          offer:offers(
            id,
            title,
            unit_price,
            species:species(name, scientific_name),
            drop:drops!inner(
              fisherman_id,
              port:ports(name, city),
              fisherman:fishermen(boat_name, boat_registration)
            )
          )
        `)
        .eq('status', 'pending')
        .eq('offer.drop.fisherman_id', fisherman.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      setReservations(data || []);
      
      // Initialize form data for each reservation
      const initialFormData: Record<string, any> = {};
      (data || []).forEach((res) => {
        initialFormData[res.id] = {
          finalWeight: res.quantity.toString(),
          finalPrice: res.offer.unit_price.toString(),
          paidMethod: 'cash',
        };
      });
      setFormData(initialFormData);
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReservation = async (reservationId: string) => {
    const data = formData[reservationId];
    
    if (!data.finalWeight || !data.finalPrice || !data.paidMethod) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setProcessingId(reservationId);

    try {
      const { data: result, error } = await supabase.functions.invoke('process-caisse', {
        body: {
          reservationId,
          finalWeightKg: parseFloat(data.finalWeight),
          finalPricePerKg: parseFloat(data.finalPrice),
          paidMethod: data.paidMethod,
        },
      });

      if (error) throw error;

      toast({
        title: "Réservation confirmée !",
        description: result.message || "Reçu envoyé par e-mail.",
      });

      // Remove processed reservation from list
      setReservations(prev => prev.filter(r => r.id !== reservationId));
    } catch (error: any) {
      console.error('Error processing reservation:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter la réservation",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const updateFormData = (reservationId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [reservationId]: {
        ...prev[reservationId],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Aucune réservation en attente pour aujourd'hui
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Réservations du jour</h2>
        <Badge variant="secondary">{reservations.length} en attente</Badge>
      </div>

      <div className="grid gap-4">
        {reservations.map((reservation) => {
          const data = formData[reservation.id] || { finalWeight: '', finalPrice: '', paidMethod: 'cash' };
          const estimatedTotal = (parseFloat(data.finalWeight || '0') * parseFloat(data.finalPrice || '0')).toFixed(2);
          
          // Calculate label data
          const currentDate = new Date().toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          });
          const lotNumber = `${currentDate.replace(/\//g, '')}-${reservation.offer.drop.fisherman.boat_registration.replace(/\s/g, '')}`;
          const faoZone = "27.VIIIa"; // Zone FAO Atlantique - à enrichir depuis la base
          const minSize = 42; // Taille mini réglementaire - à enrichir depuis la base
          const currentSize = parseFloat(data.finalWeight) * 30; // Estimation taille basée sur poids (à ajuster)

          return (
            <Card key={reservation.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{reservation.offer.species.name}</span>
                  <Badge>{reservation.offer.drop.port.name}</Badge>
                </CardTitle>
                <CardDescription>
                  Client: Réservation #{reservation.id.slice(0, 8)} • 
                  Quantité réservée: {reservation.quantity} unité(s)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: Form Inputs */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">Informations de vente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`weight-${reservation.id}`}>Poids final (kg)</Label>
                      <Input
                        id={`weight-${reservation.id}`}
                        type="number"
                        step="0.1"
                        min="0"
                        value={data.finalWeight || ''}
                        onChange={(e) => updateFormData(reservation.id, 'finalWeight', e.target.value)}
                        placeholder="Ex: 1.5"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`price-${reservation.id}`}>Prix final (€/kg)</Label>
                      <Input
                        id={`price-${reservation.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.finalPrice || ''}
                        onChange={(e) => updateFormData(reservation.id, 'finalPrice', e.target.value)}
                        placeholder="Ex: 24.50"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`method-${reservation.id}`}>Mode de paiement</Label>
                      <Select
                        value={data.paidMethod || 'cash'}
                        onValueChange={(value) => updateFormData(reservation.id, 'paidMethod', value)}
                      >
                        <SelectTrigger id={`method-${reservation.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">
                            <div className="flex items-center gap-2">
                              <Banknote className="h-4 w-4" />
                              Espèces
                            </div>
                          </SelectItem>
                          <SelectItem value="card">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Carte Bancaire
                            </div>
                          </SelectItem>
                          <SelectItem value="stripe_terminal">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Stripe Terminal
                            </div>
                          </SelectItem>
                          <SelectItem value="stripe_link">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Lien de paiement Stripe
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  </div>

                  {/* Right: Label Preview */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Aperçu étiquette réglementaire
                    </h3>
                    <Card className="border-2 border-primary/20 bg-primary/5">
                      <CardContent className="pt-4 space-y-3">
                        {/* Species Info */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-foreground">{reservation.offer.species.name}</h4>
                          <p className="text-xs italic text-muted-foreground">{reservation.offer.species.scientific_name || 'N/A'}</p>
                        </div>

                        {/* Key Details */}
                        <div className="grid grid-cols-2 gap-2 py-2 border-y text-xs">
                          <div>
                            <p className="text-muted-foreground">Poids</p>
                            <p className="font-semibold">{data.finalWeight || '-'} kg</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Prix/kg</p>
                            <p className="font-semibold">{data.finalPrice || '-'} €</p>
                          </div>
                        </div>

                        {/* Size Compliance */}
                        {data.finalWeight && (
                          <div className={`p-2 rounded text-xs ${
                            currentSize >= minSize 
                              ? 'bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400' 
                              : 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400'
                          }`}>
                            <p className="font-medium">
                              {currentSize >= minSize 
                                ? `✓ Taille: ${currentSize.toFixed(0)}cm (min: ${minSize}cm)`
                                : `✗ Taille: ${currentSize.toFixed(0)}cm < ${minSize}cm requis`}
                            </p>
                          </div>
                        )}

                        {/* Traceability */}
                        <div className="space-y-2 pt-2 text-xs">
                          <div className="flex items-start gap-2">
                            <Shield className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-muted-foreground">N° de lot</p>
                              <p className="font-mono font-medium text-foreground">{lotNumber}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Fish className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-muted-foreground">Zone FAO</p>
                              <p className="font-medium text-foreground">{faoZone} - {reservation.offer.drop.port.city}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Anchor className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-muted-foreground">Navire</p>
                              <p className="font-medium text-foreground">
                                {reservation.offer.drop.fisherman.boat_name} - {reservation.offer.drop.fisherman.boat_registration}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-2 border-t">
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            Conforme CE 1379/2013 et CE 1169/2011. Produit frais à conserver entre 0°C et +4°C.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-lg font-semibold">
                    Total: {estimatedTotal} €
                  </div>
                  <Button
                    onClick={() => handleProcessReservation(reservation.id)}
                    disabled={processingId === reservation.id}
                  >
                    {processingId === reservation.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmer le retrait
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
