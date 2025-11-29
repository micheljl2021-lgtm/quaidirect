import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Fish, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet";

const PoissonFraisLaRochelle = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "QuaiDirect La Rochelle",
    "description": "Poisson frais à La Rochelle - Vente directe des marins-pêcheurs au port",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "La Rochelle",
      "addressRegion": "Charente-Maritime",
      "postalCode": "17000",
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "46.1591",
      "longitude": "-1.1520"
    },
    "url": "https://quaidirect.fr/poisson-frais-la-rochelle",
    "priceRange": "€€",
    "openingHours": "Mo-Su 08:00-10:00"
  };

  return (
    <>
      <Helmet>
        <title>Poisson Frais à La Rochelle | Vente Directe Port La Rochelle 17</title>
        <meta name="description" content="Achetez du poisson frais à La Rochelle directement au port auprès des marins-pêcheurs. Bar, sole, maigre, crevettes. Pêche atlantique artisanale, circuit court." />
        <meta name="keywords" content="poisson frais la rochelle, marins pêcheurs la rochelle, port la rochelle, poisson charente maritime, pêche locale la rochelle, bar la rochelle, sole la rochelle, vente directe poisson la rochelle" />
        <link rel="canonical" href="https://quaidirect.fr/poisson-frais-la-rochelle" />
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
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Port de La Rochelle, Charente-Maritime (17)</span>
            </div>
            <h1 className="text-5xl font-bold text-foreground">
              Poisson frais à La Rochelle
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez les arrivages quotidiens de nos marins-pêcheurs rochelais. 
              Bar de ligne, sole, maigre, crevettes de l&apos;Atlantique : poisson ultra-frais pêché le matin même.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/carte">
                <Button size="lg" className="gap-2">
                  <Fish className="h-5 w-5" />
                  Voir les arrivages à La Rochelle
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Espèces */}
        <section className="container px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Poissons disponibles au port de La Rochelle
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Bar de ligne</h3>
                  <p className="text-muted-foreground">
                    Bar sauvage pêché à la ligne au large de La Rochelle et de l&apos;île de Ré. 
                    Qualité supérieure, chair fine et délicate.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Sole de nos côtes</h3>
                  <p className="text-muted-foreground">
                    Sole commune pêchée au filet dans les eaux charentaises. 
                    Poisson plat noble prisé pour sa finesse.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Maigre</h3>
                  <p className="text-muted-foreground">
                    Grand poisson emblématique de l&apos;Atlantique, pêché à la ligne et au filet. 
                    Chair ferme excellente grillée ou au four.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Crevettes grises</h3>
                  <p className="text-muted-foreground">
                    Crevettes de l&apos;Atlantique pêchées au chalut. Spécialité locale rochelaise, 
                    idéales en salade ou à la plancha.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Port de La Rochelle */}
        <section className="container px-4 py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">
              La pêche artisanale à La Rochelle
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Le port de La Rochelle abrite une flotte de pêcheurs artisanaux attachés à une pêche durable 
              et respectueuse des ressources atlantiques
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">🎣 Techniques de pêche</h3>
                  <p className="text-muted-foreground">
                    Ligne, filet, chalut de fond : nos pêcheurs rochelais utilisent des méthodes 
                    sélectives pour préserver la qualité et la ressource.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">🌊 Zone de pêche</h3>
                  <p className="text-muted-foreground">
                    Atlantique côtier, pertuis charentais, au large de l&apos;île de Ré et d&apos;Oléron. 
                    Eaux riches en biodiversité.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Infos pratiques */}
        <section className="container px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Comment acheter du poisson frais à La Rochelle ?
            </h2>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">📍 Où récupérer ?</h3>
                  <p className="text-muted-foreground">
                    Les marins-pêcheurs vendent sur leurs stands au port de La Rochelle (Quai Duperré, Bassin des Chalutiers). 
                    Emplacement exact dans chaque annonce d&apos;arrivage.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">⏰ Horaires de vente</h3>
                  <p className="text-muted-foreground">
                    Généralement entre 8h et 10h du matin selon l&apos;heure de retour des bateaux. 
                    Créneaux précis lors de la réservation.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">💳 Réservation en ligne</h3>
                  <p className="text-muted-foreground">
                    Commandez et payez en ligne sur QuaiDirect, puis récupérez votre poisson au créneau choisi. 
                    Simple et sécurisé.
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
              Commandez votre poisson frais à La Rochelle
            </h2>
            <p className="text-lg text-muted-foreground">
              Consultez les arrivages en temps réel et réservez directement auprès de nos marins-pêcheurs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/carte">
                <Button size="lg" className="gap-2">
                  <MapPin className="h-5 w-5" />
                  Arrivages La Rochelle
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

export default PoissonFraisLaRochelle;
