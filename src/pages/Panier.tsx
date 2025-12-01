import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check, Loader2, Package, Anchor, MapPin, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STRIPE_BASKETS = {
  discovery: {
    product_id: 'prod_TVF3Li2lRYygck',
    price_id: 'price_1SYEYvH0VhS1yyE0l4DkD2PG',
  },
  family: {
    product_id: 'prod_TVF3UdUvUwNH7w',
    price_id: 'price_1SYEZ9H0VhS1yyE0OFQzbTZG',
  },
  gourmet: {
    product_id: 'prod_TVF3f5DQgEijf2',
    price_id: 'price_1SYEZJH0VhS1yyE04442C45I',
  },
};

const Panier = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFisherman, setSelectedFisherman] = useState<any>(null);
  const [selectedDrop, setSelectedDrop] = useState<any>(null);
  const [selectedBasket, setSelectedBasket] = useState<any>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Fetch baskets from database
  const { data: baskets, isLoading: basketsLoading } = useQuery({
    queryKey: ['client-baskets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_baskets')
        .select('*')
        .eq('is_active', true)
        .order('price_cents');

      if (error) throw error;
      return data;
    },
  });

  // Fetch available drops with fishermen and port info
  const { data: drops, isLoading: dropsLoading } = useQuery({
    queryKey: ['available-drops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          *,
          fishermen!inner(id, boat_name, company_name, slug),
          ports(id, name, city),
          fisherman_sale_points(id, label, address)
        `)
        .in('status', ['scheduled', 'landed'])
        .gte('sale_start_time', new Date().toISOString())
        .order('sale_start_time', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Group drops by fisherman
  const fishermenWithDrops = drops?.reduce((acc: any, drop: any) => {
    const fishermanId = drop.fishermen.id;
    if (!acc[fishermanId]) {
      acc[fishermanId] = {
        fisherman: drop.fishermen,
        drops: []
      };
    }
    acc[fishermanId].drops.push(drop);
    return acc;
  }, {});

  const handleSelectFisherman = (fishermanData: any) => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour commander un panier',
        variant: 'destructive',
      });
      return;
    }
    setSelectedFisherman(fishermanData);
    setCurrentStep(2);
  };

  const handleSelectDrop = (drop: any) => {
    setSelectedDrop(drop);
    setCurrentStep(3);
  };

  const handleSelectBasket = (basket: any) => {
    setSelectedBasket(basket);
    setCurrentStep(4);
  };

  const handlePurchase = async () => {
    if (!selectedBasket || !selectedDrop) return;
    
    setLoadingCheckout(true);
    
    try {
      // Get price_id based on basket name
      let priceId = '';
      if (selectedBasket.variety_level === 'basic') priceId = STRIPE_BASKETS.discovery.price_id;
      else if (selectedBasket.variety_level === 'varied') priceId = STRIPE_BASKETS.family.price_id;
      else if (selectedBasket.variety_level === 'premium') priceId = STRIPE_BASKETS.gourmet.price_id;

      if (!priceId) throw new Error('Panier non configuré');

      const { data, error } = await supabase.functions.invoke('create-basket-checkout', {
        body: { 
          basketId: selectedBasket.id,
          priceId,
          fishermanId: selectedDrop.fishermen.id,
          dropId: selectedDrop.id,
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la session de paiement',
        variant: 'destructive',
      });
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setSelectedFisherman(null);
    setSelectedDrop(null);
    setSelectedBasket(null);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setSelectedFisherman(null);
    } else if (currentStep === 3) {
      setCurrentStep(2);
      setSelectedDrop(null);
    } else if (currentStep === 4) {
      setCurrentStep(3);
      setSelectedBasket(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* How it works section */}
      <div className="bg-gradient-ocean text-white py-12">
        <div className="container px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-lg">Choisissez votre port</h3>
              <p className="text-white/90 text-sm">Sélectionnez le point de vente le plus proche de chez vous</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-lg">Choisissez un panier</h3>
              <p className="text-white/90 text-sm">Découverte, Famille, Grillade ou Surprise du pêcheur</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-lg">Le pêcheur ajuste</h3>
              <p className="text-white/90 text-sm">Composition adaptée selon la pêche du jour</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto text-2xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-lg">Récupérez en direct</h3>
              <p className="text-white/90 text-sm">Retirez votre commande au point de vente</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-12 max-w-6xl mx-auto">
        {/* Header already in "How it works" above */}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Paniers de Poisson Frais</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Commandez votre panier en 4 étapes simples
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[
              { num: 1, label: 'Pêcheur' },
              { num: 2, label: 'Arrivage' },
              { num: 3, label: 'Panier' },
              { num: 4, label: 'Confirmer' },
            ].map((step, index) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep >= step.num
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {currentStep > step.num ? <Check className="h-5 w-5" /> : step.num}
                  </div>
                  <span className="text-xs mt-2 font-medium text-center">{step.label}</span>
                </div>
                {index < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded transition-all ${
                      currentStep > step.num ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        {currentStep > 1 && (
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        )}

        {/* Step 1: Select Fisherman */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Choisissez votre pêcheur</h2>
            {dropsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Chargement des pêcheurs...</p>
              </div>
            ) : fishermenWithDrops && Object.keys(fishermenWithDrops).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(fishermenWithDrops).map((fishermanData: any) => (
                  <Card
                    key={fishermanData.fisherman.id}
                    className="hover:border-primary cursor-pointer transition-all hover:shadow-lg"
                    onClick={() => handleSelectFisherman(fishermanData)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Anchor className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                          {fishermanData.fisherman.boat_name || fishermanData.fisherman.company_name}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        {fishermanData.drops.length} arrivage{fishermanData.drops.length > 1 ? 's' : ''} disponible{fishermanData.drops.length > 1 ? 's' : ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full gap-2">
                        Sélectionner
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Aucun pêcheur disponible pour le moment</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Select Drop */}
        {currentStep === 2 && selectedFisherman && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Choisissez l'horaire de retrait</h2>
            <p className="text-muted-foreground mb-4">
              Pêcheur : <strong>{selectedFisherman.fisherman.boat_name || selectedFisherman.fisherman.company_name}</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedFisherman.drops.map((drop: any) => (
                <Card
                  key={drop.id}
                  className="hover:border-primary cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => handleSelectDrop(drop)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">
                          {drop.ports 
                            ? `${drop.ports.name} - ${drop.ports.city}` 
                            : drop.fisherman_sale_points?.label || 'Point de vente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(drop.sale_start_time), "EEEE d MMMM 'à' HH:mm", { locale: fr })}</span>
                      </div>
                      <Button className="w-full gap-2 mt-4">
                        Sélectionner
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Basket */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Choisissez votre panier</h2>
            <p className="text-muted-foreground mb-4">
              Retrait : <strong>
                {selectedDrop?.ports 
                  ? selectedDrop.ports.name 
                  : selectedDrop?.fisherman_sale_points?.label}
              </strong> le{' '}
              <strong>{format(new Date(selectedDrop?.sale_start_time), "d MMMM 'à' HH:mm", { locale: fr })}</strong>
            </p>
            {basketsLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Chargement des paniers...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {baskets?.map((basket) => {
                  const isGourmet = basket.variety_level === 'premium';
                  const isDiscovery = basket.variety_level === 'basic';

                  return (
                    <Card
                      key={basket.id}
                      className={`relative hover:shadow-lg transition-all cursor-pointer ${
                        isGourmet ? 'border-2 border-primary' : ''
                      } ${selectedBasket?.id === basket.id ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => handleSelectBasket(basket)}
                    >
                      {isGourmet && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="gap-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                            ⭐ Le Plus Populaire
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                          <Package className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">{basket.name}</CardTitle>
                        <CardDescription className="min-h-[40px]">
                          {basket.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary">
                            {(basket.price_cents / 100).toFixed(0)}€
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            ~{basket.weight_kg}kg de poisson
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              {isDiscovery && '2-3 espèces locales'}
                              {basket.variety_level === 'varied' && '4-5 espèces variées'}
                              {isGourmet && 'Espèces premium sélectionnées'}
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              Pêche locale & responsable
                            </p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground">
                              Fraîcheur garantie
                            </p>
                          </div>
                        </div>

                        <Button
                          className={`w-full gap-2 ${isGourmet ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' : ''}`}
                        >
                          Sélectionner
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirm */}
        {currentStep === 4 && selectedBasket && selectedDrop && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Confirmez votre commande</h2>
            <div className="max-w-2xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-start pb-3 border-b">
                    <div>
                      <p className="font-medium">Pêcheur</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFisherman.fisherman.boat_name || selectedFisherman.fisherman.company_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start pb-3 border-b">
                    <div>
                      <p className="font-medium">Retrait</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDrop.ports.name} - {selectedDrop.ports.city}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedDrop.sale_start_time), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-start pb-3 border-b">
                    <div>
                      <p className="font-medium">Panier</p>
                      <p className="text-sm text-muted-foreground">{selectedBasket.name}</p>
                      <p className="text-sm text-muted-foreground">~{selectedBasket.weight_kg}kg</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <p className="text-xl font-bold">Total</p>
                    <p className="text-3xl font-bold text-primary">
                      {(selectedBasket.price_cents / 100).toFixed(0)}€
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handlePurchase} disabled={loadingCheckout} className="flex-1 gap-2">
                  {loadingCheckout ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Procéder au paiement
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-xs">
                1
              </div>
              <p>Sélectionnez le pêcheur de votre choix parmi ceux disponibles</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-xs">
                2
              </div>
              <p>Choisissez l'horaire de retrait selon l'arrivage du pêcheur</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-xs">
                3
              </div>
              <p>Sélectionnez votre panier selon vos besoins (Découverte, Famille ou Gourmet)</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-xs">
                4
              </div>
              <p>Confirmez et payez en ligne, puis retirez votre panier au port</p>
            </div>
            <p className="pt-4 border-t text-xs">
              * Les paniers sont génériques. La composition exacte dépend des arrivages disponibles 
              et des espèces du jour proposées par les pêcheurs. Poids indicatif ajusté à la pesée.
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Panier;
