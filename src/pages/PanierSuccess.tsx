import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, Package, MapPin, Calendar, Loader2, Fish } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OrderDetails {
  id: string;
  basket_name: string;
  basket_weight: number | null;
  total_price_cents: number;
  fisherman_name: string | null;
  pickup_location: string | null;
  pickup_time: string | null;
}

const PanierSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any cart data from sessionStorage
    sessionStorage.removeItem('cartData');

    const fetchOrderDetails = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Try to get the most recent basket order for the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: order, error } = await supabase
          .from('basket_orders')
          .select(`
            id,
            total_price_cents,
            pickup_location,
            pickup_time,
            client_baskets(name, weight_kg),
            fishermen(boat_name, company_name),
            drops(sale_start_time, ports(name, city), fisherman_sale_points(label, address))
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching order:', error);
          setLoading(false);
          return;
        }

        if (order) {
          // Determine pickup location
          let location = order.pickup_location;
          if (!location && order.drops?.ports) {
            location = `${order.drops.ports.name} - ${order.drops.ports.city}`;
          } else if (!location && order.drops?.fisherman_sale_points) {
            location = order.drops.fisherman_sale_points.address || order.drops.fisherman_sale_points.label;
          }

          setOrderDetails({
            id: order.id,
            basket_name: order.client_baskets?.name || 'Panier',
            basket_weight: order.client_baskets?.weight_kg || null,
            total_price_cents: order.total_price_cents,
            fisherman_name: order.fishermen?.boat_name || order.fishermen?.company_name || null,
            pickup_location: location || null,
            pickup_time: order.drops?.sale_start_time || order.pickup_time || null,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 container px-4 py-12 max-w-2xl mx-auto">
        <Card className="border-2 border-green-500/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" aria-hidden="true" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">
              Commande confirmée !
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
              </div>
            ) : orderDetails ? (
              <>
                {/* Order Details */}
                <div className="bg-muted/50 rounded-lg p-5 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" aria-hidden="true" />
                    Détails de votre commande
                  </h3>
                  
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Panier</span>
                      <span className="font-medium">{orderDetails.basket_name}</span>
                    </div>
                    
                    {orderDetails.basket_weight && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Poids indicatif</span>
                        <span className="font-medium">~{orderDetails.basket_weight}kg</span>
                      </div>
                    )}
                    
                    {orderDetails.fisherman_name && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pêcheur</span>
                        <span className="font-medium flex items-center gap-1">
                          <Fish className="h-4 w-4" aria-hidden="true" />
                          {orderDetails.fisherman_name}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-muted-foreground">Total payé</span>
                      <span className="font-bold text-lg text-primary">
                        {(orderDetails.total_price_cents / 100).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pickup Information */}
                <div className="bg-primary/5 rounded-lg p-5 space-y-4 border border-primary/20">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                    Retrait de votre commande
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    {orderDetails.pickup_location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{orderDetails.pickup_location}</span>
                      </div>
                    )}
                    
                    {orderDetails.pickup_time && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="font-medium">
                          {format(new Date(orderDetails.pickup_time), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center space-y-2">
                <p className="text-lg text-foreground">
                  Votre commande a bien été enregistrée
                </p>
                <p className="text-muted-foreground">
                  Vous recevrez un email de confirmation avec tous les détails de votre panier.
                </p>
              </div>
            )}

            {sessionId && (
              <p className="text-xs text-muted-foreground font-mono text-center">
                Référence: {sessionId.slice(-12).toUpperCase()}
              </p>
            )}

            <div className="pt-4 border-t space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
                  💡 Conseils
                </h3>
                <ul className="text-sm text-amber-600 dark:text-amber-500 space-y-1">
                  <li>📧 Consultez votre email pour les détails complets</li>
                  <li>📍 Présentez-vous au point de vente à l'heure indiquée</li>
                  <li>🐟 Profitez de votre poisson frais du jour !</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                  Accueil
                </Button>
                <Button
                  onClick={() => navigate('/arrivages')}
                  className="flex-1"
                >
                  Voir les arrivages
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default PanierSuccess;
