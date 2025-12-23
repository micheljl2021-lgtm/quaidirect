import { Helmet } from "react-helmet";
import { Code, Clock, Calendar, Anchor, Ship, Fish, Users, Database, CreditCard, Bell, Map, Sparkles, Trophy, Zap, Moon, Coffee, MessageSquare, Brain, Euro, CheckCircle2, XCircle, AlertTriangle, Smartphone, Mail, Target, TrendingUp, Globe, Heart } from "lucide-react";
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
      hours: 98,
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
      hours: 42,
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

  const competitorComparison = [
    { feature: "Prix pêcheur", quaidirect: "150€/an fixe", others: "15-30% commission", advantage: true },
    { feature: "CRM mobile intégré", quaidirect: "✓", others: "✗", advantage: true },
    { feature: "IA assistant pêcheur", quaidirect: "✓", others: "✗", advantage: true },
    { feature: "Publication arrivage", quaidirect: "20 secondes", others: "5-10 min", advantage: true },
    { feature: "Choix total pêcheur", quaidirect: "100%", others: "Imposé", advantage: true },
    { feature: "Micro-site SEO auto", quaidirect: "✓", others: "✗", advantage: true },
    { feature: "Vente directe à quai", quaidirect: "✓", others: "Relais/Livraison", advantage: true },
    { feature: "Notifications clients", quaidirect: "Email + SMS + Push", others: "Email seul", advantage: true },
  ];

  const aiCategories = [
    { icon: MessageSquare, title: "Clientèle", desc: "Rédaction WhatsApp/SMS, posts réseaux sociaux, réponses clients pro" },
    { icon: Fish, title: "Pêche & Météo", desc: "Stratégie de pêche, conditions marines, choix de zones, sécurité" },
    { icon: Ship, title: "Bateau", desc: "Checklists départ/retour, maintenance, carnet de bord, sécurité" },
    { icon: TrendingUp, title: "Business", desc: "Estimation revenus, organisation journées, récaps administratifs" },
  ];

  return (
    <>
      <Helmet>
        <title>Crédits Développeur - QuaiDirect</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* BETA Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white py-3 px-4">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              <span className="font-bold text-lg">VERSION BETA ACTIVE</span>
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <span className="text-sm sm:text-base">
              Développement intensif en cours • ~14h de code/jour • Nouvelles fonctionnalités quotidiennes
            </span>
          </div>
        </div>

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

          {/* CRM Pêcheur Section */}
          <Card className="mb-12 border-2 border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Smartphone className="h-8 w-8 text-blue-500" />
                CRM Pêcheur - La Révolution Mobile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                <strong className="text-foreground">Première app au monde</strong> qui permet aux marins-pêcheurs de gérer leur portefeuille clients directement depuis leur téléphone, même en mer.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-background/50 rounded-lg p-4 border border-blue-500/20">
                  <Users className="h-6 w-6 text-blue-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Gestion contacts</h4>
                  <p className="text-sm text-muted-foreground">Import multi-formats (CSV, Excel, copier-coller intelligent)</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-blue-500/20">
                  <Target className="h-6 w-6 text-blue-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Segmentation</h4>
                  <p className="text-sm text-muted-foreground">Groupes : particuliers, restaurants, poissonniers...</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-blue-500/20">
                  <Mail className="h-6 w-6 text-blue-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Email groupé</h4>
                  <p className="text-sm text-muted-foreground">Envoi en 1 clic à tous vos contacts ou un groupe</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-blue-500/20">
                  <MessageSquare className="h-6 w-6 text-blue-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">SMS groupé</h4>
                  <p className="text-sm text-muted-foreground">Notification instantanée d'arrivage par SMS</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-blue-500/20">
                  <Bell className="h-6 w-6 text-blue-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Notifications auto</h4>
                  <p className="text-sm text-muted-foreground">Vos clients prévenus dès que vous publiez</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-blue-500/20">
                  <Clock className="h-6 w-6 text-blue-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Historique</h4>
                  <p className="text-sm text-muted-foreground">Suivi des envois et derniers contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* IA du Marin Section */}
          <Card className="mb-12 border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Brain className="h-8 w-8 text-purple-500" />
                IA du Marin - L'Assistant Révolutionnaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background/50 rounded-lg p-4 mb-6 border border-purple-500/30">
                <p className="text-center font-semibold text-purple-600 dark:text-purple-400">
                  🚀 AUCUN CONCURRENT ne propose d'IA intégrée pour les pêcheurs artisanaux
                </p>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Une IA spécialisée 100% maritime, parlant le langage des pêcheurs. Elle couvre 4 domaines essentiels :
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {aiCategories.map((cat, index) => (
                  <div key={index} className="bg-background/50 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center gap-3 mb-2">
                      <cat.icon className="h-6 w-6 text-purple-500" />
                      <h4 className="font-semibold text-foreground">{cat.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{cat.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Évolution prévue :</strong> L'IA du Marin sera enrichie progressivement avec de nouvelles capacités : analyse de marché, prévisions météo avancées, conseils réglementaires, aide administrative, et bien plus.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Modèle 150€/an Section */}
          <Card className="mb-12 border-2 border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Euro className="h-8 w-8 text-green-500" />
                Le Modèle 150€/an - L'Accessibilité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                <strong className="text-foreground">Pourquoi seulement 150€/an ?</strong> Parce que QuaiDirect a été créé de A à Z pour être accessible à tous les pêcheurs artisanaux.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-background/50 rounded-lg p-5 border border-green-500/20">
                  <h4 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Notre modèle
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>✓ Abonnement fixe = prévisibilité totale</li>
                    <li>✓ 0% de commission sur vos ventes</li>
                    <li>✓ Tout inclus : CRM, IA, notifications, SEO...</li>
                    <li>✓ Support direct et mises à jour gratuites</li>
                  </ul>
                </div>
                <div className="bg-background/50 rounded-lg p-5 border border-red-500/20">
                  <h4 className="font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Les marketplaces
                  </h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>✗ 15-30% de commission par vente</li>
                    <li>✗ Règles imposées par la plateforme</li>
                    <li>✗ Pas de relation directe client</li>
                    <li>✗ Dépendance totale à l'intermédiaire</li>
                  </ul>
                </div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-5 border border-green-500/30">
                <h4 className="font-bold text-lg text-foreground mb-2">💰 Calcul simple :</h4>
                <p className="text-muted-foreground">
                  Si vous faites <strong className="text-foreground">500€ de ventes/mois</strong> :
                </p>
                <ul className="mt-2 text-muted-foreground">
                  <li>• Avec 15% de commission → <span className="text-red-500 font-semibold">75€/mois = 900€/an perdu</span></li>
                  <li>• Avec QuaiDirect → <span className="text-green-500 font-semibold">12,50€/mois = 150€/an tout inclus</span></li>
                </ul>
                <p className="mt-3 text-lg font-bold text-green-600 dark:text-green-400">
                  = 750€ d'économie par an minimum
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comparatif Concurrence */}
          <Card className="mb-12 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Globe className="h-8 w-8 text-primary" />
                Ce qui nous différencie de la concurrence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Après analyse des solutions existantes (Poiscaille, Directement des Quais, Fishmarket, Pourdebon...), voici ce que QuaiDirect apporte de différent :
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Fonctionnalité</th>
                      <th className="text-center py-3 px-4 font-semibold text-primary">QuaiDirect</th>
                      <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Autres</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitorComparison.map((row, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-3 px-4 text-foreground">{row.feature}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-green-500 font-medium">{row.quaidirect}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-red-400">{row.others}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Innovation Côté Client */}
          <Card className="mb-12 border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-500/10 to-teal-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Heart className="h-8 w-8 text-cyan-500" />
                Innovation Côté Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                Les clients aussi bénéficient d'une expérience inédite sur le marché :
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-background/50 rounded-lg p-4 border border-cyan-500/20">
                  <Map className="h-6 w-6 text-cyan-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Carte interactive</h4>
                  <p className="text-sm text-muted-foreground">Visualisez tous les ports et arrivages en temps réel sur une carte</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-cyan-500/20">
                  <Globe className="h-6 w-6 text-cyan-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Micro-sites pêcheurs</h4>
                  <p className="text-sm text-muted-foreground">Chaque pêcheur a sa page SEO générée automatiquement par IA</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-cyan-500/20">
                  <CreditCard className="h-6 w-6 text-cyan-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Paniers préconfigurés</h4>
                  <p className="text-sm text-muted-foreground">25€ / 45€ / 75€ - Commande et paiement en quelques clics</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-cyan-500/20">
                  <Bell className="h-6 w-6 text-cyan-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Notifications Premium</h4>
                  <p className="text-sm text-muted-foreground">Alertes personnalisées selon vos ports et espèces préférés</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-cyan-500/20">
                  <Fish className="h-6 w-6 text-cyan-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Traçabilité 100%</h4>
                  <p className="text-sm text-muted-foreground">Qui a pêché, où, quand, comment - transparence totale</p>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-cyan-500/20">
                  <Sparkles className="h-6 w-6 text-cyan-500 mb-2" />
                  <h4 className="font-semibold text-foreground mb-1">Recettes IA</h4>
                  <p className="text-sm text-muted-foreground">Suggestions de recettes générées par IA selon les espèces</p>
                </div>
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
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Trophy className="h-3 w-3 mr-1" />
                45 jours
              </Badge>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Clock className="h-3 w-3 mr-1" />
                630+ heures
              </Badge>
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                <Code className="h-3 w-3 mr-1" />
                1 développeur
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                <AlertTriangle className="h-3 w-3 mr-1" />
                BETA ACTIVE
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
            <p className="text-xs text-muted-foreground mt-4 italic">
              "Je continue de coder chaque jour pour améliorer cette plateforme. Le développement ne s'arrête jamais."
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeveloperCredits;
