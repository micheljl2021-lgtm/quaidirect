import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Settings, Home } from 'lucide-react';
import Header from '@/components/Header';

const PremiumSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-green-100">
                <Check className="h-16 w-16 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-3xl">Bienvenue dans Premium !</CardTitle>
            <CardDescription className="text-lg">
              Votre abonnement a été confirmé avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                ✨ Votre période d'essai de 7 jours commence maintenant
              </p>
              <p className="text-sm font-medium">
                Profitez de toutes les fonctionnalités Premium sans engagement
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                Configurez vos préférences pour recevoir des alertes personnalisées sur vos espèces et ports favoris.
              </p>
              
              <Button 
                onClick={() => navigate('/premium/reglages')} 
                size="lg" 
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurer mes préférences
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/')} 
                size="lg" 
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Vos avantages Premium :</h3>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Alertes sur vos espèces favorites
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Notifications prioritaires pour les nouveaux points de vente
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Support des pêcheurs artisanaux français
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Badge Premium dans votre profil
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumSuccess;
