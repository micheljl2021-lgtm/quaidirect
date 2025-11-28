import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Anchor, MapPin, Fish, Award, Heart } from 'lucide-react';

const AmbassadorPartner = () => {
  const navigate = useNavigate();

  // Fetch ambassador partner (Sébastien Z.)
  const { data: ambassador, isLoading } = useQuery({
    queryKey: ['ambassador-partner'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_fishermen')
        .select('*')
        .eq('id', (
          await supabase
            .from('fishermen')
            .select('id')
            .eq('email', 'seb.zadeyan.leboncoin@gmail.com')
            .maybeSingle()
        ).data?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching ambassador partner:', error);
        throw error;
      }

      // Fetch species separately
      if (data?.id) {
        const { data: speciesData } = await supabase
          .from('fishermen_species')
          .select(`
            species:species(name)
          `)
          .eq('fisherman_id', data.id);
        
        return {
          ...data,
          fishermen_species: speciesData || []
        } as any;
      }

      return data;
    },
  });

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8 max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
              <Star className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Ambassadeur Partenaire</h1>
              <p className="text-lg text-muted-foreground">Fondateur de QuaiDirect</p>
            </div>
          </div>
          <Badge className="gap-2 text-base px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <Star className="h-5 w-5" />
            Ambassadeur Partenaire Fondateur
          </Badge>
        </div>

        {/* Ambassador Info Card */}
        {ambassador ? (
          <Card className="mb-8 border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Anchor className="h-6 w-6 text-primary" />
                    {ambassador.boat_name}
                  </CardTitle>
                  {ambassador.company_name && (
                    <CardDescription className="text-base mt-1">{ambassador.company_name}</CardDescription>
                  )}
                </div>
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  Vérifié
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {ambassador.description && (
                <p className="text-foreground">{ambassador.description}</p>
              )}
              {ambassador.bio && (
                <p className="text-muted-foreground italic">{ambassador.bio}</p>
              )}
              
              {/* Species */}
              {ambassador.fishermen_species && ambassador.fishermen_species.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Fish className="h-5 w-5 text-primary" />
                    Espèces pêchées
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ambassador.fishermen_species.map((fs: any) => (
                      <Badge key={fs.species.name} variant="outline">
                        {fs.species.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Fishing Zone */}
              {ambassador.main_fishing_zone && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Zone de pêche
                  </h3>
                  <p className="text-muted-foreground">{ambassador.main_fishing_zone}</p>
                </div>
              )}

              <div className="pt-4">
                <Button 
                  onClick={() => navigate(`/pecheurs/${ambassador.slug}`)}
                  className="w-full gap-2"
                >
                  <Anchor className="h-4 w-4" />
                  Voir la vitrine complète
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Aucun ambassadeur partenaire trouvé</p>
            </CardContent>
          </Card>
        )}

        {/* Partner Story */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              L'histoire d'un partenariat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              <strong className="text-foreground">Sébastien</strong> est le tout premier marin pêcheur à avoir cru en QuaiDirect. 
              En tant qu'Ambassadeur Partenaire Fondateur, il a participé activement au développement de la plateforme 
              et continue d'apporter son expertise du terrain.
            </p>
            <p>
              Son rôle unique lui confère un statut privilégié à vie, en reconnaissance de son engagement 
              et de sa confiance dans notre projet de valorisation de la pêche artisanale française.
            </p>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Avantages Ambassadeur Partenaire
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Accès gratuit à vie à QuaiDirect</li>
                <li>Badge exclusif "Ambassadeur Partenaire Fondateur"</li>
                <li>Visibilité prioritaire sur la plateforme</li>
                <li>Support dédié et prioritaire</li>
                <li>Participation aux décisions d'évolution</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AmbassadorPartner;
