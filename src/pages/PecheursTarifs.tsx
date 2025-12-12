import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Crown, Zap, ArrowLeft, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FISHERMAN_PLANS } from "@/config/pricing";

const PecheursTarifs = () => {
  const plans = [
    {
      key: 'standard',
      data: FISHERMAN_PLANS.STANDARD,
      description: 'Pour démarrer la vente en direct',
      icon: null,
      features: [
        'Vitrine digitale personnalisée',
        `${FISHERMAN_PLANS.STANDARD.smsQuotaMonthly} SMS/mois`,
        `${FISHERMAN_PLANS.STANDARD.openingBonusSms} SMS bonus à l'ouverture`,
        '🔔 Notifications push illimitées',
        `${FISHERMAN_PLANS.STANDARD.crmContacts} contacts CRM`,
        `${FISHERMAN_PLANS.STANDARD.salePoints} point de vente`,
        'Emails illimités',
      ],
    },
    {
      key: 'pro',
      data: FISHERMAN_PLANS.PRO,
      badge: 'Recommandé',
      description: 'Pour maximiser vos ventes',
      icon: <Crown className="h-5 w-5 text-primary" />,
      features: [
        'Tout le plan Standard inclus',
        `${FISHERMAN_PLANS.PRO.smsQuotaMonthly} SMS/mois`,
        `${FISHERMAN_PLANS.PRO.openingBonusSms} SMS bonus à l'ouverture`,
        '🔔 Notifications push illimitées',
        `${FISHERMAN_PLANS.PRO.crmContacts} contacts CRM`,
        `${FISHERMAN_PLANS.PRO.salePoints} points de vente`,
        'IA avancée et statistiques',
      ],
    },
    {
      key: 'elite',
      data: FISHERMAN_PLANS.ELITE,
      badge: 'Volume',
      description: 'Pour les gros volumes',
      icon: <Zap className="h-5 w-5 text-purple-600" />,
      features: [
        'Tout le plan Pro inclus',
        `${FISHERMAN_PLANS.ELITE.smsQuotaMonthly} SMS/mois`,
        'SMS illimités (0.09€/SMS au-delà)',
        '🔔 Notifications push illimitées',
        `${FISHERMAN_PLANS.ELITE.crmContacts.toLocaleString()} contacts CRM`,
        `${FISHERMAN_PLANS.ELITE.salePoints} points de vente`,
        'Toutes les fonctionnalités avancées',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-7xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => window.history.back()} className="gap-2 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Tarifs Pêcheurs QuaiDirect</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choisissez le plan qui correspond à votre activité. Tous les plans incluent 30 jours d'essai gratuit (sauf Elite).
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.key}
              className={`relative hover:shadow-lg transition-shadow ${
                plan.key === 'pro' ? 'border-primary shadow-lg' : ''
              }`}
            >
              {plan.badge && (
                <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                  plan.key === 'elite' ? 'bg-purple-600' : ''
                }`}>
                  {plan.badge}
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.data.name}</span>
                  {plan.icon}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      {(plan.data.priceCents / 100).toFixed(0)}€
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.data.period === 'year' ? 'an' : 'mois'}
                    </span>
                  </div>
                  {plan.data.trialDays > 0 && (
                    <Badge className="bg-green-500 text-white mt-2">
                      🎁 {plan.data.trialDays} jours offerts
                    </Badge>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to={`/pecheur/payment?plan=${plan.key}`}>
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant={plan.key === 'pro' ? 'default' : 'outline'}
                  >
                    {plan.data.trialDays > 0 ? 'Démarrer l\'essai gratuit' : 'Commencer'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Information */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">SMS inclus</h3>
              <p className="text-sm text-muted-foreground">
                Tous les plans incluent des SMS mensuels et des bonus à l'ouverture. 
                Besoin de plus ? Achetez des packs SMS supplémentaires.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">Commission de 8%</h3>
              <p className="text-sm text-muted-foreground">
                Sur les paniers vendus via la plateforme uniquement. 
                Vente en direct = 0% de commission.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">🎁 Parrainage</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Parrainez un collègue et recevez <span className="font-semibold text-primary">300 SMS bonus</span> chacun !
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Questions ? Contactez-nous à{" "}
            <a href="mailto:CEO@quaidirect.fr" className="text-primary hover:underline">
              CEO@quaidirect.fr
            </a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PecheursTarifs;
