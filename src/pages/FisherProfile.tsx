import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Anchor, 
  MapPin, 
  Fish, 
  Phone, 
  Mail, 
  Heart,
  Calendar,
  ExternalLink,
  Settings
} from 'lucide-react';

const FisherProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch fisherman profile (using public view to protect sensitive data)
  const { data: fisherman, isLoading } = useQuery({
    queryKey: ['fisherman-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_fishermen')
        .select(`
          *,
          fishermen_species(
            species:species(*)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Pêcheur introuvable');
      
      return data;
    },
  });

  // Check if user is following this fisherman
  const { data: isFollowing, refetch: refetchFollowing } = useQuery({
    queryKey: ['is-following', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;

      const { data, error } = await supabase
        .from('fishermen_followers')
        .select('id')
        .eq('user_id', user.id)
        .eq('fisherman_id', id)
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!user && !!id,
  });

  // Get follower count
  const { data: followerCount } = useQuery({
    queryKey: ['follower-count', id],
    queryFn: async () => {
      if (!id) return 0;

      const { count, error } = await supabase
        .from('fishermen_followers')
        .select('*', { count: 'exact', head: true })
        .eq('fisherman_id', id);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!id,
  });

  // Get upcoming drops
  const { data: upcomingDrops } = useQuery({
    queryKey: ['fisherman-upcoming-drops', id],
    queryFn: async () => {
      if (!id) return [];

      const { data, error } = await supabase
        .from('drops')
        .select(`
          *,
          port:ports(*),
          offers(count),
          drop_species(species:species(*))
        `)
        .eq('fisherman_id', id)
        .eq('status', 'scheduled')
        .gte('eta_at', new Date().toISOString())
        .order('eta_at', { ascending: true })
        .limit(3);

      if (error) return [];
      return data || [];
    },
    enabled: !!id,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Non connecté');

      const { error } = await supabase
        .from('fishermen_followers')
        .insert({ user_id: user.id, fisherman_id: id });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Vous suivez maintenant ce pêcheur' });
      refetchFollowing();
      queryClient.invalidateQueries({ queryKey: ['follower-count', id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Non connecté');

      const { error } = await supabase
        .from('fishermen_followers')
        .delete()
        .eq('user_id', user.id)
        .eq('fisherman_id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Vous ne suivez plus ce pêcheur' });
      refetchFollowing();
      queryClient.invalidateQueries({ queryKey: ['follower-count', id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFollowToggle = () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour suivre ce pêcheur',
      });
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
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!fisherman) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Pêcheur introuvable</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const primarySpecies = fisherman.fishermen_species?.find((fs: any) => fs.is_primary)?.species;
  const otherSpecies = fisherman.fishermen_species?.filter((fs: any) => !fs.is_primary) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8 max-w-5xl mx-auto">
        {/* Hero Section */}
        <Card className="overflow-hidden mb-6">
          <div className="relative h-48 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
            {fisherman.photo_url && (
              <img
                src={fisherman.photo_url}
                alt={fisherman.boat_name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>

          <CardContent className="relative pt-6 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Anchor className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {fisherman.boat_name}
                    </h1>
                    {fisherman.company_name && (
                      <p className="text-lg text-muted-foreground">
                        {fisherman.company_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Vérifié depuis {new Date(fisherman.verified_at || '').toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{followerCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Abonnés</p>
                </div>
                
                {/* Show edit button if owner */}
                {user && fisherman.user_id === user.id ? (
                  <Button
                    size="lg"
                    onClick={() => navigate('/pecheur/edit-profile')}
                    className="gap-2"
                  >
                    <Settings className="h-5 w-5" />
                    Modifier mon profil
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollowToggle}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className="gap-2"
                  >
                    <Heart className={`h-5 w-5 ${isFollowing ? 'fill-current' : ''}`} />
                    {isFollowing ? 'Abonné' : 'Suivre'}
                  </Button>
                )}
              </div>
            </div>

            {fisherman.description && (
              <p className="text-muted-foreground leading-relaxed mb-4">
                {fisherman.description}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Espèces pêchées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5" />
                Espèces pêchées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {primarySpecies && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Spécialité</p>
                  <Badge variant="default" className="text-sm">
                    ★ {primarySpecies.name}
                  </Badge>
                </div>
              )}
              {otherSpecies.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Autres espèces</p>
                  <div className="flex flex-wrap gap-2">
                    {otherSpecies.map((fs: any) => (
                      <Badge key={fs.species.id} variant="secondary">
                        {fs.species.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {!primarySpecies && otherSpecies.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune espèce renseignée</p>
              )}
            </CardContent>
          </Card>

          {/* Méthodes & Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Activité de pêche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fisherman.fishing_methods && fisherman.fishing_methods.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Méthodes</p>
                  <div className="flex flex-wrap gap-2">
                    {fisherman.fishing_methods.map((method: string) => (
                      <Badge key={method} variant="outline" className="capitalize">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {fisherman.fishing_zones && fisherman.fishing_zones.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Zones de pêche</p>
                  <div className="flex flex-wrap gap-2">
                    {fisherman.fishing_zones.map((zone: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(!fisherman.fishing_methods || fisherman.fishing_methods.length === 0) &&
                (!fisherman.fishing_zones || fisherman.fishing_zones.length === 0) && (
                  <p className="text-sm text-muted-foreground">Aucune information disponible</p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Prochains arrivages */}
        {upcomingDrops && upcomingDrops.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Anchor className="h-5 w-5" />
                Prochains arrivages
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingDrops.map((drop: any) => (
                <div
                  key={drop.id}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/arrivages`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{drop.port?.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ETA : {new Date(drop.eta_at).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {drop.drop_species && drop.drop_species.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {drop.drop_species.slice(0, 3).map((ds: any) => (
                            <Badge key={ds.species.id} variant="secondary" className="text-xs">
                              {ds.species.name}
                            </Badge>
                          ))}
                          {drop.drop_species.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{drop.drop_species.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FisherProfile;
