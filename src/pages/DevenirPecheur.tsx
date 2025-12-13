import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Fish, 
  Euro, 
  Users, 
  Smartphone,
  TrendingUp,
  Clock,
  MessageSquare,
  Star,
  CheckCircle2,
  ArrowRight,
  Crown,
  Zap,
  Gift
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { FISHERMAN_PLANS, AFFILIATE_CREDITS_RULES } from "@/config/pricing";

const DevenirPecheur = () => {
  const [searchParams] = useSearchParams();
  const preselectedPlan = searchParams.get('plan') || null;
  
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="container px-4 py-16 bg-gradient-ocean/5">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Fish className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium">Rejoignez 50+ marins-pêcheurs</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground">
            Vendez votre pêche en direct
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Fini les intermédiaires qui grattent vos marges. Créez votre vitrine digitale, 
            gérez vos ventes et développez votre clientèle fidèle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/pecheur/payment">
              <Button size="lg" className="gap-2">
                <Fish className="h-5 w-5" aria-hidden="true" />
                S&apos;inscrire maintenant
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section className="container px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Trois formules adaptées à vos besoins
            </h2>
            <p className="text-lg text-muted-foreground">
              Choisissez le plan qui correspond à votre activité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Plan STANDARD */}
            <Card className={`border-2 relative ${preselectedPlan === 'standard' || preselectedPlan === 'basic' ? 'border-primary shadow-lg' : ''}`}>
              {(preselectedPlan === 'standard' || preselectedPlan === 'basic') && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full">
                  Plan sélectionné
                </div>
              )}
              <CardContent className="pt-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Plan Standard</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">{FISHERMAN_PLANS.STANDARD.priceCents / 100}€</span>
                    <span className="text-muted-foreground">/an</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({(FISHERMAN_PLANS.STANDARD.priceMonthlyEquivalent / 100).toFixed(2)}€/mois)
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    "{FISHERMAN_PLANS.STANDARD.positioning}"
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">CRM simple ({FISHERMAN_PLANS.STANDARD.crmContacts} contacts)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">{FISHERMAN_PLANS.STANDARD.smsQuotaMonthly} SMS/mois</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Gift className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground font-medium">🎁 {FISHERMAN_PLANS.STANDARD.openingBonusSms} SMS bonus</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">IA basique (textes, descriptions)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">{FISHERMAN_PLANS.STANDARD.salePoints} point de vente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">Stats light</span>
                  </li>
                </ul>

                <Link to="/pecheur/payment?plan=standard" className="block">
                  <Button className="w-full" size="lg" variant="outline">
                    Choisir Standard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan Pro - Recommandé */}
            <Card className={`border-2 relative ${preselectedPlan === 'pro' ? 'border-primary shadow-lg' : 'border-primary'}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full flex items-center gap-1">
                <Crown className="h-3 w-3" />
                {preselectedPlan === 'pro' ? 'Plan sélectionné' : 'Recommandé'}
              </div>
              <CardContent className="pt-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Plan Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">{FISHERMAN_PLANS.PRO.priceCents / 100}€</span>
                    <span className="text-muted-foreground">/an</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ({(FISHERMAN_PLANS.PRO.priceMonthlyEquivalent / 100).toFixed(2)}€/mois)
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    "{FISHERMAN_PLANS.PRO.positioning}"
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">CRM avancé ({FISHERMAN_PLANS.PRO.crmContacts} contacts + tags)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">{FISHERMAN_PLANS.PRO.smsQuotaMonthly} SMS/mois</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Gift className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground font-medium">🎁 {FISHERMAN_PLANS.PRO.openingBonusSms} SMS bonus</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">IA Marine + météo + templates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">{FISHERMAN_PLANS.PRO.salePoints} points de vente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground font-medium">Packs SMS moins chers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground font-medium">Crédits affiliation illimités</span>
                  </li>
                </ul>

                <Link to="/pecheur/payment?plan=pro" className="block">
                  <Button className="w-full" size="lg" variant="default">
                    Choisir Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan ELITE */}
            <Card className={`border-2 relative ${preselectedPlan === 'elite' ? 'border-purple-600 shadow-lg' : ''}`}>
              {preselectedPlan === 'elite' ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                  Plan sélectionné
                </div>
              ) : (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600">
                  Gros débit
                </Badge>
              )}
              <CardContent className="pt-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                    Plan Elite
                    <Zap className="h-5 w-5 text-purple-600" />
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-purple-600">{FISHERMAN_PLANS.ELITE.priceCents / 100}€</span>
                    <span className="text-muted-foreground">/mois</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    "{FISHERMAN_PLANS.ELITE.positioning}"
                  </p>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">CRM complet ({FISHERMAN_PLANS.ELITE.crmContacts.toLocaleString()} contacts)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">{FISHERMAN_PLANS.ELITE.smsQuotaMonthly} SMS/mois inclus</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-foreground font-medium">SMS illimités ({(FISHERMAN_PLANS.ELITE.overagePricePerSmsCents / 100).toFixed(2)}€/SMS au-delà)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">IA complète + "photo → annonce"</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">{FISHERMAN_PLANS.ELITE.salePoints} points de vente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">Dashboard avancé</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-muted-foreground">Sender pro / numéro vérifié</span>
                  </li>
                </ul>

                <Link to="/pecheur/payment?plan=elite" className="block">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg" variant="default">
                    Choisir Elite
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Packs SMS supplémentaires disponibles après inscription • Commission de 8% sur les paniers
          </p>

          {/* Programme de Parrainage */}
          <Card className="mt-12 border-2 border-dashed border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-foreground mb-2">🎁 Programme de Parrainage</h3>
                  <p className="text-muted-foreground mb-3">
                    Parrainez un collègue pêcheur et recevez <span className="font-semibold text-primary">{AFFILIATE_CREDITS_RULES.REFERRAL_BONUS_SMS} SMS bonus</span> chacun !
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Vous : {AFFILIATE_CREDITS_RULES.REFERRAL_BONUS_SMS} SMS bonus</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Votre filleul : {AFFILIATE_CREDITS_RULES.REFERRAL_BONUS_SMS} SMS bonus</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affiliation */}
          <Card className="mt-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900 mb-2">
                    🤝 Vos clients Premium financent vos SMS
                  </p>
                  <div className="text-sm text-green-800 space-y-1">
                    <p>• Chaque Premium (25€/an) = ~{AFFILIATE_CREDITS_RULES.calculateSmsCredits(800)} SMS crédités</p>
                    <p>• Chaque Premium+ (40€/an) = ~{AFFILIATE_CREDITS_RULES.calculateSmsCredits(1800)} SMS crédités</p>
                    <p className="text-xs text-green-700 pt-2">
                      ⚠️ Standard : max {FISHERMAN_PLANS.STANDARD.affiliateSmsCapMonthly} SMS/mois via affiliation • Pro/Elite : illimité
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Avantages */}
      <section className="container px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Pourquoi rejoindre QuaiDirect ?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Euro className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Meilleure rentabilité</h3>
                <p className="text-muted-foreground">
                  Vendez 20-40% plus cher qu&apos;en criée en supprimant les intermédiaires. 
                  Votre travail, votre prix.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Gain de temps</h3>
                <p className="text-muted-foreground">
                  Publiez un arrivage en 2 minutes. Plus de coups de fil, de messages. 
                  Tout est automatisé.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Clientèle fidèle</h3>
                <p className="text-muted-foreground">
                  Créez votre base de clients réguliers qui vous suivent et valorisent 
                  votre travail.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">100% mobile</h3>
                <p className="text-muted-foreground">
                  Interface pensée pour être utilisée depuis votre téléphone, 
                  même en mer avec 4G.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Communication simplifiée</h3>
                <p className="text-muted-foreground">
                  Emails et WhatsApp automatiques. Vos clients reçoivent vos annonces 
                  sans effort.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Visibilité accrue</h3>
                <p className="text-muted-foreground">
                  Profitez du trafic QuaiDirect pour toucher de nouveaux clients 
                  sans publicité.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="container px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ils nous font confiance
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Fish className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Sébastien Z.</h3>
                    <p className="text-sm text-muted-foreground">Pêcheur à Hyères</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Avec 1300 contacts, j'ai besoin d'un outil qui tient la route. 
                  Le Plan Pro avec le bonus de 1000 SMS m'a permis de lancer 
                  ma campagne d'inscription dès le premier jour."
                </p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Fish className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Marie-Claire D.</h3>
                    <p className="text-sm text-muted-foreground">Pêcheuse à La Rochelle</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "J'ai commencé avec le Standard pour tester. Maintenant mes clients 
                  Premium financent mes SMS - je n'ai plus à acheter de packs !"
                </p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container px-4 py-16 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            Prêt à vendre en direct ?
          </h2>
          <p className="text-muted-foreground">
            Rejoignez les pêcheurs qui ont choisi l'autonomie. 
            30 jours d'essai gratuit, sans engagement.
          </p>
          <Link to="/pecheur/payment">
            <Button size="lg" className="gap-2">
              Commencer maintenant
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DevenirPecheur;
