import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PanierSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Clear any cart data from sessionStorage
    sessionStorage.removeItem('cartData');
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 container px-4 py-12 max-w-2xl mx-auto">
        <Card className="border-2 border-green-500/20">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-foreground">
              Commande confirmée !
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-lg text-foreground">
                Votre commande a bien été enregistrée
              </p>
              <p className="text-muted-foreground">
                Vous recevrez un email de confirmation avec tous les détails de votre panier.
              </p>
              {sessionId && (
                <p className="text-xs text-muted-foreground font-mono mt-4">
                  Référence: {sessionId.slice(-12)}
                </p>
              )}
            </div>

            <div className="pt-6 border-t space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold flex items-center justify-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Prochaines étapes
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>📧 Consultez votre email pour les détails du retrait</li>
                  <li>📍 Présentez-vous au point de vente indiqué</li>
                  <li>🐟 Profitez de votre poisson frais du jour</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
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
