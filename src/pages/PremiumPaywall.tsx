import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Check, MapPin, Bell, Star, ArrowLeft, Mail, MessageSquare, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

// Définition des niveaux clients
const CLIENT_LEVELS = {
  follower: {
    name: "Follower",
    price: "Gratuit",
    priceId: null,
    period: "",
    description: "Accès de base",
    features: [
      { icon: MapPin, title: "Voir les arrivages publics" },
      { icon: Heart, title: "Suivre vos pêcheurs favoris" },
      { icon: MapPin, title: "Suivre vos ports favoris" },
    ],
    notifications: "❌ Aucune notification",
  },
  premium: {
    name: "Premium",
    priceMonthly: "2,50€",
    priceAnnual: "25€",
    priceIdMonthly: "price_1SZ489H0VhS1yyE0Nc9KZhy1",
    priceIdAnnual: "price_1SZ48UH0VhS1yyE0iYmXen3H",
    description: "Notifications prioritaires",
    features: [
      { icon: Check, title: "Tout Follower inclus" },
      { icon: Bell, title: "🔔 Notifications Push" },
      { icon: Mail, title: "📧 Notifications Email" },
      { icon: Star, title: "⚡ Accès anticipé 30min" },
      { icon: Crown, title: "✨ Badge Premium visible" },
    ],
    badgeAnnual: "2 mois offerts",
  },
  premiumPlus: {
    name: "Premium+",
    priceMonthly: "4€",
    priceAnnual: "40€",
    priceIdMonthly: "price_1SZ48yH0VhS1yyE0bijfw3y7",
    priceIdAnnual: "price_1SZ49DH0VhS1yyE06HJyLC65",
    description: "Notifications + SMS + Soutien",
    features: [
      { icon: Check, title: "Tout Premium inclus" },
      { icon: MessageSquare, title: "📱 Notifications SMS" },
      { icon: Bell, title: "🚨 Alertes 'dernières pièces'" },
      { icon: Heart, title: "💰 Contribution cagnotte pêcheurs" },
      { icon: Star, title: "🌟 Badge Premium+ distinctif" },
    ],
    badgeAnnual: "2 mois offerts",
  },
};

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
            Choisissez le niveau qui vous convient
          </p>
        </div>

        {/* 3 Niveaux côte à côte */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {/* Follower - Gratuit */}
          <Card className="relative hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{CLIENT_LEVELS.follower.name}</span>
              </CardTitle>
              <CardDescription>{CLIENT_LEVELS.follower.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{CLIENT_LEVELS.follower.price}</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-4">
                {CLIENT_LEVELS.follower.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.title}</span>
                  </li>
                ))}
              </ul>
              
              <div className="p-3 bg-muted rounded-md text-center">
                <span className="text-sm text-muted-foreground">{CLIENT_LEVELS.follower.notifications}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                Créer un compte gratuit
              </Button>
            </CardFooter>
          </Card>

          {/* Premium - 25€/an */}
          <Card className="relative border-primary shadow-lg hover:shadow-xl transition-shadow">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Populaire
            </Badge>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{CLIENT_LEVELS.premium.name}</span>
                <Crown className="h-5 w-5 text-primary" />
              </CardTitle>
              <CardDescription>{CLIENT_LEVELS.premium.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{CLIENT_LEVELS.premium.priceAnnual}</span>
                  <span className="text-muted-foreground">/an</span>
                </div>
                <p className="text-sm text-primary font-medium mt-1">
                  Soit 2,08€/mois
                </p>
                <Badge className="mt-2 bg-green-500 text-white">
                  {CLIENT_LEVELS.premium.badgeAnnual}
                </Badge>
              </div>
              
              <ul className="space-y-3 mb-4">
                {CLIENT_LEVELS.premium.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.title}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full"
                size="lg"
                onClick={() => handleSubscribe(CLIENT_LEVELS.premium.priceIdAnnual, "premium_annual")}
                disabled={loading === "premium_annual"}
              >
                {loading === "premium_annual" ? "Chargement..." : "S'abonner 25€/an"}
              </Button>
              <Button
                className="w-full"
                size="sm"
                variant="outline"
                onClick={() => handleSubscribe(CLIENT_LEVELS.premium.priceIdMonthly, "premium_monthly")}
                disabled={loading === "premium_monthly"}
              >
                {loading === "premium_monthly" ? "Chargement..." : `ou ${CLIENT_LEVELS.premium.priceMonthly}/mois`}
              </Button>
            </CardFooter>
          </Card>

          {/* Premium+ - 40€/an */}
          <Card className="relative border-2 border-primary/50 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-b from-primary/5 to-transparent">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500">
              SMS inclus
            </Badge>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{CLIENT_LEVELS.premiumPlus.name}</span>
                <div className="flex gap-1">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
              </CardTitle>
              <CardDescription>{CLIENT_LEVELS.premiumPlus.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{CLIENT_LEVELS.premiumPlus.priceAnnual}</span>
                  <span className="text-muted-foreground">/an</span>
                </div>
                <p className="text-sm text-primary font-medium mt-1">
                  Soit 3,33€/mois
                </p>
                <Badge className="mt-2 bg-green-500 text-white">
                  {CLIENT_LEVELS.premiumPlus.badgeAnnual}
                </Badge>
              </div>
              
              <ul className="space-y-3 mb-4">
                {CLIENT_LEVELS.premiumPlus.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature.title}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                size="lg"
                onClick={() => handleSubscribe(CLIENT_LEVELS.premiumPlus.priceIdAnnual, "premium_plus_annual")}
                disabled={loading === "premium_plus_annual"}
              >
                {loading === "premium_plus_annual" ? "Chargement..." : "S'abonner 40€/an"}
              </Button>
              <Button
                className="w-full"
                size="sm"
                variant="outline"
                onClick={() => handleSubscribe(CLIENT_LEVELS.premiumPlus.priceIdMonthly, "premium_plus_monthly")}
                disabled={loading === "premium_plus_monthly"}
              >
                {loading === "premium_plus_monthly" ? "Chargement..." : `ou ${CLIENT_LEVELS.premiumPlus.priceMonthly}/mois`}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Tableau comparatif des notifications */}
        <Card className="mb-12 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">📬 Canaux de notification par niveau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Canal</th>
                    <th className="text-center py-3 px-2">Follower</th>
                    <th className="text-center py-3 px-2">Premium</th>
                    <th className="text-center py-3 px-2">Premium+</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">🔔 Push (app)</td>
                    <td className="text-center py-3 px-2">❌</td>
                    <td className="text-center py-3 px-2">✅</td>
                    <td className="text-center py-3 px-2">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">📧 Email</td>
                    <td className="text-center py-3 px-2">❌</td>
                    <td className="text-center py-3 px-2">✅</td>
                    <td className="text-center py-3 px-2">✅</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-2 font-medium">📱 SMS</td>
                    <td className="text-center py-3 px-2">❌</td>
                    <td className="text-center py-3 px-2">❌</td>
                    <td className="text-center py-3 px-2">✅</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 font-medium">⚡ Accès anticipé (30min)</td>
                    <td className="text-center py-3 px-2">❌</td>
                    <td className="text-center py-3 px-2">✅</td>
                    <td className="text-center py-3 px-2">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Cagnotte Premium+ */}
        <Card className="mb-12 max-w-4xl mx-auto bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-amber-100">
                <Heart className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-amber-900 mb-2">
                  💰 Cagnotte SMS : soutenez directement vos pêcheurs
                </h3>
                <p className="text-sm text-amber-800 mb-2">
                  Avec <strong>Premium+</strong>, une partie de votre abonnement (15€/an) est reversée aux pêcheurs que vous suivez 
                  pour financer leurs SMS de notification.
                </p>
                <p className="text-sm text-amber-700">
                  Chaque mois, environ 1,25€ est crédité dans la cagnotte de vos pêcheurs favoris. 
                  C'est une façon concrète de soutenir la pêche artisanale locale.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                onClick={() => handleSubscribe(CLIENT_LEVELS.premium.priceIdAnnual, "premium_annual")}
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