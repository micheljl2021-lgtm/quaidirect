import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, MapPin, Bell, Shield, Users, Anchor, Award, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArrivageCard from "@/components/ArrivageCard";
import PhotoCarousel from "@/components/PhotoCarousel";
import AmbassadorBadge from "@/components/AmbassadorBadge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import freshFishImage from "@/assets/landing/fresh-fish.jpg";
import fishingPortImage from "@/assets/landing/fishing-port.jpg";
import fishermanBoatImage from "@/assets/landing/fisherman-boat.jpg";

import { useLandingStats } from "@/hooks/useLandingStats";
import { useAmbassadorStats } from "@/hooks/useAmbassadorStats";

const Landing = () => {
  const navigate = useNavigate();
  const { fishermenCount, usersCount } = useLandingStats();
  const { data: ambassadorStats } = useAmbassadorStats();

  // Fetch latest arrivages for preview
  const { data: latestArrivages } = useQuery({
    queryKey: ['latest-arrivages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          id,
          eta_at,
          sale_start_time,
          is_premium,
          ports (
            id,
            name,
            city
          ),
          offers (
            unit_price,
            available_units,
            species (
              name,
              scientific_name
            )
          ),
          fishermen (
            boat_name
          )
        `)
        .eq('status', 'scheduled')
        .order('eta_at', { ascending: true })
        .limit(3);

      if (error) throw error;
      
      return data?.map(arrivage => ({
        id: arrivage.id,
        species: arrivage.offers[0]?.species?.name || 'Poisson',
        scientificName: arrivage.offers[0]?.species?.scientific_name || '',
        port: `${arrivage.ports?.name}`,
        eta: new Date(arrivage.eta_at),
        saleStartTime: arrivage.sale_start_time ? new Date(arrivage.sale_start_time) : undefined,
        pricePerPiece: arrivage.offers[0]?.unit_price || 0,
        quantity: arrivage.offers[0]?.available_units || 0,
        isPremium: arrivage.is_premium,
        fisherman: {
          name: arrivage.fishermen?.boat_name || 'Pêcheur',
          boat: arrivage.fishermen?.boat_name || ''
        }
      })) || [];
    },
  });

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
  });

  // Fetch ambassadors
  const { data: ambassadors } = useQuery({
    queryKey: ['ambassadors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_public_fishermen')
        .eq('is_ambassador', true)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });
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
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Du bateau à votre assiette,
              <span className="block text-white">
                direct du quai
              </span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Achetez du poisson frais directement auprès des marins-pêcheurs. 
              Tracé, prix justes, qualité garantie.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/carte">
              <Button size="lg" className="gap-2 bg-gradient-ocean hover:opacity-90 transition-opacity text-lg px-8 h-14">
                <MapPin className="h-5 w-5" />
                Voir les arrivages
              </Button>
            </Link>
            <Link to="/premium">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 h-14 border-2 border-white bg-white text-primary hover:bg-white/90">
                <Crown className="h-5 w-5" />
                Premium
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex justify-center items-center gap-8">
            <img 
              src={'/src/assets/logo-peche-durable.png'} 
              alt="Pêche Durable et Responsable" 
              className="h-20 opacity-90"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6 space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Anchor className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">{fishermenCount}</h3>
              <p className="text-sm text-muted-foreground">Marins-pêcheurs</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6 space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">25</h3>
              <p className="text-sm text-muted-foreground">Ports couverts</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6 space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">{usersCount}</h3>
              <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Premium Features */}
      <section className="container px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-premium/10 border border-premium/20">
              <Crown className="h-4 w-4 text-premium" />
              <span className="text-sm font-medium text-premium-foreground">Premium</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground">
              Accédez en priorité aux meilleurs arrivages
            </h2>
            <p className="text-lg text-muted-foreground">
              Soutenez les points de vente et recevez des alertes sur vos espèces favorites
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Soutenez les points de vente</h3>
                <p className="text-muted-foreground">
                  Une partie de votre abonnement aide à financer les stands à quai de vos marins pêcheurs préférés.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Alertes poissons favoris</h3>
                <p className="text-muted-foreground">
                  Recevez des notifications dès qu'un point de vente propose vos espèces préférées.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link to="/premium">
              <Button size="lg" className="gap-2 bg-gradient-ocean hover:opacity-90 transition-opacity">
                <Crown className="h-5 w-5" />
                À partir de 4,99€/mois
              </Button>
            </Link>
          </div>
        </div>
      </section>

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

      {/* Latest Arrivages Preview */}
      {latestArrivages && latestArrivages.length > 0 && (
        <section className="container px-4 py-16 border-t border-border">
          <div className="mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl font-bold text-foreground">
                Arrivages du jour
              </h2>
              <p className="text-lg text-muted-foreground">
                Découvrez les derniers arrivages de poisson frais
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {latestArrivages.map(arrivage => (
                <ArrivageCard key={arrivage.id} {...arrivage} />
              ))}
            </div>

            <div className="text-center">
              <Link to="/carte">
                <Button size="lg" variant="outline" className="gap-2">
                  <MapPin className="h-5 w-5" />
                  Voir tous les arrivages
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

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
                    <Anchor className="h-6 w-6 text-primary" />
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
                    <Anchor className="h-6 w-6 text-primary" />
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

      {/* Ambassadors Section */}
      {ambassadors && ambassadors.length > 0 && (
        <section className="container px-4 py-16 border-t border-border">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="text-center space-y-4 mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <Award className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">
                  Les 10 premiers à prendre la formule - Statut à vie
                </span>
              </div>
              
              <h2 className="text-4xl font-bold text-foreground">
                Nos Ambassadeurs Partenaires
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ils sont les pionniers de QuaiDirect. Marins-pêcheurs visionnaires qui ont cru 
                au projet dès le départ et contribuent activement à façonner l'avenir de la vente directe à quai.
              </p>
            </div>

            {/* Grid des ambassadeurs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ambassadors.map((ambassador) => (
                <Card 
                  key={ambassador.id} 
                  className="group hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(`/pecheurs/${ambassador.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Photo */}
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={ambassador.photo_boat_1 || ambassador.photo_url || '/placeholder.svg'}
                        alt={ambassador.boat_name || 'Photo du bateau'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <AmbassadorBadge size="sm" />
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-6 space-y-3">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          {ambassador.boat_name}
                        </h3>
                        {ambassador.company_name && (
                          <p className="text-sm text-muted-foreground">
                            {ambassador.company_name}
                          </p>
                        )}
                      </div>

                      {/* Description courte */}
                      {ambassador.generated_description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {ambassador.generated_description}
                        </p>
                      )}

                      {/* Zone de pêche */}
                      {ambassador.main_fishing_zone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{ambassador.main_fishing_zone}</span>
                        </div>
                      )}

                      {/* CTA */}
                      <Button variant="ghost" className="w-full mt-4 group-hover:bg-primary/5">
                        Découvrir le profil
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Message d'encouragement */}
            <div className="mt-12 text-center">
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <CardContent className="py-8 px-6">
                  <p className="text-lg font-medium text-amber-900 mb-2">
                    💡 Vous êtes pêcheur et souhaitez rejoindre QuaiDirect ?
                  </p>
                  {ambassadorStats && !ambassadorStats.isFull && (
                    <p className="text-2xl font-bold text-amber-900 mb-4">
                      🔥 Plus que {ambassadorStats.remainingSlots} place{ambassadorStats.remainingSlots > 1 ? 's' : ''} Ambassadeur{ambassadorStats.remainingSlots > 1 ? 's' : ''} disponible{ambassadorStats.remainingSlots > 1 ? 's' : ''} !
                    </p>
                  )}
                  <p className="text-muted-foreground mb-6">
                    <strong>Payé une fois et gratuit pour les années suivantes</strong> (suivant les conditions d'évolutions de la plateforme).
                    Les 10 premiers ambassadeurs bénéficient du statut à vie et accompagnent le développement de QuaiDirect.
                  </p>
                  <Link to="/pecheur/payment">
                    <Button size="lg" className="gap-2">
                      <Anchor className="h-5 w-5" />
                      Devenir Ambassadeur Partenaire
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

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
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">100% traçable</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Circuit ultra-court</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20">
              <Anchor className="h-4 w-4 text-primary" />
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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
