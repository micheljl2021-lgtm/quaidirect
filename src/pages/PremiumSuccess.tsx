import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Settings, Home, Loader2, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';

const PremiumSuccess = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'active' | 'pending'>('checking');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 15; // 30 seconds total (2s interval)

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('pending');
        return false;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return false;
      }

      if (data?.subscribed) {
        setStatus('active');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Subscription check failed:', err);
      return false;
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const pollSubscription = async () => {
      const isActive = await checkSubscription();
      
      if (isActive) {
        if (interval) clearInterval(interval);
        // Redirect to premium dashboard after 2s
        setTimeout(() => navigate('/dashboard/premium'), 2000);
      } else if (attempts >= maxAttempts) {
        setStatus('pending');
        if (interval) clearInterval(interval);
      } else {
        setAttempts(prev => prev + 1);
      }
    };

    // Initial check
    pollSubscription();
    
    // Poll every 2 seconds
    interval = setInterval(pollSubscription, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [attempts, navigate]);

  const handleRetry = () => {
    setAttempts(0);
    setStatus('checking');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              {status === 'checking' ? (
                <div className="p-4 rounded-full bg-blue-100">
                  <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
                </div>
              ) : (
                <div className="p-4 rounded-full bg-green-100">
                  <Check className="h-16 w-16 text-green-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-3xl">
              {status === 'checking' ? 'Activation en cours...' : 'Bienvenue dans Premium !'}
            </CardTitle>
            <CardDescription className="text-lg">
              {status === 'checking' 
                ? 'Veuillez patienter pendant que nous vérifions votre paiement'
                : 'Votre abonnement a été confirmé avec succès'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === 'checking' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  ⏳ Vérification du paiement... ({attempts}/{maxAttempts})
                </p>
              </div>
            )}

            {status === 'pending' && (
              <>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    ⚠️ L'activation prend plus de temps que prévu. 
                    Votre paiement a bien été reçu, l'accès sera activé sous peu.
                  </p>
                </div>
                <Button onClick={handleRetry} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Vérifier à nouveau
                </Button>
              </>
            )}

            {status === 'active' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  ✅ Votre abonnement Premium est maintenant actif !
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-muted-foreground">
                {status === 'active' 
                  ? 'Configurez vos préférences pour recevoir des alertes personnalisées sur vos espèces et ports favoris.'
                  : 'Vous allez être redirigé automatiquement vers votre dashboard Premium.'
                }
              </p>
              
              <Button 
                onClick={() => navigate('/premium/reglages')} 
                size="lg" 
                className="w-full"
                disabled={status === 'checking'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurer mes préférences
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard/premium')} 
                size="lg" 
                className="w-full"
                disabled={status === 'checking'}
              >
                <Home className="h-4 w-4 mr-2" />
                Accéder au dashboard Premium
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
