import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Home, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const PecheurPaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'confirmed' | 'timeout'>('checking');
  const [pollingAttempts, setPollingAttempts] = useState(0);
  
  const plan = searchParams.get('plan') || 'basic';
  const amount = plan === 'pro' ? '199€' : '150€';

  useEffect(() => {
    if (!user) return;

    const checkPaymentStatus = async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('status, plan')
        .eq('user_id', user.id)
        .in('plan', ['fisherman_basic', 'fisherman_pro'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data?.status === 'active') {
        setPaymentStatus('confirmed');
        return true;
      }
      return false;
    };

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
              Votre paiement de <strong>{amount}</strong> a été traité avec succès
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="font-medium text-blue-900">🎁 Période d'essai de 30 jours</p>
              <p className="text-sm text-blue-700 mt-1">
                Vous ne serez pas débité pendant les 30 premiers jours. 
                Profitez-en pour tester toutes les fonctionnalités !
              </p>
            </div>
            
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
