import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Check, Loader2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

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
  const [loadingBasket, setLoadingBasket] = useState<string | null>(null);

  // Fetch baskets from database
  const { data: baskets, isLoading } = useQuery({
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

  const handlePurchase = async (basketId: string, basketName: string) => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour commander un panier',
        variant: 'destructive',
      });
      return;
    }

    setLoadingBasket(basketId);
    
    try {
      // Get price_id based on basket name
      let priceId = '';
      if (basketName.includes('Découverte')) priceId = STRIPE_BASKETS.discovery.price_id;
      else if (basketName.includes('Famille')) priceId = STRIPE_BASKETS.family.price_id;
      else if (basketName.includes('Gourmet')) priceId = STRIPE_BASKETS.gourmet.price_id;

      if (!priceId) throw new Error('Panier non configuré');

      const { data, error } = await supabase.functions.invoke('create-basket-checkout', {
        body: { 
          basketId,
          priceId,
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la session de paiement',
        variant: 'destructive',
      });
    } finally {
      setLoadingBasket(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="container px-4 py-8 max-w-6xl mx-auto flex-1">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Paniers de Poisson Frais</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Commandez votre panier de poisson frais auprès de nos pêcheurs locaux
          </p>
        </div>

        {/* Baskets Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Chargement des paniers...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {baskets?.map((basket) => {
              const isPurchasing = loadingBasket === basket.id;
              const isDiscovery = basket.variety_level === 'basic';
              const isGourmet = basket.variety_level === 'premium';

              return (
                <Card 
                  key={basket.id}
                  className={`relative ${
                    isGourmet ? 'border-2 border-primary shadow-lg' : ''
                  }`}
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
                    {/* Price */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {(basket.price_cents / 100).toFixed(0)}€
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        ~{basket.weight_kg}kg de poisson
                      </p>
                    </div>

                    {/* Features */}
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
                          Retrait à quai selon arrivages
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          Fraîcheur garantie
                        </p>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={`w-full gap-2 ${isGourmet ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' : ''}`}
                      onClick={() => handlePurchase(basket.id, basket.name)}
                      disabled={isPurchasing}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Commander
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
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
              <p>Choisissez votre panier selon vos besoins</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-xs">
                2
              </div>
              <p>Sélectionnez le pêcheur et l'arrivage qui vous conviennent</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold text-xs">
                3
              </div>
              <p>Retirez votre panier au port selon l'horaire convenu</p>
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
