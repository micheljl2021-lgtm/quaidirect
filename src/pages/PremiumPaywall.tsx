import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Check, MapPin, Bell, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

const PLANS = {
  premiumMonthly: {
    name: "Premium Mensuel",
    price: "2,50€",
    priceId: "price_1SZ489H0VhS1yyE0Nc9KZhy1",
    plan: "premium_monthly",
    period: "par mois",
    tier: "premium",
  },
  premiumAnnual: {
    name: "Premium Annuel",
    price: "25€",
    priceId: "price_1SZ48UH0VhS1yyE0iYmXen3H",
    plan: "premium_annual",
    period: "par an",
    badge: "2 mois offerts",
    tier: "premium",
  },
  premiumPlusMonthly: {
    name: "Premium+ Mensuel",
    price: "4€",
    priceId: "price_1SZ48yH0VhS1yyE0bijfw3y7",
    plan: "premium_plus_monthly",
    period: "par mois",
    tier: "premium_plus",
  },
  premiumPlusAnnual: {
    name: "Premium+ Annuel",
    price: "40€",
    priceId: "price_1SZ49DH0VhS1yyE06HJyLC65",
    plan: "premium_plus_annual",
    period: "par an",
    badge: "2 mois offerts",
    tier: "premium_plus",
  },
};

const FEATURES_PREMIUM = [
  {
    icon: MapPin,
    title: "Soutenez les points de vente",
  },
  {
    icon: Bell,
    title: "Alertes mail sur vos poissons favoris",
  },
  {
    icon: Bell,
    title: "Notifications prioritaires par mail",
  },
  {
    icon: Star,
    title: "Badge Premium visible",
  },
];

const FEATURES_PREMIUM_PLUS = [
  {
    icon: MapPin,
    title: "Tous les avantages Premium",
  },
  {
    icon: Bell,
    title: "Notifications SMS incluses",
  },
  {
    icon: Bell,
    title: "Alertes 'dernières pièces' par SMS",
  },
  {
    icon: Star,
    title: "Badge Premium+ distinctif",
  },
];

const HERO_VARIANTS = [
  "Soutenez vos pêcheurs : profitez des arrivages 30 min avant tout le monde",
  "Premium : alertes prioritaires et pré-réservations. La mer ne prévient pas",
  "Du poisson frais plus vite. Aidez ceux qui sortent en mer",
];

export default function PremiumPaywall() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [heroVariant] = useState(HERO_VARIANTS[Math.floor(Math.random() * HERO_VARIANTS.length)]);

  const handleSubscribe = async (priceId: string, plan: string) => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour souscrire à Premium",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(plan);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, plan },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la session de paiement",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Header />
      
      {/* Back button */}
      <div className="container px-4 pt-4 max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      {/* Hero Section */}
      <div className="container px-4 py-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Crown className="h-5 w-5" />
            <span className="font-semibold">QuaiDirect Premium</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {heroVariant}
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Profitez d'un accès exclusif aux meilleurs arrivages de poisson frais
          </p>
        </div>

        {/* Section Premium */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">Premium</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Premium Mensuel */}
            <Card className="relative hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{PLANS.premiumMonthly.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{PLANS.premiumMonthly.price}</span>
                    <span className="text-muted-foreground">/{PLANS.premiumMonthly.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {FEATURES_PREMIUM.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(PLANS.premiumMonthly.priceId, PLANS.premiumMonthly.plan)}
                  disabled={loading === PLANS.premiumMonthly.plan}
                >
                  {loading === PLANS.premiumMonthly.plan ? "Chargement..." : "S'abonner"}
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Annuel */}
            <Card className="relative border-primary shadow-lg hover:shadow-xl transition-shadow">
              {PLANS.premiumAnnual.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {PLANS.premiumAnnual.badge}
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{PLANS.premiumAnnual.name}</span>
                  <Crown className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{PLANS.premiumAnnual.price}</span>
                    <span className="text-muted-foreground">/{PLANS.premiumAnnual.period}</span>
                  </div>
                  <div className="text-sm text-primary font-semibold mt-1">
                    Soit 2,08€/mois
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {FEATURES_PREMIUM.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  variant="default"
                  onClick={() => handleSubscribe(PLANS.premiumAnnual.priceId, PLANS.premiumAnnual.plan)}
                  disabled={loading === PLANS.premiumAnnual.plan}
                >
                  {loading === PLANS.premiumAnnual.plan ? "Chargement..." : "S'abonner"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Section Premium+ */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-6">Premium+ <Badge className="ml-2">SMS inclus</Badge></h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Premium+ Mensuel */}
            <Card className="relative hover:shadow-lg transition-shadow border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{PLANS.premiumPlusMonthly.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{PLANS.premiumPlusMonthly.price}</span>
                    <span className="text-muted-foreground">/{PLANS.premiumPlusMonthly.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-3">
                  {FEATURES_PREMIUM_PLUS.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe(PLANS.premiumPlusMonthly.priceId, PLANS.premiumPlusMonthly.plan)}
                  disabled={loading === PLANS.premiumPlusMonthly.plan}
                >
                  {loading === PLANS.premiumPlusMonthly.plan ? "Chargement..." : "S'abonner"}
                </Button>
              </CardFooter>
            </Card>

            {/* Premium+ Annuel */}
            <Card className="relative border-2 border-primary shadow-lg hover:shadow-xl transition-shadow">
              {PLANS.premiumPlusAnnual.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  {PLANS.premiumPlusAnnual.badge}
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{PLANS.premiumPlusAnnual.name}</span>
                  <Crown className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{PLANS.premiumPlusAnnual.price}</span>
                    <span className="text-muted-foreground">/{PLANS.premiumPlusAnnual.period}</span>
                  </div>
                  <p className="text-sm text-primary font-semibold mt-1">
                    Soit 3,33€/mois
                  </p>
                </div>
                
                <ul className="space-y-3">
                  {FEATURES_PREMIUM_PLUS.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  variant="default"
                  onClick={() => handleSubscribe(PLANS.premiumPlusAnnual.priceId, PLANS.premiumPlusAnnual.plan)}
                  disabled={loading === PLANS.premiumPlusAnnual.plan}
                >
                  {loading === PLANS.premiumPlusAnnual.plan ? "Chargement..." : "S'abonner"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6 pb-6 text-center">
            <h3 className="text-2xl font-bold mb-3">
              Soutenez la pêche locale
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Chaque abonnement Premium aide à financer et développer les points de vente à quai.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleSubscribe(PLANS.premiumAnnual.priceId, PLANS.premiumAnnual.plan)}
                disabled={!!loading}
              >
                <Crown className="mr-2 h-5 w-5" />
                Commencer Premium
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/arrivages")}
              >
                Retour aux arrivages
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
