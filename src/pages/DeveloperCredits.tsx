import { Helmet } from "react-helmet";
import { Code, Clock, Calendar, Anchor, Ship, Fish, Users, Database, CreditCard, Bell, Map, Sparkles, Trophy, Zap, Moon, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const DeveloperCredits = () => {
  // Configuration - Valeurs vérifiées et réalistes
  const startDate = "9 Novembre 2025";
  const hoursPerDay = 14; // Moyenne réaliste (souvent 16-18h)
  const totalDays = 45; // Du 9 nov au 23 déc 2025
  const totalHours = 630; // ~14h × 45 jours

  // Stats vérifiées par analyse du projet
  const projectStats = {
    pages: 50,
    components: 150,
    edgeFunctions: 49,
    hooks: 15,
    tables: 40,
    tests: 26
  };

  const weeklyTimeline = [
    {
      week: "Semaine 1",
      period: "9-15 Nov 2025",
      title: "Fondations",
      hours: 98, // 14h × 7j
      items: [
        "Setup projet React + TypeScript + Vite",
        "Design system maritime personnalisé (Tailwind)",
        "Architecture Supabase complète (Auth, DB, Storage)",
        "Schéma multi-rôles (visitor, user, premium, fisherman, admin)",
        "Première version Header, Footer, Navigation",
        "Configuration RLS sécurité de base"
      ],
      highlight: "Architecture solide dès le départ"
    },
    {
      week: "Semaine 2",
      period: "16-22 Nov 2025",
      title: "Base Pêcheur",
      hours: 98,
      items: [
        "Schéma BDD complet : fishermen, drops, species, ports...",
        "Onboarding pêcheur 6 étapes avec validation",
        "Dashboard pêcheur v1 avec statistiques",
        "Composants clés : ArrivageCard, SpeciesSelector",
        "Gestion des photos avec upload Supabase Storage",
        "Premiers tests et corrections"
      ],
      highlight: "40+ tables créées en une semaine"
    },
    {
      week: "Semaine 3",
      period: "23-29 Nov 2025",
      title: "Arrivages & UX",
      hours: 98,
      items: [
        "Système d'arrivages Express (publication en 20s)",
        "Wizard d'arrivage détaillé 3 étapes",
        "Gestion espèces avec photos par défaut intelligentes",
        "Points de vente personnalisés avec géolocalisation",
        "Templates et presets d'arrivages",
        "Interface 'fatigue-proof' : gros boutons, contraste fort"
      ],
      highlight: "UX pensée pour 2h du matin"
    },
    {
      week: "Semaine 4",
      period: "30 Nov - 6 Déc 2025",
      title: "Espace Client",
      hours: 98,
      items: [
        "Landing page SEO optimisée",
        "Liste arrivages avec filtres (port, espèce, date)",
        "Carte Google Maps interactive (ports + arrivages)",
        "Profils pêcheurs publics (micro-sites SEO)",
        "Système de suivi (ports/espèces favoris)",
        "Pages SEO locales (Hyères, Toulon, La Rochelle)"
      ],
      highlight: "Micro-sites générés automatiquement"
    },
    {
      week: "Semaine 5",
      period: "7-13 Déc 2025",
      title: "Paiements & Premium",
      hours: 98,
      items: [
        "Intégration Stripe complète (checkout, webhooks)",
        "Abonnements pêcheurs Basic/Pro",
        "Système paniers clients (25€ / 45€ / 75€)",
        "Customer Portal Stripe intégré",
        "Abonnement Premium clients avec préférences",
        "Notifications prioritaires selon niveau"
      ],
      highlight: "Stripe 100% fonctionnel en 7 jours"
    },
    {
      week: "Semaine 6",
      period: "14-20 Déc 2025",
      title: "Notifications & IA",
      hours: 98,
      items: [
        "49 Edge Functions déployées !",
        "Emails transactionnels via Resend",
        "Notifications Push Firebase FCM",
        "IA du Marin : assistant intelligent pêcheurs",
        "Génération SEO automatique des profils",
        "Génération descriptions IA, recettes IA"
      ],
      highlight: "49 Edge Functions en production"
    },
    {
      week: "Semaine 7",
      period: "21-23 Déc 2025",
      title: "Admin & Sécurité",
      hours: 42, // 14h × 3j
      items: [
        "Dashboard admin complet (19 composants)",
        "Validation pêcheurs + gestion abonnements",
        "Mises à jour plateforme (broadcast email)",
        "Audit sécurité RLS complet",
        "PWA avec Service Worker",
        "Tests, optimisations, corrections finales"
      ],
      highlight: "Audit sécurité 100% passé"
    }
  ];

  const techStack = [
    { name: "React 18", category: "Frontend" },
    { name: "TypeScript", category: "Frontend" },
    { name: "Vite", category: "Build" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "Shadcn/ui", category: "Components" },
    { name: "React Query", category: "Data" },
    { name: "React Router", category: "Routing" },
    { name: "Supabase", category: "Backend" },
    { name: "PostgreSQL", category: "Database" },
    { name: "Edge Functions", category: "Serverless" },
    { name: "Stripe", category: "Payments" },
    { name: "Resend", category: "Email" },
    { name: "Firebase FCM", category: "Push" },
    { name: "Google Maps", category: "Maps" },
    { name: "OpenAI / Gemini", category: "IA" },
    { name: "Framer Motion", category: "Animation" }
  ];

  return (
    <>
      <Helmet>
        <title>Crédits Développeur - QuaiDirect</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
          <div className="container mx-auto px-4 py-16 relative">
            <div className="text-center max-w-3xl mx-auto">
              {/* Solo Developer Badge */}
              <div className="flex justify-center mb-4">
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-2 text-sm font-bold shadow-lg">
                  <Trophy className="h-4 w-4 mr-2" />
                  SOLO DEVELOPER CHALLENGE
                </Badge>
              </div>

              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                  <Anchor className="h-12 w-12 text-primary" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Jean-Louis Michel
              </h1>
              <p className="text-xl text-muted-foreground mb-2">
                Développeur unique & Créateur de QuaiDirect
              </p>
              <p className="text-lg text-primary font-medium mb-6">
                Depuis le {startDate}
              </p>

              {/* Achievement Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full px-6 py-3 border border-primary/30">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">
                  App full-stack production-ready en 45 jours
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Exploit Technique */}
          <Card className="mb-12 border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="h-8 w-8 text-amber-500" />
                <h2 className="text-2xl font-bold text-foreground">L'Exploit Technique</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-4xl font-bold text-primary mb-1">45</p>
                  <p className="text-muted-foreground">jours de dev</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary mb-1">1</p>
                  <p className="text-muted-foreground">seul développeur</p>
                </div>
                <div>
                  <p className="text-4xl font-bold text-primary mb-1">0</p>
                  <p className="text-muted-foreground">template utilisé</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-background/50 rounded-lg">
                <p className="text-center text-muted-foreground">
                  <Moon className="inline h-4 w-4 mr-1" />
                  Nuits blanches, weekends inclus
                  <Coffee className="inline h-4 w-4 ml-3 mr-1" />
                  Alimenté au café ☕
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards avec barres de progression */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card className="text-center border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{totalHours}</p>
                <p className="text-sm text-muted-foreground mb-2">Heures totales</p>
                <Progress value={100} className="h-2" />
              </CardContent>
            </Card>
            
            <Card className="text-center border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{hoursPerDay}h</p>
                <p className="text-sm text-muted-foreground mb-2">Par jour (moy.)</p>
                <Progress value={(hoursPerDay / 24) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card className="text-center border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <Code className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{projectStats.pages}+</p>
                <p className="text-sm text-muted-foreground mb-2">Pages créées</p>
                <Progress value={80} className="h-2" />
              </CardContent>
            </Card>

            <Card className="text-center border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{projectStats.components}+</p>
                <p className="text-sm text-muted-foreground mb-2">Composants</p>
                <Progress value={90} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Stats supplémentaires */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-12">
            <Card className="text-center border-primary/20 bg-card/30 p-4">
              <p className="text-2xl font-bold text-foreground">{projectStats.edgeFunctions}</p>
              <p className="text-xs text-muted-foreground">Edge Functions</p>
            </Card>
            <Card className="text-center border-primary/20 bg-card/30 p-4">
              <p className="text-2xl font-bold text-foreground">{projectStats.hooks}</p>
              <p className="text-xs text-muted-foreground">Hooks custom</p>
            </Card>
            <Card className="text-center border-primary/20 bg-card/30 p-4">
              <p className="text-2xl font-bold text-foreground">{projectStats.tables}+</p>
              <p className="text-xs text-muted-foreground">Tables DB</p>
            </Card>
            <Card className="text-center border-primary/20 bg-card/30 p-4">
              <p className="text-2xl font-bold text-foreground">{projectStats.tests}+</p>
              <p className="text-xs text-muted-foreground">Tests</p>
            </Card>
            <Card className="text-center border-primary/20 bg-card/30 p-4">
              <p className="text-2xl font-bold text-foreground">5</p>
              <p className="text-xs text-muted-foreground">Rôles utilisateur</p>
            </Card>
            <Card className="text-center border-primary/20 bg-card/30 p-4">
              <p className="text-2xl font-bold text-foreground">3</p>
              <p className="text-xs text-muted-foreground">Intégrations IA</p>
            </Card>
          </div>

          {/* Vision & Mission */}
          <Card className="mb-12 border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Ship className="h-6 w-6 text-primary" />
                La Vision QuaiDirect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground">
              <p className="text-lg leading-relaxed">
                QuaiDirect est né d'une conviction simple : <strong className="text-foreground">les pêcheurs artisanaux méritent 
                de vendre leur pêche en direct, sans intermédiaires, à un prix juste.</strong>
              </p>
              <p className="leading-relaxed">
                Cette web-app a été conçue pour être utilisable "à la frontale", même à 2h du matin en 
                rentrant de mer. Chaque fonctionnalité a été pensée pour la réalité du métier : 
                gros boutons, parcours simples, publication d'arrivage en moins de 20 secondes.
              </p>
              <p className="leading-relaxed">
                Le projet soutient la pêche durable, le circuit ultra-court et la traçabilité 100% 
                transparente. Les clients savent exactement qui a pêché leur poisson, où et comment.
              </p>
            </CardContent>
          </Card>

          {/* Timeline semaine par semaine */}
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Chronologie détaillée - 45 jours de développement intensif
          </h2>
          
          <div className="space-y-6 mb-12">
            {weeklyTimeline.map((week, index) => (
              <Card key={index} className="border-l-4 border-l-primary border-primary/20 bg-card/50 overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-bold">{week.week}</Badge>
                      <CardTitle className="text-lg">{week.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{week.period}</Badge>
                      <Badge className="bg-primary/20 text-primary border-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {week.hours}h
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid md:grid-cols-2 gap-2 mb-3">
                    {week.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-primary/10 rounded px-3 py-2 inline-block">
                    <span className="text-xs font-medium text-primary">✨ {week.highlight}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Summary */}
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Fish className="h-6 w-6 text-primary" />
            Fonctionnalités principales développées
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {[
              { icon: Users, title: "Multi-rôles", desc: "Visiteur, Client, Premium, Pêcheur, Admin" },
              { icon: Ship, title: "Espace Pêcheur", desc: "Dashboard, arrivages, contacts, messagerie" },
              { icon: Fish, title: "Arrivages", desc: "Express (20s) + Wizard détaillé + Templates" },
              { icon: Map, title: "Carte interactive", desc: "Google Maps avec ports et arrivages" },
              { icon: CreditCard, title: "Paiements Stripe", desc: "Abonnements, paniers, webhooks" },
              { icon: Bell, title: "Notifications", desc: "Email, Push, SMS (contacts pêcheurs)" },
              { icon: Sparkles, title: "IA intégrée", desc: "Assistant marin, génération SEO/descriptions" },
              { icon: Database, title: "Backend robuste", desc: "Supabase, RLS, 49 Edge Functions" },
              { icon: Code, title: "PWA", desc: "Installation mobile, service worker" }
            ].map((feature, index) => (
              <Card key={index} className="border-primary/20 bg-card/50 hover:bg-card/80 transition-colors">
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tech Stack */}
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            Stack technique
          </h2>

          <Card className="mb-12 border-primary/20 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary"
                    className="px-3 py-1"
                  >
                    {tech.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Signature */}
          <div className="text-center py-12 border-t border-border">
            <div className="flex justify-center mb-4">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Trophy className="h-3 w-3 mr-1" />
                45 jours • 630 heures • 1 développeur
              </Badge>
            </div>
            <p className="text-muted-foreground mb-2">
              Développé avec passion par
            </p>
            <p className="text-2xl font-bold text-foreground">
              Jean-Louis Michel
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              © 2025 QuaiDirect - Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeveloperCredits;
