import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import CaisseModule from '@/components/CaisseModule';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Anchor, AlertCircle, ShoppingCart } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PecheurDashboard = () => {
  const { user, userRole, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [drops, setDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fishermanId, setFishermanId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (userRole && userRole !== 'fisherman' && userRole !== 'admin') {
      navigate('/pecheur/onboarding');
      return;
    }

    if (userRole === 'fisherman' && !isVerifiedFisherman) {
      setLoading(false);
      return;
    }

    if (isVerifiedFisherman) {
      fetchDrops();
    }
  }, [user, userRole, isVerifiedFisherman, navigate]);

  // Set up realtime subscription for drops
  useEffect(() => {
    if (!user || !isVerifiedFisherman) return;

    const channel = supabase
      .channel('fisherman-drops-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drops',
        },
        () => {
          fetchDrops();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isVerifiedFisherman]);

  const fetchDrops = async () => {
    try {
      const { data: fisherman, error: fishermanError } = await supabase
        .from('fishermen')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle() as { data: { id: string } | null; error: any };

      if (fishermanError) {
        console.error('Error fetching fisherman:', fishermanError);
        setLoading(false);
        return;
      }

      if (fisherman?.id) {
        setFishermanId(fisherman.id);
        const { data, error } = await supabase
          .from('drops')
          .select(`
            *,
            port:ports(*),
            offers(*),
            drop_species(species:species(*))
          `)
          .eq('fisherman_id', fisherman.id)
          .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

        if (error) {
          console.error('Error fetching drops:', error);
        } else {
          setDrops(data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching drops:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isVerifiedFisherman) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-2xl px-4 py-8">
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              Votre compte pêcheur est en attente de validation. Vous recevrez un e-mail 
              une fois votre profil vérifié par notre équipe.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Tableau de bord
            </h1>
            <p className="text-lg text-muted-foreground">
              Gérez vos arrivages et ventes
            </p>
          </div>
          <div className="flex gap-3">
            {fishermanId && (
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2"
                onClick={() => navigate(`/pecheur/${fishermanId}`)}
              >
                <Anchor className="h-5 w-5" />
                Ma page vitrine
              </Button>
            )}
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => navigate('/pecheur/nouvel-arrivage')}
            >
              <Plus className="h-5 w-5" />
              Nouvel arrivage
            </Button>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Aujourd'hui</CardDescription>
              <CardTitle className="text-3xl">
                {drops.filter(d => {
                  const today = new Date().toDateString();
                  return new Date(d.eta_at).toDateString() === today;
                }).length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Programmés</CardDescription>
              <CardTitle className="text-3xl">
                {drops.filter(d => d.status === 'scheduled').length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total offres</CardDescription>
              <CardTitle className="text-3xl">
                {drops.reduce((sum, d) => sum + (d.offers?.length || 0), 0)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total arrivages</CardDescription>
              <CardTitle className="text-3xl">
                {drops.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="arrivages" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="arrivages" className="gap-2">
              <Anchor className="h-4 w-4" />
              Mes arrivages
            </TabsTrigger>
            <TabsTrigger value="caisse" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Caisse au port
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arrivages" className="space-y-6">
            {/* Liste des drops */}
            <Card>
              <CardHeader>
                <CardTitle>Mes arrivages</CardTitle>
                <CardDescription>
                  Historique de vos annonces
                </CardDescription>
              </CardHeader>
              <CardContent>
                {drops.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                      <Anchor className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Aucun arrivage</p>
                      <p className="text-sm text-muted-foreground">
                        Créez votre premier drop pour commencer à vendre
                      </p>
                    </div>
                    <Button onClick={() => navigate('/pecheur/nouvel-arrivage')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un arrivage
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {drops.map(drop => (
                      <div 
                        key={drop.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/drop/${drop.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{drop.port?.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                drop.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                drop.status === 'landed' ? 'bg-green-100 text-green-700' :
                                drop.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {drop.status}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ETA : {new Date(drop.eta_at).toLocaleString('fr-FR')}
                            </p>
                            {drop.offers?.length > 0 ? (
                              <p className="text-sm text-muted-foreground">
                                {drop.offers.length} offre(s) détaillée(s)
                              </p>
                            ) : drop.drop_species?.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {drop.drop_species.slice(0, 3).map((ds: any) => (
                                  <span key={ds.species.id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    {ds.species.name}
                                  </span>
                                ))}
                                {drop.drop_species.length > 3 && (
                                  <span className="text-xs text-muted-foreground">+{drop.drop_species.length - 3}</span>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Présence au port
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="caisse">
            <CaisseModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PecheurDashboard;
