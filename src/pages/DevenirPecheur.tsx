import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Crown, Zap, ArrowLeft, Users, TrendingUp, Smartphone, Globe, Clock, Coins, Bot, Send } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FISHERMAN_PLANS, AFFILIATE_CREDITS_RULES } from "@/config/pricing";

const DevenirPecheur = () => {
  const plans = [
    {
      key: 'standard',
      data: FISHERMAN_PLANS.STANDARD,
      description: FISHERMAN_PLANS.STANDARD.positioning,
      icon: null,
      features: [
        `Liste de clients (${FISHERMAN_PLANS.STANDARD.crmContacts}) — prévenez-les en 1 clic`,
        `${FISHERMAN_PLANS.STANDARD.smsQuotaMonthly} SMS/mois inclus`,
        `🎁 ${FISHERMAN_PLANS.STANDARD.openingBonusSms} SMS offerts à l'inscription`,
        'L\'IA rédige vos annonces et descriptions',
        `${FISHERMAN_PLANS.STANDARD.salePoints} point de vente`,
        'Suivi de vos envois (qui a reçu, quand)',
        '📧 Emails illimités et gratuits',
        `Bonus parrainages : jusqu'à ${FISHERMAN_PLANS.STANDARD.affiliateSmsCapMonthly} SMS/mois`,
      ],
    },
    {
      key: 'pro',
      data: FISHERMAN_PLANS.PRO,
      badge: 'Recommandé',
      description: FISHERMAN_PLANS.PRO.positioning,
      icon: <Crown className="h-5 w-5 text-primary" />,
      features: [
        `Liste de clients (${FISHERMAN_PLANS.PRO.crmContacts}) — triez par groupe`,
        `${FISHERMAN_PLANS.PRO.smsQuotaMonthly} SMS/mois inclus`,
        `🎁 ${FISHERMAN_PLANS.PRO.openingBonusSms} SMS offerts à l'inscription`,
        'IA complète + conseils météo + modèles de messages',
        `${FISHERMAN_PLANS.PRO.salePoints} points de vente`,
        'Statistiques détaillées de vos campagnes',
        '💰 Packs SMS à prix réduit',
        '🚀 Bonus parrainages illimités',
      ],
    },
    {
      key: 'elite',
      data: FISHERMAN_PLANS.ELITE,
      badge: 'Gros volumes',
      description: FISHERMAN_PLANS.ELITE.positioning,
      icon: <Zap className="h-5 w-5 text-purple-600" />,
      features: [
        `Liste de clients (${FISHERMAN_PLANS.ELITE.crmContacts.toLocaleString()}) — sans limite`,
        `${FISHERMAN_PLANS.ELITE.smsQuotaMonthly} SMS/mois inclus`,
        `SMS au-delà : seulement ${(FISHERMAN_PLANS.ELITE.overagePricePerSmsCents / 100).toFixed(2)}€/SMS`,
        'IA complète + "envoyez une photo, l\'annonce est prête"',
        `${FISHERMAN_PLANS.ELITE.salePoints} points de vente`,
        'Tableau de bord complet avec toutes les statistiques',
        'Expéditeur "QuaiDirect" reconnu sur les SMS',
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
          <h1 className="text-4xl font-bold mb-4">Vendez votre pêche plus facilement</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            QuaiDirect vous fait gagner du temps et des clients. Voici ce que ça change concrètement.
          </p>
        </div>

        {/* NOUVELLE SECTION : Ce que QuaiDirect fait pour vous */}
        <Card className="mb-12 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold text-center mb-8">
              Ce que QuaiDirect fait pour vous
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex gap-4 items-start p-4 bg-white dark:bg-background rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Send className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Prévenez tous vos clients en 1 clic</h3>
                  <p className="text-sm text-muted-foreground">
                    Plus besoin d'envoyer 50 SMS à la main. Un seul bouton, et tout le monde est prévenu de votre arrivage.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start p-4 bg-white dark:bg-background rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Une page à votre nom sur internet</h3>
                  <p className="text-sm text-muted-foreground">
                    Les gens vous trouvent directement sur Google. Plus besoin de Facebook ou d'un site compliqué.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start p-4 bg-white dark:bg-background rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Publiez en 30 secondes, même fatigué</h3>
                  <p className="text-sm text-muted-foreground">
                    Interface pensée pour les nuits de pêche. Gros boutons, peu de texte. Ça marche à 2h du mat' avec la frontale.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start p-4 bg-white dark:bg-background rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Vos clients vous financent les SMS</h3>
                  <p className="text-sm text-muted-foreground">
                    Quand vos clients s'abonnent "Premium", vous gagnez des SMS gratuits. Plus ils sont fidèles, moins vous payez.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start p-4 bg-white dark:bg-background rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Un assistant qui travaille pour vous</h3>
                  <p className="text-sm text-muted-foreground">
                    L'IA rédige vos annonces, vous conseille sur la météo, vous aide à organiser vos journées.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start p-4 bg-white dark:bg-background rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Tout sur votre téléphone</h3>
                  <p className="text-sm text-muted-foreground">
                    Pas d'ordinateur à allumer. Vous gérez tout depuis le quai, sur votre portable.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Choisissez votre formule</h2>
          <p className="text-muted-foreground">Pas de mauvaise surprise, tout est clair.</p>
        </div>

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
                        feature.includes('illimités') || feature.includes('réduit') || feature.includes('offerts') ? 'text-green-600' : 'text-primary'
                      }`} />
                      <span className={`text-sm ${
                        feature.includes('illimités') || feature.includes('réduit') || feature.includes('offerts') ? 'font-medium' : ''
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
                  💡 Pourquoi le plan PRO est le meilleur choix ?
                </p>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">Packs SMS moins chers</p>
                    <p className="text-muted-foreground">Vous économisez sur chaque achat de SMS supplémentaires</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">5x plus de SMS offerts</p>
                    <p className="text-muted-foreground">1000 SMS à l'inscription au lieu de 200</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Parrainages illimités</p>
                    <p className="text-muted-foreground">Pas de plafond — plus vos clients s'abonnent, plus vous gagnez</p>
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
              Comment vos clients vous offrent des SMS
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Quand un client s'abonne "Premium" via votre lien, vous recevez des SMS gratuits :
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-background rounded-lg border">
                <p className="text-sm font-medium mb-1">Abonnement Premium (25€/an)</p>
                <p className="text-2xl font-bold text-blue-600">~114 SMS offerts</p>
                <p className="text-xs text-muted-foreground">8€ reversés sur votre compte</p>
              </div>
              <div className="p-4 bg-white dark:bg-background rounded-lg border">
                <p className="text-sm font-medium mb-1">Abonnement Premium+ (40€/an)</p>
                <p className="text-2xl font-bold text-purple-600">~257 SMS offerts</p>
                <p className="text-xs text-muted-foreground">18€ reversés sur votre compte</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-300 dark:border-green-700">
                <p className="text-sm font-medium mb-1">Exemple concret</p>
                <p className="text-2xl font-bold text-green-600">~1100 SMS/mois</p>
                <p className="text-xs text-muted-foreground">Si 65 clients sur 1300 s'abonnent (5%)</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">
              💡 Avec le plan PRO, vos bonus parrainages sont illimités. En Standard, le plafond est de 200 SMS/mois.
            </p>
          </CardContent>
        </Card>

        {/* Challenges & Système de Points */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏆</span>
                <h3 className="font-bold text-lg">Défis & Récompenses</h3>
                <Badge variant="secondary">Bientôt</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Atteignez des objectifs pour gagner des SMS bonus :
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>5 clients Premium grâce à vous</span>
                  <span className="font-bold text-green-600">+500 SMS</span>
                </li>
                <li className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span>10 clients Premium+ grâce à vous</span>
                  <span className="font-bold text-green-600">+1 500 SMS</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⭐</span>
                <h3 className="font-bold text-lg">Système d'entraide entre pêcheurs</h3>
                <Badge variant="secondary">Bientôt</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Partagez des points de vente et évaluez-vous mutuellement :
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>👍 Bonne conduite → bonus SMS, accès à plus de points</li>
                <li>👎 Problèmes répétés → accès limité temporairement</li>
              </ul>
              <p className="text-xs mt-3 italic">
                Un système de confiance pour mieux travailler ensemble.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">📱 SMS inclus chaque mois</h3>
              <p className="text-sm text-muted-foreground">
                Tous les plans incluent des SMS mensuels et des bonus à l'inscription. 
                Besoin de plus ? Achetez des packs (moins chers en PRO).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">🛒 Commission : 8% sur les paniers</h3>
              <p className="text-sm text-muted-foreground">
                Uniquement sur les paniers vendus via la plateforme. 
                Vente en direct sur le quai = 0% de commission.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">🤝 Parrainez un collègue</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Invitez un autre pêcheur à rejoindre QuaiDirect : <span className="font-semibold text-primary">{AFFILIATE_CREDITS_RULES.REFERRAL_BONUS_SMS} SMS offerts</span> pour vous deux !
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Des questions ? Appelez-nous ou écrivez à{" "}
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

export default DevenirPecheur;