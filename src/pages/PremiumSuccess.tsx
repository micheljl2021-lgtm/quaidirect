import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Crown, Loader2, Mail, ArrowRight, RefreshCw, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PremiumSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'checking' | 'active' | 'pending' | 'guest'>('checking');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 15;

  const isGuest = searchParams.get('guest') === 'true';

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!error && data?.subscribed) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // If guest checkout and no user logged in, show guest message
    if (isGuest && !user) {
      setStatus('guest');
      return;
    }

    // If user is logged in, poll for subscription
    let interval: ReturnType<typeof setInterval>;

    const pollSubscription = async () => {
      const isActive = await checkSubscription();
      
      if (isActive) {
        setStatus('active');
        if (interval) clearInterval(interval);
        // Redirect after 2s
        setTimeout(() => navigate('/dashboard/premium'), 2000);
      } else if (attempts >= maxAttempts) {
        setStatus('pending');
        if (interval) clearInterval(interval);
      } else {
        setAttempts(prev => prev + 1);
      }
    };

    pollSubscription();
    interval = setInterval(pollSubscription, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, attempts, isGuest, navigate]);

  const handleRetry = () => {
    setAttempts(0);
    setStatus('checking');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Header />
      
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center">
          <CardHeader>
            {status === 'checking' && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <CardTitle className="text-2xl">Activation en cours...</CardTitle>
                <CardDescription>
                  Vérification de votre paiement ({attempts}/{maxAttempts})
                </CardDescription>
              </>
            )}

            {status === 'active' && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600">
                  🎉 Bienvenue dans Premium !
                </CardTitle>
                <CardDescription>
                  Votre abonnement est maintenant actif
                </CardDescription>
              </>
            )}

            {status === 'pending' && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl">Paiement reçu</CardTitle>
                <CardDescription>
                  L'activation prend plus de temps que prévu. Votre accès sera activé sous peu.
                </CardDescription>
              </>
            )}

            {status === 'guest' && (
              <>
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-600">
                  🎉 Paiement confirmé !
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Votre compte QuaiDirect a été créé automatiquement
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {status === 'guest' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5" />
                  Vérifiez vos emails
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Un email vous a été envoyé avec un lien pour définir votre mot de passe et accéder à votre espace Premium.
                </p>
                <p className="text-sm text-blue-700">
                  Pensez à vérifier vos spams si vous ne le trouvez pas.
                </p>
              </div>
            )}

            {status === 'checking' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  ⏳ Vérification du paiement...
                </p>
              </div>
            )}

            {status === 'pending' && (
              <Button onClick={handleRetry} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Vérifier à nouveau
              </Button>
            )}

            {status === 'active' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  ✅ Votre abonnement Premium est maintenant actif !
                </p>
              </div>
            )}

            {/* Avantages Premium */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Vos avantages Premium :</h3>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Accès anticipé 30 min aux arrivages
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Notifications email personnalisées
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Badge Premium dans votre profil
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Choix d'un pêcheur favori à soutenir
                </li>
              </ul>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-3 pt-4">
              {status === 'guest' ? (
                <>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate('/auth')}
                  >
                    Se connecter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => navigate('/arrivages')} 
                    variant="outline"
                    className="w-full"
                  >
                    Voir les arrivages
                  </Button>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumSuccess;