import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Home } from 'lucide-react';
import Header from '@/components/Header';

const PecheurPaymentSuccess = () => {
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
            <CardTitle className="text-3xl">Paiement confirmé !</CardTitle>
            <CardDescription className="text-lg">
              Votre paiement de 150€ a été traité avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Vous pouvez maintenant compléter votre profil pêcheur et commencer à publier vos arrivages sur QuaiDirect.
            </p>
            <Button onClick={() => navigate('/pecheur/onboarding')} size="lg" className="w-full">
              Commencer le formulaire d'inscription
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PecheurPaymentSuccess;
