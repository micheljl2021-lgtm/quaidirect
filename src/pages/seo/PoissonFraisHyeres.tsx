import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Fish, Anchor, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const PoissonFraisHyeres = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "QuaiDirect Hyères",
    "description": "Poisson frais à Hyères - Vente directe des marins-pêcheurs au port",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Hyères",
      "addressRegion": "Var",
      "postalCode": "83400",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "43.0994",
      "longitude": "6.1288"
    },
    "url": "https://quaidirect.fr/poisson-frais-hyeres",
    "telephone": "+33000000000",
    "priceRange": "€€",
    "openingHours": "Mo-Su 08:00-10:00"
  };

  return (
    <>
      <Helmet>
        <title>Poisson Frais à Hyères | Vente Directe Marins-Pêcheurs Port Hyères</title>
        <meta name="description" content="Achetez du poisson frais à Hyères directement au port auprès des marins-pêcheurs. Bar de ligne, dorade, rouget du Var. Pêche artisanale locale, traçabilité garantie." />
        <meta name="keywords" content="poisson frais hyères, marins pêcheurs hyères, port hyères, poisson var, pêche locale hyères, bar de ligne hyères, dorade hyères, vente directe poisson hyères" />
        <link rel="canonical" href="https://quaidirect.fr/poisson-frais-hyeres" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Local */}
        <section className="container px-4 py-16 bg-gradient-ocean/5">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Port d&apos;Hyères, Var (83)</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground">
              Poisson frais à Hyères
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez les arrivages quotidiens de nos marins-pêcheurs artisanaux basés au port d&apos;Hyères. 
              Bar de ligne, dorade royale, rouget, pageot : poisson ultra-frais pêché le matin même en Méditerranée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/carte">
                <Button size="lg" className="gap-2">
                  <Fish className="h-5 w-5" aria-hidden="true" />
                  Voir les arrivages à Hyères
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Espèces typiques */}
        <section className="container px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Poissons disponibles au port d&apos;Hyères
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Bar de ligne</h3>
                  <p className="text-muted-foreground">
                    Pêché à la ligne par nos ligneurs professionnels au large d&apos;Hyères et de Porquerolles. 
                    Chair ferme et délicate, qualité supérieure.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Dorade royale</h3>
                  <p className="text-muted-foreground">
                    Dorade sauvage de Méditerranée, pêchée aux casiers et filets. 
                    Espèce noble prisée pour sa finesse en bouche.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Rouget du Var</h3>
                  <p className="text-muted-foreground">
                    Rouget barbet et grondin pêchés au petit chalut ou au filet dans les fonds côtiers varois. 
                    Goût prononcé typique de la Méditerranée.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Pageot & Sar</h3>
                  <p className="text-muted-foreground">
                    Poissons de roche emblématiques de la côte varoise, excellents grillés ou en bouillabaisse.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pêcheurs locaux */}
        <section className="container px-4 py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
              Marins-pêcheurs à Hyères
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Rencontrez les professionnels de la pêche artisanale qui travaillent au départ du port d&apos;Hyères
            </p>

              <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Anchor className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Sébastien Z. - Pêcheur professionnel</h3>
                    <p className="text-sm text-muted-foreground">Ligneur professionnel • Port d&apos;Hyères</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Pêche à la ligne de bar, dorade et autres poissons nobles en Méditerranée. 
                  Sébastien est l&apos;un des pionniers de QuaiDirect et garantit une qualité exceptionnelle.
                </p>
                <Link to="/carte">
                  <Button variant="outline" className="gap-2">
                    Voir les arrivages
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Informations pratiques */}
        <section className="container px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Comment acheter du poisson frais à Hyères ?
            </h2>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">📍 Où récupérer ?</h3>
                  <p className="text-muted-foreground">
                    Les marins-pêcheurs vendent directement sur leurs stands au port d&apos;Hyères (Quai de la Marine). 
                    Vérifiez l&apos;emplacement exact dans chaque annonce d&apos;arrivage.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">⏰ Horaires de vente</h3>
                  <p className="text-muted-foreground">
                    Généralement entre 8h et 10h du matin, selon l&apos;heure de retour du bateau. 
                    Les créneaux précis sont indiqués lors de la réservation en ligne.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">💳 Paiement</h3>
                  <p className="text-muted-foreground">
                    Réservez et payez en ligne sur QuaiDirect, puis récupérez votre poisson au créneau choisi. 
                    Simple, rapide et sécurisé.
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
              Commandez votre poisson frais à Hyères
            </h2>
            <p className="text-lg text-muted-foreground">
              Consultez les arrivages en temps réel et réservez directement auprès de nos marins-pêcheurs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/carte">
                <Button size="lg" className="gap-2">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  Arrivages Hyères
                </Button>
              </Link>
              <Link to="/comment-ca-marche">
                <Button size="lg" variant="outline">
                  Comment ça marche ?
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default PoissonFraisHyeres;
