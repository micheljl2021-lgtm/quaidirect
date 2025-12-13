import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Crown, Zap, ArrowLeft, Users, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FISHERMAN_PLANS, AFFILIATE_CREDITS_RULES } from "@/config/pricing";

const PecheursTarifs = () => {
  const plans = [
    {
      key: 'standard',
      data: FISHERMAN_PLANS.STANDARD,
      description: FISHERMAN_PLANS.STANDARD.positioning,
      icon: null,
      features: [
        `CRM simple (${FISHERMAN_PLANS.STANDARD.crmContacts} contacts)`,
        `${FISHERMAN_PLANS.STANDARD.smsQuotaMonthly} SMS/mois`,
        `🎁 ${FISHERMAN_PLANS.STANDARD.openingBonusSms} SMS bonus à l'ouverture`,
        'IA basique (textes, descriptions)',
        `${FISHERMAN_PLANS.STANDARD.salePoints} point de vente`,
        'Stats light',
        '📧 Emails illimités',
        `Affiliation : max ${FISHERMAN_PLANS.STANDARD.affiliateSmsCapMonthly} SMS/mois`,
      ],
    },
    {
      key: 'pro',
      data: FISHERMAN_PLANS.PRO,
      badge: 'Recommandé',
      description: FISHERMAN_PLANS.PRO.positioning,
      icon: <Crown className="h-5 w-5 text-primary" />,
      features: [
        `CRM avancé (${FISHERMAN_PLANS.PRO.crmContacts} contacts + tags)`,
        `${FISHERMAN_PLANS.PRO.smsQuotaMonthly} SMS/mois`,
        `🎁 ${FISHERMAN_PLANS.PRO.openingBonusSms} SMS bonus à l'ouverture`,
        'IA Marine + météo + templates',
        `${FISHERMAN_PLANS.PRO.salePoints} points de vente`,
        'Stats campagnes',
        '💰 Packs SMS moins chers',
        '🚀 Crédits affiliation illimités',
      ],
    },
    {
      key: 'elite',
      data: FISHERMAN_PLANS.ELITE,
      badge: 'Gros débit',
      description: FISHERMAN_PLANS.ELITE.positioning,
      icon: <Zap className="h-5 w-5 text-purple-600" />,
      features: [
        `CRM complet (${FISHERMAN_PLANS.ELITE.crmContacts.toLocaleString()} contacts)`,
        `${FISHERMAN_PLANS.ELITE.smsQuotaMonthly} SMS/mois inclus`,
        `SMS illimités (${(FISHERMAN_PLANS.ELITE.overagePricePerSmsCents / 100).toFixed(2)}€/SMS au-delà)`,
        'IA complète + "photo → annonce"',
        `${FISHERMAN_PLANS.ELITE.salePoints} points de vente`,
        'Dashboard avancé',
        'Sender pro / numéro vérifié',
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
            Choisissez le plan qui correspond à votre activité.
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
                  {'priceMonthlyEquivalent' in plan.data && plan.data.period === 'year' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      soit {((plan.data as any).priceMonthlyEquivalent / 100).toFixed(2)}€/mois
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className={`h-5 w-5 shrink-0 mt-0.5 ${
                        feature.includes('illimités') || feature.includes('moins chers') ? 'text-green-600' : 'text-primary'
                      }`} />
                      <span className={`text-sm ${
                        feature.includes('illimités') || feature.includes('moins chers') ? 'font-medium' : ''
                      }`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to={`/pecheur/payment?plan=${plan.key}`}>
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant={plan.key === 'pro' ? 'default' : 'outline'}
                  >
                    Commencer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pourquoi PRO */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-primary mb-3">
                  💡 Pourquoi PRO est le meilleur choix ?
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">Packs SMS moins chers</p>
                    <p className="text-muted-foreground">Pack 1000 : 65€ vs 75€</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Bonus 5x plus gros</p>
                    <p className="text-muted-foreground">1000 SMS à l'ouverture</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Affiliation illimitée</p>
                    <p className="text-muted-foreground">Pas de plafond mensuel</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comment vos clients financent vos SMS */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Comment vos clients financent vos SMS
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Chaque client qui prend un abonnement Premium via votre lien vous rapporte des crédits SMS :
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-background rounded-lg border">
                <p className="text-sm font-medium mb-1">Premium (25€/an)</p>
                <p className="text-2xl font-bold text-blue-600">~114 SMS</p>
                <p className="text-xs text-muted-foreground">8€ reversés → 0,07€/SMS</p>
              </div>
              <div className="p-4 bg-white dark:bg-background rounded-lg border">
                <p className="text-sm font-medium mb-1">Premium+ (40€/an)</p>
                <p className="text-2xl font-bold text-purple-600">~257 SMS</p>
                <p className="text-xs text-muted-foreground">18€ reversés → 0,07€/SMS</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-300 dark:border-green-700">
                <p className="text-sm font-medium mb-1">Exemple : 5% de conversion</p>
                <p className="text-2xl font-bold text-green-600">~1100 SMS/mois</p>
                <p className="text-xs text-muted-foreground">Sur 1300 contacts → 65 Premium</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
              💡 Avec le plan PRO, vos crédits d'affiliation sont illimités. En Standard, max 200 SMS/mois.
            </p>
          </CardContent>
        </Card>

        {/* Challenges & Système de Points */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏆</span>
                <h3 className="font-bold text-lg">Challenges & Récompenses</h3>
                <Badge variant="secondary">Bientôt</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Accomplissez des objectifs pour débloquer des bonus SMS :
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>5 Premium via votre lien</span>
                  <span className="font-bold text-green-600">+500 SMS</span>
                </li>
                <li className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>10 Premium+ via votre lien</span>
                  <span className="font-bold text-green-600">+1 500 SMS</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⭐</span>
                <h3 className="font-bold text-lg">Système de Points Partenaires</h3>
                <Badge variant="secondary">Bientôt</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Évaluez et soyez évalué sur la tenue des points de vente partagés :
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>👍 Points positifs → bonus SMS, privatisation de point</li>
                <li>👎 Trop de négatifs → restriction temporaire d'accès</li>
              </ul>
              <p className="text-xs mt-3 italic">
                Un système de confiance entre pêcheurs pour mieux collaborer.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">📱 SMS inclus</h3>
              <p className="text-sm text-muted-foreground">
                Tous les plans incluent des SMS mensuels et des bonus à l'ouverture. 
                Besoin de plus ? Achetez des packs SMS (moins chers en PRO).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">🛒 Commission de 8%</h3>
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
                <h3 className="font-semibold text-lg">🤝 Parrainage</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Parrainez un collègue pêcheur : <span className="font-semibold text-primary">{AFFILIATE_CREDITS_RULES.REFERRAL_BONUS_SMS} SMS bonus</span> pour vous deux !
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
