import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { 
  MapPin, 
  Fish, 
  Phone, 
  Mail, 
  Heart,
  Anchor,
  User,
  Settings,
  Facebook,
  Instagram,
  Globe,
  Loader2
} from 'lucide-react';

const FisherProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch fisherman by slug
  const { data: fisherman, isLoading } = useQuery({
    queryKey: ['fisherman-by-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_fishermen')
        .select(`
          *,
          fishermen_species(
            species:species(*),
            is_primary
          )
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Pêcheur introuvable');
      
      return data;
    },
    enabled: !!slug,
  });

  // Check if current user is the owner
  const isOwner = user && fisherman && fisherman.user_id === user.id;

  // Check if user is following
  const { data: isFollowing, refetch: refetchFollowing } = useQuery({
    queryKey: ['is-following', fisherman?.id, user?.id],
    queryFn: async () => {
      if (!user || !fisherman?.id) return false;

      const { data } = await supabase
        .from('fishermen_followers')
        .select('id')
        .eq('user_id', user.id)
        .eq('fisherman_id', fisherman.id)
        .maybeSingle();

      return !!data;
    },
    enabled: !!user && !!fisherman?.id,
  });

  // Get follower count
  const { data: followerCount } = useQuery({
    queryKey: ['follower-count', fisherman?.id],
    queryFn: async () => {
      if (!fisherman?.id) return 0;

      const { count } = await supabase
        .from('fishermen_followers')
        .select('*', { count: 'exact', head: true })
        .eq('fisherman_id', fisherman.id);

      return count || 0;
    },
    enabled: !!fisherman?.id,
  });

  // Follow/Unfollow mutations
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !fisherman?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('fishermen_followers')
        .insert({ user_id: user.id, fisherman_id: fisherman.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
      queryClient.invalidateQueries({ queryKey: ['follower-count'] });
      toast.success('Vous suivez maintenant ce pêcheur');
    },
    onError: () => {
      toast.error('Erreur lors du suivi');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user || !fisherman?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('fishermen_followers')
        .delete()
        .eq('user_id', user.id)
        .eq('fisherman_id', fisherman.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
      queryClient.invalidateQueries({ queryKey: ['follower-count'] });
      toast.success('Vous ne suivez plus ce pêcheur');
    },
    onError: () => {
      toast.error('Erreur lors du désabonnement');
    },
  });

  const handleFollowToggle = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!fisherman) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Pêcheur introuvable</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Collect photos for carousel
  const photos = [fisherman.photo_boat_1, fisherman.photo_boat_2, fisherman.photo_dock_sale]
    .filter(Boolean) as string[];

  // Get species data
  const speciesData = fisherman.fishermen_species || [];
  const primarySpecies = speciesData.find((fs: any) => fs.is_primary);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Header */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 to-background">
        {photos.length > 0 && (
          <Carousel className="w-full h-full">
            <CarouselContent>
              {photos.map((photo, idx) => (
                <CarouselItem key={idx}>
                  <img
                    src={photo}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-64 md:h-80 object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            {photos.length > 1 && (
              <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </>
            )}
          </Carousel>
        )}
        
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="container max-w-5xl">
            <h1 className="text-4xl font-bold text-white">{fisherman.boat_name}</h1>
            {fisherman.company_name && (
              <p className="text-white/90 text-lg">{fisherman.company_name}</p>
            )}
            {fisherman.main_fishing_zone && (
              <div className="flex items-center gap-2 text-white/90 mt-2">
                <MapPin className="h-4 w-4" />
                <span>{fisherman.main_fishing_zone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-5xl px-4 py-8">
        {/* CTA Principal + Stats */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {isOwner ? (
              <Button
                variant="outline"
                onClick={() => navigate('/pecheur/edit-profile')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Modifier mon profil
              </Button>
            ) : (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className="gap-2"
              >
                <Heart className={isFollowing ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                {isFollowing ? 'Abonné' : 'Suivre'}
              </Button>
            )}
            <div className="text-sm text-muted-foreground">
              {followerCount || 0} abonné{followerCount !== 1 ? 's' : ''}
            </div>
          </div>

          <Button size="lg" onClick={() => navigate(`/arrivages?pecheur=${fisherman.id}`)}>
            Voir les arrivages & commander
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Qui je suis */}
          {fisherman.generated_description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Qui je suis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
                  {fisherman.generated_description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Ce que je pêche */}
          {speciesData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fish className="h-5 w-5" />
                  Ce que je pêche
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {speciesData.map((fs: any) => (
                    <Badge
                      key={fs.species.id}
                      variant={fs.is_primary ? "default" : "secondary"}
                      className="text-base py-1.5 px-3"
                    >
                      {fs.is_primary && '⭐ '}
                      {fs.species.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comment je pêche */}
          {(fisherman.fishing_methods?.length > 0 || fisherman.fishing_zones?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Anchor className="h-5 w-5" />
                  Comment je pêche
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fisherman.fishing_methods?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Méthodes</p>
                    <div className="flex flex-wrap gap-2">
                      {fisherman.fishing_methods.map((method: string) => (
                        <Badge variant="outline" key={method}>
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {fisherman.fishing_zones?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Zones de pêche</p>
                    <p className="text-foreground">{fisherman.fishing_zones.join(', ')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Me contacter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Me contacter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Téléphone */}
              {(fisherman as any).phone && (
                <a
                  href={`tel:${(fisherman as any).phone}`}
                  className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <span className="font-medium">{(fisherman as any).phone}</span>
                </a>
              )}

              {/* Email */}
              {fisherman.email && (
                <a
                  href={`mailto:${fisherman.email}`}
                  className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <span className="font-medium">{fisherman.email}</span>
                </a>
              )}

              {/* Réseaux sociaux */}
              {(fisherman.facebook_url || fisherman.instagram_url || fisherman.website_url) && (
                <div className="flex items-center gap-3 pt-3 border-t">
                  {fisherman.facebook_url && (
                    <a
                      href={fisherman.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-accent rounded-full transition"
                    >
                      <Facebook className="h-6 w-6" />
                    </a>
                  )}
                  {fisherman.instagram_url && (
                    <a
                      href={fisherman.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-accent rounded-full transition"
                    >
                      <Instagram className="h-6 w-6" />
                    </a>
                  )}
                  {fisherman.website_url && (
                    <a
                      href={fisherman.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-accent rounded-full transition"
                    >
                      <Globe className="h-6 w-6" />
                    </a>
                  )}
                </div>
              )}

              {/* Itinéraire */}
              {fisherman.address && fisherman.city && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    `${fisherman.address}, ${fisherman.postal_code || ''} ${fisherman.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
                >
                  <MapPin className="h-5 w-5" />
                  <span className="font-medium">Itinéraire vers le port</span>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t">
        <div className="container max-w-5xl text-center">
          <p className="text-sm text-muted-foreground">
            Page générée avec{' '}
            <a href="/" className="text-primary hover:underline">
              QuaiDirect.fr
            </a>
            {' '}– Vente directe à quai
          </p>
        </div>
      </footer>
    </div>
  );
};

export default FisherProfile;
