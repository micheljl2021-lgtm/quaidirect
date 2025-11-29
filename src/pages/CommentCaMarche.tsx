import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Bell, 
  ShoppingCart, 
  Calendar,
  Fish,
  CheckCircle2,
  ArrowRight,
  Users,
  Shield
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CommentCaMarche = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="container px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl font-bold text-foreground">
            Comment ça marche ?
          </h1>
          <p className="text-xl text-muted-foreground">
            Du quai à votre assiette en 3 étapes simples. 
            Découvrez comment acheter du poisson ultra-frais directement auprès des marins-pêcheurs.
          </p>
        </div>
      </section>

      {/* Étapes pour les clients */}
      <section className="container px-4 py-16 border-t">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Pour les clients</h2>
            <p className="text-lg text-muted-foreground">
              3 étapes pour recevoir votre poisson frais
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <Card className="relative">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <CardContent className="pt-8 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Consultez les arrivages
                </h3>
                <p className="text-muted-foreground">
                  Parcourez la carte des ports et découvrez les arrivages de poisson frais. 
                  Filtrez par espèce, port ou pêcheur selon vos préférences.
                </p>
              </CardContent>
            </Card>

            {/* Étape 2 */}
            <Card className="relative">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <CardContent className="pt-8 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Commandez en ligne
                </h3>
                <p className="text-muted-foreground">
                  Réservez vos produits directement sur la plateforme. 
                  Choisissez votre créneau horaire de retrait et payez en ligne de façon sécurisée.
                </p>
              </CardContent>
            </Card>

            {/* Étape 3 */}
            <Card className="relative">
              <div className="absolute -top-4 left-6 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <CardContent className="pt-8 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Récupérez au port
                </h3>
                <p className="text-muted-foreground">
                  Venez retirer votre poisson frais directement au point de vente du pêcheur, 
                  au créneau horaire choisi. Simple et rapide !
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Étapes pour les pêcheurs */}
      <section className="container px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Pour les marins-pêcheurs</h2>
            <p className="text-lg text-muted-foreground">
              Vendez votre pêche en direct, sans intermédiaire
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Créez votre arrivage
                </h3>
                <p className="text-muted-foreground">
                  En moins de 2 minutes, publiez votre arrivage : espèces, quantités, prix, 
                  horaire de vente et point de retrait.
                </p>
              </CardContent>
            </Card>

            {/* Étape 2 */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Vos clients sont alertés
                </h3>
                <p className="text-muted-foreground">
                  Votre base de clients fidèles reçoit automatiquement une notification. 
                  Plus besoin de messages manuels !
                </p>
              </CardContent>
            </Card>

            {/* Étape 3 */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Vendez au port
                </h3>
                <p className="text-muted-foreground">
                  Les clients viennent retirer leurs commandes au créneau indiqué. 
                  Simple, direct, rentable.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Link to="/pecheur/payment">
              <Button size="lg" className="gap-2">
                <Fish className="h-5 w-5" />
                Devenir pêcheur partenaire
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="container px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Pourquoi QuaiDirect ?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Traçabilité totale</h3>
                <p className="text-muted-foreground">
                  Connaissez l&apos;origine exacte de votre poisson : qui l&apos;a pêché, où, quand et comment. 
                  Transparence garantie du bateau à l&apos;assiette.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Prix justes</h3>
                <p className="text-muted-foreground">
                  Sans intermédiaire, le pêcheur est mieux rémunéré et vous payez le juste prix. 
                  Circuit ultra-court gagnant-gagnant.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Fish className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Fraîcheur maximale</h3>
                <p className="text-muted-foreground">
                  Le poisson va directement du bateau à votre panier. 
                  Quelques heures seulement entre la pêche et votre cuisine.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Pêche locale</h3>
                <p className="text-muted-foreground">
                  Soutenez les marins-pêcheurs artisanaux français et la pêche responsable. 
                  Consommez local et durable.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container px-4 py-16 border-t">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            Prêt à découvrir le poisson ultra-frais ?
          </h2>
          <p className="text-lg text-muted-foreground">
            Explorez les arrivages près de chez vous et commandez votre premier panier.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/carte">
              <Button size="lg" className="gap-2">
                <MapPin className="h-5 w-5" />
                Voir la carte des ports
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/arrivages">
              <Button size="lg" variant="outline" className="gap-2">
                <Fish className="h-5 w-5" />
                Consulter les arrivages
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CommentCaMarche;
