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
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PecheursLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="container px-4 py-16 bg-gradient-ocean/5">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Fish className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium">Plateforme dédiée aux marins-pêcheurs</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground">
            Vendez votre pêche en direct, gardez vos marges
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            QuaiDirect vous permet de vendre directement à vos clients sans intermédiaire, 
            d'automatiser votre communication et de développer votre clientèle locale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/pecheurs/tarifs">
              <Button size="lg" className="gap-2">
                Découvrir les tarifs
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/ambassadeur-partenaire">
              <Button size="lg" variant="outline" className="gap-2">
                Nos ambassadeurs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Avantages principaux */}
      <section className="container px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Pourquoi choisir QuaiDirect ?
            </h2>
            <p className="text-lg text-muted-foreground">
              Une solution complète pour développer votre activité
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Euro className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Meilleure rentabilité</h3>
                <p className="text-muted-foreground">
                  Vendez 20-40% plus cher qu'en criée. Fixez vos prix, gardez vos marges.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Gain de temps</h3>
                <p className="text-muted-foreground">
                  Publiez un arrivage en 2 minutes. Communication automatique avec vos clients.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Clientèle fidèle</h3>
                <p className="text-muted-foreground">
                  Construisez votre base de clients réguliers qui valorisent votre travail.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Smartphone className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">100% mobile</h3>
                <p className="text-muted-foreground">
                  Interface optimisée pour smartphone. Gérez tout depuis votre téléphone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Communication simplifiée</h3>
                <p className="text-muted-foreground">
                  Emails, SMS et WhatsApp automatiques. Vos clients sont prévenus en temps réel.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Visibilité accrue</h3>
                <p className="text-muted-foreground">
                  Bénéficiez du trafic QuaiDirect pour attirer de nouveaux clients.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="container px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Vitrine digitale personnalisée</h4>
                  <p className="text-sm text-muted-foreground">
                    Votre propre page avec vos photos, descriptions et coordonnées
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Création d'arrivages en 2 minutes</h4>
                  <p className="text-sm text-muted-foreground">
                    Interface intuitive avec IA pour vous aider sur les textes
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Gestion de contacts CRM</h4>
                  <p className="text-sm text-muted-foreground">
                    Organisez vos clients, segmentez vos communications
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Multi-points de vente</h4>
                  <p className="text-sm text-muted-foreground">
                    Gérez plusieurs lieux de vente avec horaires et coordonnées
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Notifications automatiques</h4>
                  <p className="text-sm text-muted-foreground">
                    Email, SMS et WhatsApp envoyés automatiquement à vos clients
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">IA intégrée</h4>
                  <p className="text-sm text-muted-foreground">
                    Aide à la rédaction, suggestions de prix, prévisions météo
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Statistiques détaillées</h4>
                  <p className="text-sm text-muted-foreground">
                    Suivez votre CA estimé, nombre de clients touchés, taux d'ouverture
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Programme d'affiliation</h4>
                  <p className="text-sm text-muted-foreground">
                    Gagnez des crédits SMS quand vos clients passent Premium
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16 border-t">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            Prêt à rejoindre QuaiDirect ?
          </h2>
          <p className="text-lg text-muted-foreground">
            Découvrez nos plans et choisissez celui qui correspond à votre activité
          </p>
          <Link to="/pecheurs/tarifs">
            <Button size="lg" className="gap-2">
              <Fish className="h-5 w-5" aria-hidden="true" />
              Voir les tarifs
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
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

export default PecheursLanding;
