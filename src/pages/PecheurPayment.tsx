import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Store, Zap, Brain, ArrowLeft, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import { isWhitelistedFisher } from '@/config/fisherWhitelist';

const PecheurPayment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  useEffect(() => {
    if (user && isWhitelistedFisher(user.email, user.id)) {
      setIsWhitelisted(true);
    }
  }, [user]);

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
          <h1 className="text-4xl font-bold mb-4">Vendez votre pêche en direct, sans intermédiaire</h1>
          <p className="text-xl text-muted-foreground">
            Rejoignez les marins pêcheurs qui ont choisi l'autonomie et la rentabilité
          </p>
        </div>

        {/* Whitelist Badge */}
        {isWhitelisted && (
          <Card className="mb-8 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-3">
                <Crown className="h-6 w-6 text-amber-600" />
                <div className="text-center">
                  <Badge className="bg-amber-500 text-white mb-2">Compte Partenaire</Badge>
                  <p className="text-sm text-amber-900">
                    Vous bénéficiez d'un accès gratuit à QuaiDirect. Cliquez ci-dessous pour accéder à l'onboarding.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/pecheur/onboarding')}
                className="w-full mt-4 bg-amber-600 hover:bg-amber-700"
              >
                Accéder à mon compte
              </Button>
            </CardContent>
          </Card>
        )}

        {!isWhitelisted && (

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Accès Complet Pêcheur Professionnel — 150€/an</CardTitle>
            <CardDescription>
              Tout ce dont vous avez besoin pour vendre votre pêche en direct : vitrine professionnelle, gestion ultra-rapide des arrivages, communication illimitée (emails + SMS) et intelligence artificielle pour optimiser vos ventes. Abonnement annuel renouvelable.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-md">
              <p className="font-semibold text-blue-900 mb-2">
                💰 Ce que vous économisez avec QuaiDirect
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Plus de commission intermédiaire (vendez 100% de votre marge)</li>
                <li>✓ Plus de temps perdu en coups de fil (emails/SMS automatiques)</li>
                <li>✓ Plus de papier à gérer (tout est digitalisé)</li>
                <li>✓ Accès complet renouvelable pour 150€/an</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-lg">📧 Emails illimités + SMS inclus</p>
                  <p className="text-sm text-muted-foreground">
                    Prévenez instantanément tous vos clients (restaurateurs, poissonniers, particuliers) de vos arrivages par email ET SMS. Aucune limite d'envoi. L'IA QuaiDirect optimise vos messages pour maximiser vos ventes.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Store className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-lg">🏪 Votre vitrine en ligne professionnelle</p>
                  <p className="text-sm text-muted-foreground">
                    Une page dédiée à votre bateau, visible 24h/24 : présentez vos méthodes de pêche, vos espèces, vos points de vente. Partagez-la sur Facebook, Instagram ou par SMS. Vos clients vous retrouvent en un clic.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-lg">⚡ Créez un arrivage en 2 minutes chrono</p>
                  <p className="text-sm text-muted-foreground">
                    Plus de temps perdu à gérer du papier ou à passer des coups de fil. Publiez votre arrivage en 3 clics, l'app envoie automatiquement emails et SMS à tous vos contacts. Vous gérez tout depuis votre téléphone, même à 2h du matin sur le quai.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-lg">🤝 Constituez votre carnet client pro + IA ciblée</p>
                  <p className="text-sm text-muted-foreground">
                    Importez et gérez votre base de restaurateurs, poissonniers et grossistes. L'intelligence artificielle QuaiDirect vous suggère qui prévenir en priorité selon vos espèces disponibles. Vendez mieux, plus vite, sans effort.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t space-y-3">
              <Button
                onClick={handlePayment}
                disabled={loading}
                size="lg"
                className="w-full text-lg h-14 font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {loading ? 'Préparation du paiement...' : '🚀 Payer 150€ et démarrer maintenant'}
              </Button>
              <div className="text-xs text-center text-muted-foreground px-4 space-y-2">
                <p>
                  ✅ Inclus dans votre abonnement annuel : emails illimités, SMS sans limite mensuelle, intelligence artificielle de ciblage client, support prioritaire et toutes les futures mises à jour gratuites.
                </p>
                <p className="font-semibold text-orange-600">
                  ⏰ Offre limitée aux 10 premiers inscrits : accès Ambassadeur Partenaire (statut privilégié)
                </p>
              </div>
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
        )}
      </div>
    </div>
  );
};

export default PecheurPayment;
