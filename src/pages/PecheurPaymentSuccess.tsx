import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Home, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PecheurPaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'confirmed' | 'timeout'>('checking');
  const [pollingAttempts, setPollingAttempts] = useState(0);
  
  const plan = searchParams.get('plan') || 'standard';
  const planLabels: Record<string, string> = {
    standard: 'Standard',
    pro: 'Pro',
    elite: 'Elite',
  };
  const planAmounts: Record<string, string> = {
    standard: '150€/an',
    pro: '299€/an',
    elite: '199€/mois',
  };
  const amount = planAmounts[plan] || '150€/an';
  const planLabel = planLabels[plan] || 'Standard';
  const planHasTrial: Record<string, boolean> = {
    standard: false,
    pro: false,
    elite: false,
  };

  const checkPaymentStatus = async () => {
    if (!user) return false;
    
    // Vérifier si le rôle fisherman a été assigné (preuve que le webhook a fonctionné)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'fisherman')
      .maybeSingle();

    if (roleData) {
      setPaymentStatus('confirmed');
      return true;
    }

    // Fallback: vérifier aussi la table payments
    const { data: paymentData } = await supabase
      .from('payments')
      .select('status')
      .eq('user_id', user.id)
      .ilike('plan', 'fisherman_%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentData?.status === 'active' || paymentData?.status === 'trialing') {
      setPaymentStatus('confirmed');
      return true;
    }
    
    return false;
  };

  const handleRetry = () => {
    setPaymentStatus('checking');
    setPollingAttempts(0);
  };

  useEffect(() => {
    if (!user) return;

    // Polling toutes les 2 secondes pendant max 30 secondes
    const pollInterval = setInterval(async () => {
      const isConfirmed = await checkPaymentStatus();
      
      if (isConfirmed) {
        clearInterval(pollInterval);
      } else {
        setPollingAttempts(prev => prev + 1);
        if (pollingAttempts >= 15) { // 15 * 2s = 30s
          clearInterval(pollInterval);
          setPaymentStatus('timeout');
        }
      }
    }, 2000);

    // Vérification initiale
    checkPaymentStatus();

    return () => clearInterval(pollInterval);
  }, [user, pollingAttempts]);

  if (paymentStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <div className="container max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardContent className="py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">Finalisation de votre abonnement...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Nous vérifions votre paiement, cela peut prendre quelques secondes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'timeout') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <Header />
        <div className="container max-w-2xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-orange-100">
                  <AlertCircle className="h-16 w-16 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-3xl">Paiement en cours de traitement</CardTitle>
              <CardDescription className="text-lg">
                Votre paiement de <strong>{amount}</strong> est en cours de traitement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Vérification en cours</AlertTitle>
                <AlertDescription>
                  La confirmation de votre paiement prend plus de temps que prévu. 
                  Cela peut arriver si notre système de paiement est en cours de synchronisation avec Stripe.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left space-y-2">
                <p className="font-medium text-blue-900">📋 Que faire maintenant ?</p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Patientez 2-3 minutes puis réessayez la vérification</li>
                  <li>Vérifiez vos emails pour la confirmation de paiement</li>
                  <li>Si le problème persiste, contactez support@quaidirect.fr</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleRetry} 
                size="lg" 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer la vérification
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
  }

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
              Votre abonnement <strong>{planLabel}</strong> ({amount}) est actif
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {planHasTrial[plan] && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <p className="font-medium text-blue-900">🎁 Période d'essai de 30 jours</p>
                <p className="text-sm text-blue-700 mt-1">
                  Vous ne serez pas débité pendant les 30 premiers jours. 
                  Profitez-en pour tester toutes les fonctionnalités !
                </p>
              </div>
            )}
            
            <p className="text-muted-foreground">
              Complétez votre profil pêcheur en 6 étapes pour activer votre compte et commencer à publier vos arrivages.
            </p>
            
            <Button onClick={() => navigate('/pecheur/onboarding')} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6">
              🚀 Compléter mon profil pêcheur
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
