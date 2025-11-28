import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAmbassadorStats } from '@/hooks/useAmbassadorStats';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Trophy, Award, Users, CheckCircle2, Star, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PecheurAmbassadorStatus = () => {
  const { user, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useAmbassadorStats();

  useEffect(() => {
    if (!user || !isVerifiedFisherman) {
      navigate('/dashboard/pecheur');
    }
  }, [user, isVerifiedFisherman, navigate]);

  // Fetch current fisherman's ambassador status
  const { data: fishermanData } = useQuery({
    queryKey: ['fisherman-ambassador', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('fishermen')
        .select('id, is_ambassador, ambassador_slot, verified_at')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isAmbassador = fishermanData?.is_ambassador || false;
  const ambassadorRank = fishermanData?.ambassador_slot || null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Statut Ambassadeur</h1>
          </div>
          <p className="text-muted-foreground">
            Rejoignez les 10 premiers marins pêcheurs ambassadeurs de QuaiDirect
          </p>
        </div>

        {/* Current Status */}
        {isAmbassador && ambassadorRank ? (
          <Alert className="mb-8 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
            <Trophy className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-foreground">
              <span className="font-semibold">Félicitations !</span> Vous êtes Ambassadeur QuaiDirect #{ambassadorRank}/10
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-8">
            <Users className="h-5 w-5" />
            <AlertDescription>
              Vous n'êtes pas encore ambassadeur. 
              {stats && !stats.isFull && (
                <span className="font-semibold"> Il reste {stats.remainingSlots} places sur 10 !</span>
              )}
              {stats?.isFull && (
                <span className="font-semibold"> Toutes les places ambassadeur sont prises.</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Ambassador Stats */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Places Ambassadeur
            </CardTitle>
            <CardDescription>
              Les 10 premiers pêcheurs à rejoindre QuaiDirect
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-primary">{stats?.currentAmbassadors || 0}/10</p>
                <p className="text-sm text-muted-foreground">Places prises</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">{stats?.remainingSlots || 0}</p>
                <p className="text-sm text-muted-foreground">Places restantes</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                style={{ width: `${((stats?.currentAmbassadors || 0) / 10) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ambassador Benefits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Avantages Ambassadeur
            </CardTitle>
            <CardDescription>
              Ce que vous obtenez en tant qu'ambassadeur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Badge Ambassadeur visible</p>
                <p className="text-sm text-muted-foreground">
                  Votre profil et vos arrivages affichent un badge distinctif
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Visibilité prioritaire</p>
                <p className="text-sm text-muted-foreground">
                  Vos arrivages apparaissent en premier dans les résultats
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Statut exclusif à vie</p>
                <p className="text-sm text-muted-foreground">
                  Le statut ambassadeur est permanent, tant que la plateforme fonctionne bien
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Support prioritaire</p>
                <p className="text-sm text-muted-foreground">
                  Assistance technique et commerciale en priorité
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Participation aux évolutions</p>
                <p className="text-sm text-muted-foreground">
                  Votre avis compte pour les nouvelles fonctionnalités
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Rank (if ambassador) */}
        {isAmbassador && ambassadorRank && (
          <Card className="border-blue-500 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Votre rang</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-primary">#{ambassadorRank}</span>
                    <span className="text-lg text-muted-foreground">/ 10</span>
                  </div>
                </div>
                <Badge className="gap-2 text-base px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <Crown className="h-5 w-5" />
                  Ambassadeur
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA for non-ambassadors */}
        {!isAmbassador && !stats?.isFull && (
          <Card className="border-primary">
            <CardContent className="pt-6 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-bold mb-2">Devenez Ambassadeur !</h3>
              <p className="text-muted-foreground mb-4">
                En tant que pêcheur vérifié et payé, vous êtes éligible au statut ambassadeur.
                Seulement {stats?.remainingSlots} places restantes !
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Le statut ambassadeur est automatiquement attribué aux 10 premiers pêcheurs 
                ayant complété leur onboarding et payé l'abonnement annuel.
              </p>
              <Button 
                onClick={() => navigate('/dashboard/pecheur')}
                className="gap-2"
              >
                <Crown className="h-4 w-4" />
                Retour au Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PecheurAmbassadorStatus;
