import { Helmet } from "react-helmet";
import { Code, Clock, Calendar, Anchor, Ship, Fish, Users, Database, CreditCard, Bell, Map, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DeveloperCredits = () => {
  // Configuration - Valeurs réelles
  const startDate = "9 Novembre 2025";
  const hoursPerDay = 12; // Moyenne réelle (souvent plus)
  const totalDays = 45; // Du 9 nov au 23 déc 2025
  const totalHours = hoursPerDay * totalDays; // ~540h

  const milestones = [
    {
      phase: "Phase 1 - Fondations & Architecture",
      period: "9-20 Novembre 2025",
      items: [
        "Architecture React + TypeScript + Vite",
        "Intégration Supabase (Auth, Database, Storage)",
        "Design system Tailwind personnalisé maritime",
        "Structure de navigation multi-rôles (visitor, user, premium, fisherman, admin)",
        "Système d'authentification complet",
        "Configuration RLS et sécurité de base"
      ]
    },
    {
      phase: "Phase 2 - Espace Pêcheur Complet",
      period: "21 Nov - 5 Déc 2025",
      items: [
        "Onboarding pêcheur en 6 étapes avec validation",
        "Dashboard pêcheur avec statistiques temps réel",
        "Création d'arrivages Express (20 secondes)",
        "Wizard d'arrivage détaillé avec espèces",
        "Gestion des points de vente personnalisés",
        "Système de templates et presets d'arrivages",
        "Gestion des contacts clients (import, groupes)",
        "Photos par espèce avec fallback intelligent"
      ]
    },
    {
      phase: "Phase 3 - Espace Client & Premium",
      period: "6-12 Déc 2025",
      items: [
        "Landing page optimisée SEO",
        "Liste des arrivages avec filtres avancés",
        "Carte interactive Google Maps (ports, arrivages)",
        "Profils pêcheurs publics (micro-sites SEO)",
        "Système de paniers (25€ / 45€ / 75€)",
        "Abonnement Premium avec préférences",
        "Suivi des ports et espèces favorites",
        "Notifications prioritaires Premium"
      ]
    },
    {
      phase: "Phase 4 - Paiements & Intégrations",
      period: "13-17 Déc 2025",
      items: [
        "Intégration Stripe complète (checkout, webhooks)",
        "Abonnements pêcheurs (Basic/Pro)",
        "Paiement paniers clients",
        "Customer Portal Stripe",
        "Notifications email via Resend",
        "Notifications push Firebase FCM",
        "Système SMS Twilio (en développement)",
        "35+ Edge Functions Supabase"
      ]
    },
    {
      phase: "Phase 5 - IA & Fonctionnalités Avancées",
      period: "18-20 Déc 2025",
      items: [
        "IA du Marin (assistant IA pour pêcheurs)",
        "Génération SEO automatique des profils",
        "Génération de descriptions par IA",
        "Système de recettes avec génération IA",
        "Zones réglementaires de pêche",
        "Module Caisse pour ventes à quai",
        "Quotas IA par niveau d'abonnement"
      ]
    },
    {
      phase: "Phase 6 - Admin, Sécurité & Polish",
      period: "21-23 Déc 2025",
      items: [
        "Dashboard admin complet avec onglets",
        "Validation et gestion des pêcheurs",
        "Gestion des abonnements et paiements",
        "Mises à jour plateforme (email broadcast)",
        "Audit sécurité RLS complet",
        "Nettoyage colonnes orphelines",
        "PWA & installation mobile",
        "Optimisations performances"
      ]
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

  const stats = [
    { label: "Pages créées", value: "45+", icon: Code },
    { label: "Composants", value: "120+", icon: Sparkles },
    { label: "Edge Functions", value: "35+", icon: Database },
    { label: "Tables Supabase", value: "40+", icon: Database }
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
              <p className="text-lg text-primary font-medium">
                Depuis le {startDate}
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card className="text-center border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{totalHours}+</p>
                <p className="text-sm text-muted-foreground">Heures totales</p>
              </CardContent>
            </Card>
            
            <Card className="text-center border-primary/20 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{hoursPerDay}h</p>
                <p className="text-sm text-muted-foreground">Par jour (moyenne)</p>
              </CardContent>
            </Card>

            {stats.slice(0, 2).map((stat, index) => (
              <Card key={index} className="text-center border-primary/20 bg-card/50 backdrop-blur">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
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

          {/* Timeline */}
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            Historique du développement
          </h2>
          
          <div className="space-y-6 mb-12">
            {milestones.map((milestone, index) => (
              <Card key={index} className="border-l-4 border-l-primary border-primary/20 bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <CardTitle className="text-lg">{milestone.phase}</CardTitle>
                    <Badge variant="outline" className="w-fit">{milestone.period}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid md:grid-cols-2 gap-2">
                    {milestone.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
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
              { icon: Database, title: "Backend robuste", desc: "Supabase, RLS, Edge Functions" },
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
