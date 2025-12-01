import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Store, Zap, Brain, ArrowLeft, Crown, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';

const PLANS = {
  basic: {
    name: "Pêcheur Basic",
    price: "150€",
    priceId: "price_1SZYAXH0VhS1yyE0FqJ0imbu",
    period: "par an",
    trial: "🎁 1 mois offert",
    features: [
      "Fiche pêcheur + points de vente",
      "Emails illimités aux clients",
      "Partage WhatsApp depuis votre téléphone",
      "IA : textes, descriptions, messages types",
      "Base clients simple",
    ],
  },
  pro: {
    name: "Pêcheur Pro",
    price: "199€",
    priceId: "price_1SYgOuH0VhS1yyE0XINPVQdm",
    period: "par an",
    badge: "Recommandé",
    trial: "🎁 1 mois offert",
    features: [
      "Tout le plan Basic inclus",
      "IA avancée : prix, mise en avant, météo/marée",
      "Multi-points de vente",
      "Statistiques : CA estimé, clients touchés",
      "Priorité support",
    ],
  },
};

const PecheurPayment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  useEffect(() => {
    const checkWhitelist = async () => {
      if (!user?.email) return;
      
      const { data } = await supabase
        .from('fisherman_whitelist')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();
      
      setIsWhitelisted(!!data);
    };
    
    checkWhitelist();
  }, [user]);

  const handlePayment = async (priceId: string, planType: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(planType);
    try {
      const { data, error } = await supabase.functions.invoke('create-fisherman-payment', {
        body: { priceId, planType },
      });

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
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />
      
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
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
          <>
            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-5xl mx-auto">
              {/* Basic Plan */}
              <Card className="relative hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{PLANS.basic.name}</span>
                  </CardTitle>
                  <CardDescription>Pour démarrer la vente en direct</CardDescription>
                  {PLANS.basic.trial && (
                    <Badge className="bg-green-500 text-white mt-2 w-fit">
                      {PLANS.basic.trial}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{PLANS.basic.price}</span>
                      <span className="text-muted-foreground">/{PLANS.basic.period}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      puis {PLANS.basic.price}/{PLANS.basic.period}
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {PLANS.basic.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePayment(PLANS.basic.priceId, 'basic')}
                    disabled={loading === 'basic'}
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    {loading === 'basic' ? 'Chargement...' : 'Démarrer l\'essai gratuit'}
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="relative border-primary shadow-lg hover:shadow-xl transition-shadow">
                {PLANS.pro.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    {PLANS.pro.badge}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{PLANS.pro.name}</span>
                    <Crown className="h-5 w-5 text-primary" />
                  </CardTitle>
                  <CardDescription>Pour maximiser vos ventes</CardDescription>
                  {PLANS.pro.trial && (
                    <Badge className="bg-green-500 text-white mt-2 w-fit">
                      {PLANS.pro.trial}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{PLANS.pro.price}</span>
                      <span className="text-muted-foreground">/{PLANS.pro.period}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      puis {PLANS.pro.price}/{PLANS.pro.period}
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {PLANS.pro.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePayment(PLANS.pro.priceId, 'pro')}
                    disabled={loading === 'pro'}
                    size="lg"
                    className="w-full"
                  >
                    {loading === 'pro' ? 'Chargement...' : 'Démarrer l\'essai gratuit'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Trial Info Card */}
            <Card className="mb-8 max-w-5xl mx-auto bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900 mb-2">
                      🎁 Profitez de 1 mois d'essai gratuit
                    </p>
                    <p className="text-sm text-green-800">
                      Votre carte bancaire sera vérifiée mais <strong>pas débitée</strong> pendant 30 jours. 
                      Vous pouvez annuler à tout moment avant la fin de l'essai sans frais.
                    </p>
                    <p className="text-sm text-green-800 mt-2">
                      Après 30 jours : facturation automatique selon le plan choisi.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SMS Options Info */}
            <Card className="mb-8 max-w-5xl mx-auto bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-blue-900 mb-2">
                      📧 Emails illimités + WhatsApp inclus
                    </p>
                    <p className="text-sm text-blue-800 mb-2">
                      Prévenez instantanément tous vos clients par email et partagez vos arrivages sur WhatsApp depuis votre téléphone.
                    </p>
                    <p className="text-sm text-blue-800 font-medium">
                      💬 Options SMS disponibles après inscription (packs à partir de 49€ pour 500 SMS)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Value Proposition */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-lg p-6 mb-8 max-w-5xl mx-auto">
              <p className="font-semibold text-primary mb-2">
                💰 Ce que vous économisez avec QuaiDirect
              </p>
              <ul className="text-sm space-y-1">
                <li>✓ Plus de commission intermédiaire (vendez 100% de votre marge)</li>
                <li>✓ Plus de temps perdu en coups de fil (emails/WhatsApp automatiques)</li>
                <li>✓ Plus de papier à gérer (tout est digitalisé)</li>
                <li>✓ IA pour optimiser vos ventes et votre communication</li>
              </ul>
            </div>

            <div className="text-center space-y-3 max-w-5xl mx-auto">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full max-w-md"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'accueil
              </Button>
              <p className="text-xs text-muted-foreground">
                Paiement sécurisé par Stripe
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PecheurPayment;
