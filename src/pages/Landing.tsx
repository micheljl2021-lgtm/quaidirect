import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, MapPin, Bell, Shield, Users, Anchor, Send, Loader2, CheckCircle, MessageSquare, Clock } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArrivageCard from "@/components/ArrivageCard";
import PhotoCarousel from "@/components/PhotoCarousel";
import { PremiumCardsSection } from "@/components/PremiumCardsSection";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import fishingPortImage from "@/assets/landing/fishing-port.jpg";
import { useArrivagesWithHistory } from "@/hooks/useArrivagesWithHistory";

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

  return (
    <div className="min-h-screen bg-gradient-sky">
      <Header />
      
      {/* Hero Section with Background */}
      <section 
        className="container px-4 pt-20 pb-16 relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${fishingPortImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="mx-auto max-w-4xl text-center space-y-6 sm:space-y-8 px-2">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Du bateau à votre assiette,
              <span className="block text-white">
                direct du quai
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Achetez du poisson frais directement auprès des marins-pêcheurs. 
              Tracé, prix justes, qualité garantie.
            </p>
          </div>
        </div>
      </section>

      {/* Premium Cards Section - Moved up */}
      <PremiumCardsSection />

      {/* Photo Carousel */}
      {carouselPhotos && carouselPhotos.length > 0 && (
        <section className="container px-4 py-16 border-t border-border">
          <div className="mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-4xl font-bold text-foreground">
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
            <h2 className="text-4xl font-bold text-foreground">
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

      {/* Testimonials Section */}
      <section className="container px-4 py-16 border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-foreground">
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
