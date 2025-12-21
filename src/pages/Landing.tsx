import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, MapPin, Bell, Shield, Users, Anchor, Send, Loader2, CheckCircle, MessageSquare, Coins, Smartphone, Bot, ArrowRight, Fish, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArrivageCard from "@/components/ArrivageCard";
import PhotoCarousel from "@/components/PhotoCarousel";
import { PremiumCardsSection } from "@/components/PremiumCardsSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import fishingPortImage from "@/assets/landing/fishing-port.jpg";
import freshFishImage from "@/assets/landing/fresh-fish.jpg";
import { useArrivagesWithHistory } from "@/hooks/useArrivagesWithHistory";
import { OrganizationSchema, WebsiteSchema, FAQSchema } from "@/components/seo/StructuredData";

// Contact Section Component
function ContactSection() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("question");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error: dbError } = await supabase
        .from('launch_subscribers')
        .insert({ 
          email: email.trim().toLowerCase(), 
          message: message.trim() || null,
          type,
          status: 'new'
        });

      if (dbError) {
        if (dbError.code === '23505') {
          toast.info("Vous nous avez déjà contacté ! Nous reviendrons vers vous bientôt.");
        } else {
          throw dbError;
        }
      } else {
        await supabase.functions.invoke('send-inquiry-confirmation', {
          body: { email: email.trim().toLowerCase(), message: message.trim(), type }
        });
        
        setIsSubmitted(true);
        toast.success("Message envoyé ! Vérifiez votre boîte mail.");
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="container px-4 py-16 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-xl text-center space-y-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h2 className="text-3xl font-bold text-foreground">Message envoyé !</h2>
          <p className="text-lg text-muted-foreground">
            Nous avons bien reçu votre demande. Vérifiez votre boîte mail pour la confirmation.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container px-4 py-16 border-t border-border bg-muted/30">
      <div className="mx-auto max-w-xl">
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">Contact</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Une question ? Contactez-nous !
          </h2>
          <p className="text-muted-foreground">
            Notre équipe vous répondra dans les plus brefs délais
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Votre email *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              
              <div>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Type de demande" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="question">Question générale</SelectItem>
                    <SelectItem value="fisherman_interest">Je suis pêcheur et intéressé</SelectItem>
                    <SelectItem value="partnership">Partenariat / Presse</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Textarea
                  placeholder="Votre message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="bg-background resize-none"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer ma demande
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Section 3 bénéfices pêcheur
function FishermanBenefitsSection() {
  const benefits = [
    {
      icon: Users,
      title: "Vente directe sans intermédiaire",
      description: "Gardez le contrôle de vos prix et de vos clients"
    },
    {
      icon: Bell,
      title: "Prévenez vos clients en 1 clic",
      description: "Email, SMS ou Push à chaque arrivage"
    },
    {
      icon: Coins,
      title: "Vos clients financent vos SMS",
      description: "Les abonnements Premium vous rapportent des SMS gratuits"
    }
  ];

  return (
    <section className="container px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <benefit.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const { data: arrivagesGrouped, isLoading: arrivagesLoading } = useArrivagesWithHistory();

  // Récupérer les 3 prochains arrivages actifs
  const nextArrivages = useMemo(() => {
    if (!arrivagesGrouped?.active) return [];
    return arrivagesGrouped.active.slice(0, 3);
  }, [arrivagesGrouped]);

  // Helper pour transformer un arrivage pour ArrivageCard
  const transformArrivage = (arrivage: any) => {
    if (!arrivage) return null;
    
    // Récupérer TOUTES les espèces de drop_species
    const allSpecies = arrivage.drop_species
      ?.map((ds: any) => ds.species?.name)
      .filter(Boolean) || [];
    const speciesText = allSpecies.length > 0 ? allSpecies.join(', ') : 'Poisson frais';
    const firstScientificName = arrivage.drop_species?.[0]?.species?.scientific_name || '';
    
    return {
      id: arrivage.id,
      species: speciesText,
      scientificName: firstScientificName,
      port: arrivage.fisherman_sale_points?.label || arrivage.ports?.name || 'Point de vente',
      city: arrivage.fisherman_sale_points?.address || arrivage.ports?.city || '',
      eta: new Date(arrivage.eta_at),
      saleStartTime: arrivage.sale_start_time ? new Date(arrivage.sale_start_time) : undefined,
      pricePerPiece: 0,
      quantity: 0,
      isPremium: arrivage.is_premium,
      dropPhotos: arrivage.drop_photos?.map((p: any) => ({
        photo_url: p.photo_url,
        display_order: p.display_order
      })) || [],
      fisherman: {
        id: arrivage.fishermen?.id,
        slug: arrivage.fishermen?.slug,
        name: arrivage.fishermen?.company_name || arrivage.fishermen?.boat_name || 'Pêcheur',
        boat: arrivage.fishermen?.boat_name || '',
        isAmbassador: arrivage.fishermen?.is_ambassador || false,
        isPartnerAmbassador: arrivage.fishermen?.is_ambassador && arrivage.fishermen?.ambassador_slot === 1,
      },
    };
  };

  // Fetch latest offer photos for carousel
  const { data: carouselPhotos } = useQuery({
    queryKey: ['carousel-photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_photos')
        .select(`
          photo_url,
          display_order,
          offers (
            drop_id,
            species (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      return data?.map(photo => ({
        url: photo.photo_url,
        arrivageId: photo.offers?.drop_id || '',
        speciesName: photo.offers?.species?.name || 'Poisson frais'
      })) || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const hasArrivages = nextArrivages.length > 0;

  // FAQ data for structured data
  const landingFAQs = [
    { question: "Comment fonctionne QuaiDirect ?", answer: "QuaiDirect permet aux marins-pêcheurs artisanaux de publier leurs arrivages et aux clients d'acheter du poisson frais directement à quai. Vous consultez les arrivages disponibles, choisissez votre pêcheur et récupérez votre commande au point de vente indiqué." },
    { question: "Le poisson est-il vraiment frais ?", answer: "Oui, 100% ! Le poisson est pêché le jour même ou la veille par nos marins-pêcheurs partenaires. Vous achetez directement au pêcheur, sans intermédiaire, pour une fraîcheur maximale." },
    { question: "Quels sont les avantages d'acheter en direct ?", answer: "Prix justes pour le pêcheur et le client, traçabilité totale (vous savez qui a pêché votre poisson, où et quand), fraîcheur garantie, et soutien à la pêche artisanale locale." }
  ];

  const scrollToContact = () => {
    const contactSection = document.querySelector('section:has(form)');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sky">
      {/* Structured Data for SEO */}
      <OrganizationSchema />
      <WebsiteSchema />
      <FAQSchema faqs={landingFAQs} />
      
      <Header />
      
      {/* HERO Section - Split 2 colonnes */}
      <section className="min-h-[80vh] sm:min-h-[75vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[80vh] sm:min-h-[75vh]">
          
          {/* Bloc Gauche - Pêcheur */}
          <div 
            className="relative flex items-center justify-center p-6 sm:p-10 lg:p-16 min-h-[45vh] md:min-h-full"
            style={{
              backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.9)), url(${fishingPortImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="relative z-10 text-center space-y-5 max-w-md">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Anchor className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Espace Pêcheur</span>
              </div>

              {/* Titre */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Vous êtes marin-pêcheur ?
              </h2>

              {/* Sous-titre */}
              <p className="text-base sm:text-lg text-white/85 leading-relaxed">
                Vendez en direct, fidélisez vos clients, gagnez du temps.
              </p>

              {/* Features */}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-white/70 text-xs sm:text-sm">
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>100% mobile</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/70 text-xs sm:text-sm">
                  <Bot className="h-3.5 w-3.5" />
                  <span>IA incluse</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/devenir-pecheur">
                  <Button 
                    size="lg" 
                    className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-primary hover:bg-primary/90 shadow-xl w-full"
                  >
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Créer mon profil pêcheur
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-sm sm:text-base px-6 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm w-full"
                  onClick={scrollToContact}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Demander une démo
                </Button>
              </div>
            </div>
          </div>

          {/* Bloc Droite - Client */}
          <div 
            className="relative flex items-center justify-center p-6 sm:p-10 lg:p-16 min-h-[45vh] md:min-h-full"
            style={{
              backgroundImage: `linear-gradient(rgba(14, 165, 233, 0.85), rgba(6, 182, 212, 0.9)), url(${freshFishImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="relative z-10 text-center space-y-5 max-w-md">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
                <Fish className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">Espace Client</span>
              </div>

              {/* Titre */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                Vous aimez le poisson frais ?
              </h2>

              {/* Sous-titre */}
              <p className="text-base sm:text-lg text-white/90 leading-relaxed">
                Achetez direct du quai, soutenez la pêche locale.
              </p>

              {/* Features */}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 text-white/75 text-xs sm:text-sm">
                  <Shield className="h-3.5 w-3.5" />
                  <span>100% traçable</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/75 text-xs sm:text-sm">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Circuit court</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/arrivages">
                  <Button 
                    size="lg" 
                    className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white text-primary hover:bg-white/90 shadow-xl w-full"
                  >
                    <MapPin className="h-5 w-5 mr-2" />
                    Voir les arrivages
                  </Button>
                </Link>
                <Link to="/premium">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-sm sm:text-base px-6 py-4 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm w-full"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Devenir Premium
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Section 3 bénéfices pêcheur */}
      <FishermanBenefitsSection />

      {/* Testimonials Section - Remonté */}
      <section className="container px-4 py-16 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-muted-foreground">
              Découvrez les témoignages de nos marins-pêcheurs partenaires
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Anchor className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Sébastien Z.</h3>
                    <p className="text-sm text-muted-foreground">Hyères</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Enfin une plateforme qui valorise notre travail ! Plus de galère avec les intermédiaires, 
                  je vends direct aux clients qui apprécient la qualité de ma pêche."
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Anchor className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Sébastien P.</h3>
                    <p className="text-sm text-muted-foreground">Carqueiranne</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Simple et efficace. Mes clients me suivent et connaissent mes horaires d'arrivée. 
                  C'est exactement ce dont on avait besoin pour digitaliser notre métier."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Premium Cards Section - Pour les clients */}
      <PremiumCardsSection />

      {/* Photo Carousel */}
      {carouselPhotos && carouselPhotos.length > 0 && (
        <section className="container px-4 py-16 border-t border-border">
          <div className="mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Photos récentes de nos pêcheurs
              </h2>
              <p className="text-lg text-muted-foreground">
                Découvrez les produits frais de la mer
              </p>
            </div>

            <PhotoCarousel 
              photos={carouselPhotos}
              autoPlayInterval={4000}
              onPhotoClick={(arrivageId) => navigate('/arrivages')}
            />
          </div>
        </section>
      )}

      {/* Arrivages à venir - 3 prochains */}
      <section className="container px-4 py-16 border-t border-border">
        <div className="mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Arrivages à venir
            </h2>
            <p className="text-lg text-muted-foreground">
              Les prochaines ventes de poisson frais
            </p>
          </div>

          {arrivagesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hasArrivages ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {nextArrivages.map((arrivage) => (
                  <ArrivageCard key={arrivage.id} {...transformArrivage(arrivage)!} />
                ))}
              </div>

              <div className="text-center">
                <Link to="/carte">
                  <Button size="lg" variant="outline" className="gap-2">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                    Voir tous les arrivages
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
              <CardContent className="py-16 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                  <Anchor className="h-10 w-10 text-primary" aria-hidden="true" />
                </div>
                <div className="space-y-3 max-w-lg mx-auto">
                  <h3 className="text-2xl font-bold text-foreground">Pas d'arrivages pour le moment</h3>
                  <p className="text-muted-foreground">
                    Les pêcheurs publient leurs arrivages régulièrement selon la météo et leurs sorties en mer.
                    Explorez la carte ou inscrivez-vous pour être alerté !
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Link to="/carte">
                    <Button size="lg" className="gap-2">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                      Explorer la carte
                    </Button>
                  </Link>
                  <Link to="/premium">
                    <Button size="lg" variant="outline" className="gap-2">
                      <Bell className="h-5 w-5" aria-hidden="true" />
                      Recevoir les alertes
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Solidarity Section */}
      <section className="container px-4 py-16 border-t border-border">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            Soutenez la pêche artisanale française
          </h2>
          <p className="text-lg text-muted-foreground">
            Chaque achat soutient directement nos marins-pêcheurs. 
            Prix justes, traçabilité totale, zéro intermédiaire.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/demo-tracabilite">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
                <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium">100% traçable</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
              <Users className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Circuit ultra-court</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
              <Anchor className="h-4 w-4 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">Pêche responsable</span>
            </div>
          </div>
          <div className="pt-4">
            <Link to="/demo-tracabilite">
              <Button variant="outline" size="lg" className="gap-2">
                <Shield className="h-5 w-5" />
                Voir la démo traçabilité
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pêche Durable Section */}
      <section className="container px-4 py-12 border-t border-border">
        <div className="mx-auto max-w-4xl">
          <Card className="bg-gradient-ocean/5 border-primary/20">
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Pêche éco-responsable et durable</h3>
              <p className="text-lg text-foreground leading-relaxed">
                QuaiDirect soutient les marins-pêcheurs français dans leur démarche de vente directe et de circuit court. 
                Notre mission : aider les petits pêcheurs et les nouveaux marins à valoriser leur travail et à créer un lien direct avec les consommateurs.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
