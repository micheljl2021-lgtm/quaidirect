import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Anchor, Users, MapPin, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';

const PecheurPayment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-fisherman-payment');

      if (error) throw error;

      window.open(data.url, '_blank');

      toast({
        title: 'Redirection vers le paiement',
        description: 'Une nouvelle fenêtre s\'est ouverte pour le paiement',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la session de paiement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Devenir Pêcheur sur QuaiDirect</h1>
          <p className="text-xl text-muted-foreground">
            Rejoignez notre plateforme et vendez votre poisson en direct
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Inscription Pêcheur - 150€</CardTitle>
            <CardDescription>
              Paiement unique pour accéder à tous les outils professionnels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Page vitrine personnalisée</p>
                  <p className="text-sm text-muted-foreground">
                    Présentez votre bateau, vos méthodes de pêche et vos espèces
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Anchor className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Gestion des arrivages</p>
                  <p className="text-sm text-muted-foreground">
                    Annoncez vos arrivages et gérez vos ventes en temps réel
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">2 points de vente inclus</p>
                  <p className="text-sm text-muted-foreground">
                    Créez jusqu'à 2 emplacements de vente directe
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Accès clients professionnels</p>
                  <p className="text-sm text-muted-foreground">
                    Connectez-vous avec des restaurateurs et poissonniers
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t space-y-3">
              <Button
                onClick={handlePayment}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? 'Préparation du paiement...' : 'Payer 150€ et commencer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Paiement sécurisé par Stripe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PecheurPayment;
