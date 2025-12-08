import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Fish, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const PoissonFraisToulon = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "QuaiDirect Toulon",
    "description": "Poisson frais à Toulon - Vente directe des marins-pêcheurs au port",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Toulon",
      "addressRegion": "Var",
      "postalCode": "83000",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "43.1242",
      "longitude": "5.928"
    },
    "url": "https://quaidirect.fr/poisson-frais-toulon",
    "priceRange": "€€",
    "openingHours": "Mo-Su 08:00-10:00"
  };

  return (
    <>
      <Helmet>
        <title>Poisson Frais à Toulon | Vente Directe Port de Toulon Var 83</title>
        <meta name="description" content="Achetez votre poisson frais à Toulon au port auprès des marins-pêcheurs. Loup, daurade, rouget, anchois. Pêche artisanale méditerranéenne, circuit court garanti." />
        <meta name="keywords" content="poisson frais toulon, marins pêcheurs toulon, port toulon, poisson var toulon, pêche locale toulon, loup toulon, daurade toulon, vente directe poisson toulon" />
        <link rel="canonical" href="https://quaidirect.fr/poisson-frais-toulon" />
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero */}
        <section className="container px-4 py-16 bg-gradient-ocean/5">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Port de Toulon, Var (83)</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground">
              Poisson frais à Toulon
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Achetez votre poisson ultra-frais directement auprès des marins-pêcheurs du port de Toulon. 
              Loup de Méditerranée, daurade, rouget, anchois : pêche artisanale locale à prix direct.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/carte">
                <Button size="lg" className="gap-2">
                  <Fish className="h-5 w-5" aria-hidden="true" />
                  Voir les arrivages à Toulon
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Espèces */}
        <section className="container px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Poissons du port de Toulon
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Loup (Bar) de ligne</h3>
                  <p className="text-muted-foreground">
                    Pêché à la ligne en Méditerranée au large de Toulon. Qualité supérieure, 
                    chair ferme et goût délicat. Produit noble de nos côtes varoises.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Daurade royale</h3>
                  <p className="text-muted-foreground">
                    Daurade sauvage pêchée aux casiers et filets dans les eaux toulonnaises. 
                    Espèce emblématique de la gastronomie méditerranéenne.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Rouget barbet</h3>
                  <p className="text-muted-foreground">
                    Rouget de roche pêché au filet dans la rade de Toulon et alentours. 
                    Goût prononcé typique, parfait grillé ou en bouillabaisse.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Anchois frais</h3>
                  <p className="text-muted-foreground">
                    Petits poissons bleus pêchés au lamparo la nuit. Spécialité toulonnaise, 
                    délicieux marinés ou frits.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Infos pratiques */}
        <section className="container px-4 py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Acheter du poisson frais à Toulon
            </h2>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">📍 Où récupérer ?</h3>
                  <p className="text-muted-foreground">
                    Les marins-pêcheurs vendent sur leurs stands au port de Toulon (quai Cronstadt et quai Stalingrad). 
                    L&apos;emplacement précis est indiqué dans chaque annonce.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">⏰ Horaires</h3>
                  <p className="text-muted-foreground">
                    Vente généralement entre 8h et 10h selon l&apos;heure de retour des bateaux. 
                    Créneaux précis lors de la réservation en ligne.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">🐟 Fraîcheur garantie</h3>
                  <p className="text-muted-foreground">
                    Poisson pêché le matin même en Méditerranée, débarqué à Toulon et vendu quelques heures après. 
                    Traçabilité totale du bateau à votre assiette.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container px-4 py-16 border-t">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Commandez votre poisson frais à Toulon
            </h2>
            <p className="text-lg text-muted-foreground">
              Consultez les arrivages en temps réel et réservez directement auprès de nos pêcheurs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/carte">
                <Button size="lg" className="gap-2">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  Arrivages Toulon
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

export default PoissonFraisToulon;
