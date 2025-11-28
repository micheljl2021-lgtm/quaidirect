import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, MapPin, Bell, Star } from "lucide-react";

const Premium = () => {
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

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Monthly */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Mensuel</CardTitle>
              <CardDescription>Sans engagement</CardDescription>
              <div className="pt-4">
                <span className="text-5xl font-bold text-foreground">4,99€</span>
                <span className="text-muted-foreground"> / mois</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-gradient-ocean hover:opacity-90 transition-opacity" size="lg">
                Commencer maintenant
              </Button>
              <div className="space-y-3">
                {[
                  "Soutenez les points de vente",
                  "Alertes poissons favoris",
                  "Notifications prioritaires",
                  "Essai gratuit 7 jours"
                ].map((feature, i) => (
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

          {/* Annual */}
          <Card className="relative border-2 border-primary shadow-ocean">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent">
              2 mois offerts
            </Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Annuel</CardTitle>
              <CardDescription>Meilleur rapport qualité/prix</CardDescription>
              <div className="pt-4">
                <span className="text-5xl font-bold text-foreground">39€</span>
                <span className="text-muted-foreground"> / an</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Soit 3,25€/mois
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-gradient-ocean hover:opacity-90 transition-opacity" size="lg">
                Économiser 35%
              </Button>
              <div className="space-y-3">
                {[
                  "Soutenez les points de vente",
                  "Alertes poissons favoris",
                  "Notifications prioritaires",
                  "Badge Premium visible",
                  "Essai gratuit 7 jours"
                ].map((feature, i) => (
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

        {/* Features Details */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Tout ce que vous obtenez avec Premium
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Soutenez les points de vente
                </h3>
                <p className="text-muted-foreground">
                  Une partie de votre abonnement aide à financer et améliorer les stands à quai de vos marins pêcheurs préférés.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Alertes poissons favoris
                </h3>
                <p className="text-muted-foreground">
                  Choisissez vos espèces préférées et recevez des notifications dès qu'un point de vente les propose.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Alertes personnalisées
                </h3>
                <p className="text-muted-foreground">
                  Recevez des notifications pour vos espèces et ports préférés dès qu'un arrivage est annoncé.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Badge exclusif
                </h3>
                <p className="text-muted-foreground">
                  Affichez votre statut Premium et soutenez activement la pêche artisanale.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Accès illimité
                </h3>
                <p className="text-muted-foreground">
                  Profitez de tous les avantages Premium sans restriction sur tous vos arrivages.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Sans engagement
                </h3>
                <p className="text-muted-foreground">
                  Résiliez à tout moment en un clic depuis votre compte. Aucune question posée.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-ocean border-0">
            <CardContent className="pt-8 pb-8 space-y-6">
              <Crown className="h-12 w-12 text-primary-foreground mx-auto" />
              <h3 className="text-3xl font-bold text-primary-foreground">
                Prêt à passer Premium ?
              </h3>
              <p className="text-primary-foreground/90">
                Rejoignez les centaines d'utilisateurs qui ne ratent plus jamais un arrivage
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-background text-foreground hover:bg-background/90"
              >
                Commencer l'essai gratuit 7 jours
              </Button>
              <p className="text-sm text-primary-foreground/70">
                Annulez à tout moment • Sans engagement
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Premium;
