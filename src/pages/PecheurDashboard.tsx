import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import CaisseModule from '@/components/CaisseModule';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Anchor, AlertCircle, ShoppingCart, History, CheckCircle, Settings, Users, Mail, Send, Pencil, Crown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PecheurDashboard = () => {
  const { user, userRole, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [drops, setDrops] = useState<any[]>([]);
  const [archivedDrops, setArchivedDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'invitation_initiale' | 'new_drop' | 'custom'>('invitation_initiale');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const queryClient = useQueryClient();

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
        .select('id, slug')
        .eq('user_id', user?.id)
        .maybeSingle() as { data: { id: string; slug: string } | null; error: any };

      if (fishermanError) {
        console.error('Error fetching fisherman:', fishermanError);
        setLoading(false);
        return;
      }

      if (fisherman?.id) {
        setFishermanId(fisherman.id);
        
        // Fetch active drops
        const { data: activeData, error: activeError } = await supabase
          .from('drops')
          .select(`
            *,
            port:ports(*),
            offers(*),
            drop_species(species:species(*))
          `)
          .eq('fisherman_id', fisherman.id)
          .in('status', ['scheduled', 'landed'])
          .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

        if (activeError) {
          console.error('Error fetching active drops:', activeError);
        } else {
          setDrops(activeData || []);
        }

        // Fetch archived drops
        const { data: archivedData, error: archivedError } = await supabase
          .from('drops')
          .select(`
            *,
            port:ports(*),
            offers(*),
            drop_species(species:species(*))
          `)
          .eq('fisherman_id', fisherman.id)
          .in('status', ['completed', 'cancelled'])
          .order('created_at', { ascending: false })
          .limit(10) as { data: any[] | null; error: any };

        if (archivedError) {
          console.error('Error fetching archived drops:', archivedError);
        } else {
          setArchivedDrops(archivedData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching drops:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message_type: string; body: string; sent_to_group: string }) => {
      const { data: result, error } = await supabase.functions.invoke('send-fisherman-message', {
        body: data
      });
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: 'Succès',
        description: `Message envoyé à ${data.recipient_count} contact(s)`,
      });
      setCustomMessage('');
      queryClient.invalidateQueries({ queryKey: ['fishermen-contacts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || "Erreur lors de l'envoi",
        variant: 'destructive',
      });
    }
  });

  const handleSendMessage = () => {
    if (messageType === 'custom' && !customMessage.trim()) {
      toast({
        title: 'Erreur',
        description: "Veuillez saisir un message",
        variant: 'destructive',
      });
      return;
    }

    const messageBody = messageType === 'custom' 
      ? customMessage 
      : messageType === 'invitation_initiale'
      ? "Bonjour, je suis maintenant sur QuaiDirect ! Retrouvez tous mes arrivages et points de vente sur ma page."
      : "Nouveau drop disponible ! Consultez les détails sur ma page QuaiDirect.";

    sendMessageMutation.mutate({
      message_type: messageType,
      body: messageBody,
      sent_to_group: selectedGroup
    });
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
          <div className="flex gap-3 flex-wrap">
            {fishermanId && (
              <>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2"
                  onClick={async () => {
                    const { data } = await supabase
                      .from('fishermen')
                      .select('slug')
                      .eq('id', fishermanId)
                      .maybeSingle();
                    if (data?.slug) {
                      navigate(`/pecheurs/${data.slug}`);
                    }
                  }}
                >
                  <Anchor className="h-5 w-5" />
                  Ma page vitrine
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate('/pecheur/edit-profile')}
                >
                  <Settings className="h-5 w-5" />
                  Configurer ma vitrine
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate('/pecheur/contacts')}
                >
                  <Users className="h-5 w-5" />
                  Carnet de clients
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 border-0"
                  onClick={() => navigate('/pecheur/ambassadeur')}
                >
                  <Crown className="h-5 w-5" />
                  Ambassadeur
                </Button>
              </>
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

        {/* Section Messaging */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Envoyer un message groupé
            </CardTitle>
            <CardDescription>
              Contactez vos clients pour les inviter ou les informer de vos arrivages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type de message</Label>
              <RadioGroup value={messageType} onValueChange={(v: any) => setMessageType(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="invitation_initiale" id="invitation_initiale" />
                  <Label htmlFor="invitation_initiale" className="font-normal cursor-pointer">
                    Message d'invitation - "Je rejoins QuaiDirect"
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new_drop" id="new_drop" />
                  <Label htmlFor="new_drop" className="font-normal cursor-pointer">
                    Annonce d'arrivage - "Nouveau drop disponible"
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="font-normal cursor-pointer">
                    Message personnalisé
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {messageType === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="message">Votre message</Label>
                <Textarea
                  id="message"
                  placeholder="Rédigez votre message ici..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="group">Groupe de contacts</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger id="group">
                  <SelectValue placeholder="Sélectionner un groupe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous mes contacts</SelectItem>
                  <SelectItem value="general">Groupe général</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendMessage} 
              disabled={sendMessageMutation.isPending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendMessageMutation.isPending ? 'Envoi en cours...' : 'Envoyer le message'}
            </Button>
          </CardContent>
        </Card>

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
              <CardDescription>Actifs</CardDescription>
              <CardTitle className="text-3xl">
                {drops.length}
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
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div 
                            className="space-y-1 flex-1 cursor-pointer"
                            onClick={() => navigate(`/drop/${drop.id}`)}
                          >
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{drop.port?.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                drop.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                drop.status === 'landed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                              }`}>
                                {drop.status === 'scheduled' ? 'Programmé' : 'Arrivé'}
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
                                {drop.drop_species
                                  .filter((ds: any) => ds.species && ds.species.id)
                                  .slice(0, 3)
                                  .map((ds: any) => (
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/pecheur/modifier-arrivage/${drop.id}`);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                              Modifier
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-2"
                              onClick={async (e) => {
                              e.stopPropagation();
                              const { error } = await supabase
                                .from('drops')
                                .update({ status: 'completed' })
                                .eq('id', drop.id);
                              
                              if (error) {
                                toast({
                                  title: 'Erreur',
                                  description: 'Impossible de marquer comme terminé',
                                  variant: 'destructive',
                                });
                              } else {
                                toast({
                                  title: 'Arrivage archivé',
                                  description: 'L\'arrivage a été marqué comme terminé',
                                });
                                fetchDrops();
                              }
                             }}
                           >
                             <CheckCircle className="h-4 w-4" />
                             Terminer
                           </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History section */}
            {archivedDrops.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historique des arrivages
                  </CardTitle>
                  <CardDescription>
                    Les 10 derniers arrivages terminés ou annulés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {archivedDrops.map(drop => (
                      <div key={drop.id} className="p-3 border-b last:border-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{drop.port?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(drop.eta_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                            {drop.drop_species?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {drop.drop_species.slice(0, 2).map((ds: any) => (
                                  <span key={ds.species.id} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                    {ds.species.name}
                                  </span>
                                ))}
                                {drop.drop_species.length > 2 && (
                                  <span className="text-xs text-muted-foreground">+{drop.drop_species.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                            drop.status === 'completed' 
                              ? 'bg-secondary text-secondary-foreground' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {drop.status === 'completed' ? 'Terminé' : 'Annulé'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
