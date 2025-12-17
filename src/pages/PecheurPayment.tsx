import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare, ArrowLeft, Crown, Check, Gift, Zap, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import { FISHERMAN_PLANS, SMS_PACKS, AFFILIATE_CREDITS_RULES } from '@/config/pricing';

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
            <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-6xl mx-auto">
              {/* Standard Plan */}
              <Card className="relative hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{FISHERMAN_PLANS.STANDARD.name}</span>
                  </CardTitle>
                  <CardDescription>{FISHERMAN_PLANS.STANDARD.positioning}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{FISHERMAN_PLANS.STANDARD.priceCents / 100}€</span>
                      <span className="text-muted-foreground">/an</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      soit {(FISHERMAN_PLANS.STANDARD.priceMonthlyEquivalent / 100).toFixed(2)}€/mois
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">CRM simple ({FISHERMAN_PLANS.STANDARD.crmContacts} contacts)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">📱 {FISHERMAN_PLANS.STANDARD.smsQuotaMonthly} SMS/mois</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-primary">🎁 {FISHERMAN_PLANS.STANDARD.openingBonusSms} SMS bonus à l'ouverture</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">IA basique (textes, descriptions)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{FISHERMAN_PLANS.STANDARD.salePoints} point de vente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Stats light</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">📧 Emails illimités</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => handlePayment(FISHERMAN_PLANS.STANDARD.stripePriceId, 'standard')}
                    disabled={loading === 'standard'}
                    size="lg"
                    variant="outline"
                    className="w-full"
                  >
                    {loading === 'standard' ? 'Chargement...' : 'Commencer'}
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan - Recommandé */}
              <Card className="relative border-primary shadow-lg hover:shadow-xl transition-shadow">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Recommandé
                </Badge>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{FISHERMAN_PLANS.PRO.name}</span>
                    <Crown className="h-5 w-5 text-primary" />
                  </CardTitle>
                  <CardDescription>{FISHERMAN_PLANS.PRO.positioning}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{FISHERMAN_PLANS.PRO.priceCents / 100}€</span>
                      <span className="text-muted-foreground">/an</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      soit {(FISHERMAN_PLANS.PRO.priceMonthlyEquivalent / 100).toFixed(2)}€/mois
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">CRM avancé ({FISHERMAN_PLANS.PRO.crmContacts} contacts + tags)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">📱 {FISHERMAN_PLANS.PRO.smsQuotaMonthly} SMS/mois</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-primary">🎁 {FISHERMAN_PLANS.PRO.openingBonusSms} SMS bonus à l'ouverture</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">IA Marine + météo + templates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{FISHERMAN_PLANS.PRO.salePoints} points de vente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Stats campagnes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Packs SMS moins chers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">Crédits affiliation illimités</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => handlePayment(FISHERMAN_PLANS.PRO.stripePriceId, 'pro')}
                    disabled={loading === 'pro'}
                    size="lg"
                    className="w-full"
                  >
                    {loading === 'pro' ? 'Chargement...' : 'Commencer'}
                  </Button>
                </CardContent>
              </Card>

              {/* Elite Plan */}
              <Card className="relative hover:shadow-lg transition-shadow border-2">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600">
                  Gros débit
                </Badge>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{FISHERMAN_PLANS.ELITE.name}</span>
                    <Zap className="h-5 w-5 text-purple-600" />
                  </CardTitle>
                  <CardDescription>{FISHERMAN_PLANS.ELITE.positioning}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{FISHERMAN_PLANS.ELITE.priceCents / 100}€</span>
                      <span className="text-muted-foreground">/mois</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Facturation mensuelle
                    </p>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">CRM complet ({FISHERMAN_PLANS.ELITE.crmContacts.toLocaleString()} contacts)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">📱 {FISHERMAN_PLANS.ELITE.smsQuotaMonthly} SMS/mois inclus</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">SMS illimités ({(FISHERMAN_PLANS.ELITE.overagePricePerSmsCents / 100).toFixed(2)}€/SMS au-delà)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">IA complète + "photo → annonce"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{FISHERMAN_PLANS.ELITE.salePoints} points de vente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Dashboard avancé</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">Sender pro / numéro vérifié</span>
                    </li>
                  </ul>

                  <Button
                    onClick={() => handlePayment(FISHERMAN_PLANS.ELITE.stripePriceId, 'elite')}
                    disabled={loading === 'elite'}
                    size="lg"
                    className="w-full"
                    variant="default"
                  >
                    {loading === 'elite' ? 'Chargement...' : 'Commencer'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Pourquoi PRO plutôt que Standard ? */}
            <Card className="mb-8 max-w-6xl mx-auto border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-primary mb-3">
                      💡 Pourquoi choisir PRO plutôt que Standard ?
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium mb-1">Meilleur prix SMS</p>
                        <p className="text-muted-foreground">Pack 1000 SMS : 65€ (vs 75€ en Standard)</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Bonus 5x plus important</p>
                        <p className="text-muted-foreground">1000 SMS bonus (vs 200 en Standard)</p>
                      </div>
                      <div>
                        <p className="font-medium mb-1">Affiliation illimitée</p>
                        <p className="text-muted-foreground">Vos clients Premium financent vos SMS sans limite</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Affiliation : vos clients financent vos SMS */}
            <Card className="mb-8 max-w-6xl mx-auto border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900 mb-3">
                      🤝 Vos clients Premium financent vos SMS
                    </p>
                    <div className="text-sm text-green-800 space-y-2">
                      <p>Chaque client qui prend <strong>Premium (25€/an)</strong> via votre lien = <strong>~{AFFILIATE_CREDITS_RULES.calculateSmsCredits(800)} SMS crédités</strong></p>
                      <p>Chaque client qui prend <strong>Premium+ (40€/an)</strong> via votre lien = <strong>~{AFFILIATE_CREDITS_RULES.calculateSmsCredits(1800)} SMS crédités</strong></p>
                      <p className="font-medium pt-2">
                        💰 À 5% de conversion sur 1300 contacts = ~1100 SMS/mois financés par vos clients !
                      </p>
                      <p className="text-xs text-green-700 pt-2">
                        ⚠️ Standard : max {FISHERMAN_PLANS.STANDARD.affiliateSmsCapMonthly} SMS/mois via affiliation • Pro/Elite : illimité
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Programme de Parrainage */}
            <Card className="mb-8 max-w-6xl mx-auto border-2 border-dashed border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-foreground mb-2">🎁 Programme de Parrainage</h3>
                    <p className="text-muted-foreground mb-3">
                      Parrainez un collègue pêcheur et recevez <span className="font-semibold text-primary">{AFFILIATE_CREDITS_RULES.REFERRAL_BONUS_SMS} SMS bonus</span> chacun !
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Challenges à venir */}
            <Card className="mb-8 max-w-6xl mx-auto border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Gift className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-2">
                      🏆 Challenges & Récompenses (bientôt)
                    </p>
                    <div className="text-sm text-amber-800 space-y-1">
                      <p>• 5 Premium via ton lien = <strong>+500 SMS</strong></p>
                      <p>• 10 Premium+ via ton lien = <strong>+1500 SMS</strong></p>
                      <p className="pt-2 text-xs text-amber-700">
                        Système de points partenaires en préparation : notez vos partenaires de point de vente, 
                        gagnez des SMS, ou privatisez un emplacement !
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SMS Packs Options */}
            <div className="max-w-6xl mx-auto mb-8">
              <h3 className="text-xl font-semibold text-center mb-4">📦 Packs SMS supplémentaires</h3>
              <p className="text-center text-muted-foreground mb-2">
                Besoin de plus de SMS ? Achetez des packs additionnels après inscription
              </p>
              <p className="text-center text-sm text-primary font-medium mb-6">
                💡 Les abonnés PRO bénéficient de tarifs réduits sur les packs
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(SMS_PACKS).map(([key, pack]) => (
                  <Card key={key} className={`hover:shadow-md transition-shadow ${'recommended' in pack && pack.recommended ? 'border-primary/50 relative' : ''}`}>
                    {'recommended' in pack && pack.recommended && (
                      <Badge className="absolute -top-2 right-4 bg-primary text-xs">
                        Recommandé
                      </Badge>
                    )}
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-2 mb-4">
                        <p className="font-semibold text-lg">{pack.quantity} SMS</p>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">{pack.priceCents / 100}€</p>
                          <p className="text-xs text-muted-foreground">Standard</p>
                        </div>
                        {(pack.priceCentsPro as number) !== (pack.priceCents as number) && (
                          <div className="pt-1 border-t">
                            <p className="text-lg font-bold text-green-600">{pack.priceCentsPro / 100}€</p>
                            <p className="text-xs text-green-600 font-medium">PRO (-{Math.round((1 - pack.priceCentsPro / pack.priceCents) * 100)}%)</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                Paiement sécurisé par Stripe • Commission de 8% sur les paniers
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PecheurPayment;
