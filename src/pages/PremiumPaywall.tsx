import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Check, Clock, Bell, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PLANS = {
  monthly: {
    name: "Premium Mensuel",
    price: "4,99€",
    priceId: "price_1SRNwVH0VhS1yyE0wkaqzQ5j",
    plan: "monthly_4_99",
    period: "par mois",
    description: "Engagement mensuel",
  },
  annual: {
    name: "Premium Annuel",
    price: "39€",
    priceId: "price_1SRNwkH0VhS1yyE0fIMjjzfR",
    plan: "annual_39",
    period: "par an",
    description: "Économisez 2 mois",
    badge: "Meilleur prix",
  },
};

const FEATURES = [
  {
    icon: Clock,
    title: "Accès anticipé de 30 min",
    description: "Soyez les premiers informés des arrivages avant les autres utilisateurs",
  },
  {
    icon: Sparkles,
    title: "Pré-réservations exclusives",
    description: "Réservez vos poissons préférés avant qu'ils ne soient disponibles publiquement",
  },
  {
    icon: Bell,
    title: "Notifications prioritaires",
    description: "Recevez des alertes en temps réel pour les arrivages correspondant à vos préférences",
  },
  {
    icon: Shield,
    title: "Badge Premium",
    description: "Montrez votre soutien aux pêcheurs avec votre badge exclusif",
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
      {/* Hero Section */}
      <div className="container px-4 py-12 max-w-6xl mx-auto">
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

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">
          {/* Monthly Plan */}
          <Card className="relative hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{PLANS.monthly.name}</span>
              </CardTitle>
              <CardDescription>{PLANS.monthly.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{PLANS.monthly.price}</span>
                  <span className="text-muted-foreground">/{PLANS.monthly.period}</span>
                </div>
              </div>
              
              <ul className="space-y-3">
                {FEATURES.map((feature, index) => (
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
                onClick={() => handleSubscribe(PLANS.monthly.priceId, PLANS.monthly.plan)}
                disabled={loading === PLANS.monthly.plan}
              >
                {loading === PLANS.monthly.plan ? "Chargement..." : "S'abonner Mensuel"}
              </Button>
            </CardFooter>
          </Card>

          {/* Annual Plan */}
          <Card className="relative border-primary shadow-lg hover:shadow-xl transition-shadow">
            {PLANS.annual.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                {PLANS.annual.badge}
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{PLANS.annual.name}</span>
                <Crown className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>{PLANS.annual.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{PLANS.annual.price}</span>
                  <span className="text-muted-foreground">/{PLANS.annual.period}</span>
                </div>
                <p className="text-sm text-primary font-semibold mt-1">
                  Soit 3,25€/mois
                </p>
              </div>
              
              <ul className="space-y-3">
                {FEATURES.map((feature, index) => (
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
                onClick={() => handleSubscribe(PLANS.annual.priceId, PLANS.annual.plan)}
                disabled={loading === PLANS.annual.plan}
              >
                {loading === PLANS.annual.plan ? "Chargement..." : "S'abonner Annuel"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Features Details */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Tout ce qu'inclut Premium
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6 pb-6 text-center">
            <h3 className="text-2xl font-bold mb-3">
              Essai gratuit de 7 jours
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Testez QuaiDirect Premium sans engagement. Annulez à tout moment pendant la période d'essai.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleSubscribe(PLANS.annual.priceId, PLANS.annual.plan)}
                disabled={!!loading}
              >
                <Crown className="mr-2 h-5 w-5" />
                Commencer l'essai gratuit
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
