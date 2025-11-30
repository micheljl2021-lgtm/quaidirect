import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Mail, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Premium = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const premiumFeatures = [
    "Soutenez les points de vente",
    "Notifications prioritaires par mail",
    "Alertes sur vos poissons favoris",
    "Badge Premium visible",
  ];

  const premiumPlusFeatures = [
    ...premiumFeatures,
    "Notifications SMS en temps réel",
    "Alertes 'dernières pièces'",
    "Alertes ouvertures exceptionnelles",
  ];

  return (
    <div className="min-h-screen bg-gradient-sky">
      <Header />
      
      <div className="container px-4 py-16">
        {/* Hero */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-premium/10 border border-premium/20">
            <Crown className="h-5 w-5 text-premium" />
            <span className="font-medium text-premium-foreground">QuaiDirect Premium</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Les meilleurs arrivages,
            <span className="block bg-gradient-ocean bg-clip-text text-transparent">
              en avant-première
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Soutenez les points de vente et recevez des alertes sur vos espèces favorites
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Column 1: Premium */}
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">Premium</h2>
              <p className="text-muted-foreground">Notifications mail prioritaires</p>
            </div>

            {/* Premium Monthly */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Mensuel</CardTitle>
                <CardDescription>Sans engagement</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-foreground">2€</span>
                  <span className="text-muted-foreground"> / mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-gradient-ocean hover:opacity-90 transition-opacity" size="lg">
                  <Mail className="mr-2 h-5 w-5" />
                  Passer en Premium
                </Button>
                <div className="space-y-3">
                  {premiumFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Premium Annual */}
            <Card className="border-2 border-primary shadow-ocean relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent">
                2 mois offerts
              </Badge>
              <CardHeader>
                <CardTitle className="text-xl">Annuel</CardTitle>
                <CardDescription>Meilleur rapport qualité/prix</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-foreground">20€</span>
                  <span className="text-muted-foreground"> / an</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Soit 1,67€/mois
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-gradient-ocean hover:opacity-90 transition-opacity" size="lg">
                  <Mail className="mr-2 h-5 w-5" />
                  Économiser 17%
                </Button>
                <div className="space-y-3">
                  {premiumFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Premium+ */}
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">Premium+</h2>
              <p className="text-muted-foreground">Premium + Notifications SMS</p>
            </div>

            {/* Premium+ Monthly */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Mensuel</CardTitle>
                <CardDescription>Sans engagement</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-foreground">4€</span>
                  <span className="text-muted-foreground"> / mois</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity" size="lg">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Passer en Premium+
                </Button>
                <div className="space-y-3">
                  {premiumPlusFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Premium+ Annual */}
            <Card className="border-2 border-accent shadow-lg relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white">
                2 mois offerts
              </Badge>
              <CardHeader>
                <CardTitle className="text-xl">Annuel</CardTitle>
                <CardDescription>Meilleur rapport qualité/prix</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold text-foreground">40€</span>
                  <span className="text-muted-foreground"> / an</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Soit 3,33€/mois
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity" size="lg">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Économiser 17%
                </Button>
                <div className="space-y-3">
                  {premiumPlusFeatures.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
