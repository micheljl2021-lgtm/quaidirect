import { Link } from "react-router-dom";
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
  ArrowRight
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const DevenirPecheur = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="container px-4 py-16 bg-gradient-ocean/5">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Fish className="h-4 w-4 text-primary" />
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
                <Fish className="h-5 w-5" />
                S&apos;inscrire maintenant
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/ambassadeur-partenaire">
              <Button size="lg" variant="outline" className="gap-2">
                <Star className="h-5 w-5" />
                Voir nos ambassadeurs
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
              Deux formules adaptées à vos besoins
            </h2>
            <p className="text-lg text-muted-foreground">
              Choisissez le plan qui correspond à votre activité
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Plan Basic */}
            <Card className="border-2">
              <CardContent className="pt-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Plan Basic</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">99€</span>
                    <span className="text-muted-foreground">/an</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Vitrine digitale personnalisée</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Création arrivages illimitée (2 min)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Emails illimités à vos clients</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Partage WhatsApp automatique</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">IA pour textes et descriptions</span>
                  </li>
                </ul>

                <Link to="/pecheur/payment" className="block">
                  <Button className="w-full" size="lg">
                    Choisir Basic
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plan Pro */}
            <Card className="border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full">
                Recommandé
              </div>
              <CardContent className="pt-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Plan Pro</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">199€</span>
                    <span className="text-muted-foreground">/an</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">Tout le plan Basic +</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">IA avancée pour prix et météo</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Statistiques et analyses détaillées</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Multi-points de vente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Support prioritaire</span>
                  </li>
                </ul>

                <Link to="/pecheur/payment" className="block">
                  <Button className="w-full" size="lg" variant="default">
                    Choisir Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            SMS disponibles en option après inscription • Commission de 8% sur les paniers
          </p>
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
                  <Euro className="h-5 w-5 text-primary" />
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
                  <Clock className="h-5 w-5 text-primary" />
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
                  <Users className="h-5 w-5 text-primary" />
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
                  <Smartphone className="h-5 w-5 text-primary" />
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
                  <MessageSquare className="h-5 w-5 text-primary" />
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
                  <TrendingUp className="h-5 w-5 text-primary" />
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
                    <Fish className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Sébastien Z.</h3>
                    <p className="text-sm text-muted-foreground">Hyères • Ligneur</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  &quot;J&apos;ai doublé mon chiffre d&apos;affaires en un an. Plus besoin de courir 
                  après les restaurants, mes clients viennent directement au port.&quot;
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Fish className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Sébastien P.</h3>
                    <p className="text-sm text-muted-foreground">Carqueiranne • Caseyeur</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  &quot;Interface ultra-simple. En 2 minutes mon arrivage est publié 
                  et mes 80 clients sont prévenus. Un vrai gain de temps !&quot;
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
            Prêt à vendre en direct ?
          </h2>
          <p className="text-lg text-muted-foreground">
            Rejoignez les marins-pêcheurs qui ont choisi l&apos;autonomie et la rentabilité.
          </p>
          <Link to="/pecheur/payment">
            <Button size="lg" className="gap-2">
              <Fish className="h-5 w-5" />
              S&apos;inscrire maintenant
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            Questions ? Contactez-nous à{" "}
            <a href="mailto:CEO@quaidirect.fr" className="text-primary hover:underline">
              CEO@quaidirect.fr
            </a>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DevenirPecheur;
