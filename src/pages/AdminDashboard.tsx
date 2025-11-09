import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Fish, Anchor, CheckCircle, XCircle, Clock, TrendingUp, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PendingFisherman {
  id: string;
  user_id: string;
  siret: string;
  boat_name: string;
  boat_registration: string;
  phone: string | null;
  bio: string | null;
  created_at: string;
  profiles: {
    email: string;
  } | null;
}

interface UserWithRoles {
  id: string;
  email: string;
  created_at: string;
  user_roles: Array<{
    role: string;
  }>;
}

interface DropStats {
  id: string;
  eta_at: string;
  status: string;
  is_premium: boolean;
  ports: {
    name: string;
    city: string;
  };
  fishermen: {
    boat_name: string;
  };
  offers: Array<{
    id: string;
  }>;
}

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, userRole, navigate]);

  // Fetch pending fishermen
  const { data: pendingFishermen, refetch: refetchPending } = useQuery({
    queryKey: ['pending-fishermen'],
    queryFn: async () => {
      // First get fishermen without verified_at
      const { data: fishermenData, error: fishermenError } = await supabase
        .from('fishermen')
        .select('*')
        .is('verified_at', null)
        .order('created_at', { ascending: false });

      if (fishermenError) throw fishermenError;

      // Then get emails from auth.users for each fisherman
      const fishermenWithEmails = await Promise.all(
        (fishermenData || []).map(async (fisherman) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(fisherman.user_id);
          
          return {
            ...fisherman,
            profiles: {
              email: user?.email || 'N/A'
            }
          };
        })
      );

      return fishermenWithEmails as PendingFisherman[];
    },
    enabled: !!user && userRole === 'admin',
  });

  // Fetch all users with roles
  const { data: users } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      const usersWithRoles = await Promise.all(
        authUsers.users.map(async (u) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', u.id);

          return {
            id: u.id,
            email: u.email || '',
            created_at: u.created_at,
            user_roles: roles || [],
          };
        })
      );

      return usersWithRoles as UserWithRoles[];
    },
    enabled: !!user && userRole === 'admin',
  });

  // Fetch all drops
  const { data: drops } = useQuery({
    queryKey: ['all-drops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          id,
          eta_at,
          status,
          is_premium,
          ports (
            name,
            city
          ),
          fishermen (
            boat_name
          ),
          offers (
            id
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as DropStats[];
    },
    enabled: !!user && userRole === 'admin',
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [dropsCount, usersCount, fishermenCount, offersCount] = await Promise.all([
        supabase.from('drops').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('fishermen').select('id', { count: 'exact', head: true }).not('verified_at', 'is', null),
        supabase.from('offers').select('id', { count: 'exact', head: true }),
      ]);

      return {
        drops: dropsCount.count || 0,
        users: usersCount.count || 0,
        fishermen: fishermenCount.count || 0,
        offers: offersCount.count || 0,
      };
    },
    enabled: !!user && userRole === 'admin',
  });

  const handleVerifyFisherman = async (fishermanId: string) => {
    try {
      const { error } = await supabase
        .from('fishermen')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', fishermanId);

      if (error) throw error;

      toast({
        title: '✅ Pêcheur vérifié',
        description: 'Le pêcheur peut maintenant créer des drops',
      });

      refetchPending();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRejectFisherman = async (fishermanId: string) => {
    try {
      const { error } = await supabase
        .from('fishermen')
        .delete()
        .eq('id', fishermanId);

      if (error) throw error;

      toast({
        title: 'Pêcheur refusé',
        description: 'La demande a été supprimée',
      });

      refetchPending();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Dashboard Admin
            </h1>
            <Badge className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <Shield className="h-3 w-3" />
              Administrateur
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Gestion globale de la plateforme QuaiDirect
          </p>
        </div>

        {/* Pending Fishermen Alert */}
        {pendingFishermen && pendingFishermen.length > 0 && (
          <Alert className="mb-8 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              {pendingFishermen.length} pêcheur{pendingFishermen.length > 1 ? 's' : ''} en attente de validation
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardDescription>Utilisateurs</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {stats?.users || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Anchor className="h-5 w-5 text-primary" />
                <CardDescription>Pêcheurs vérifiés</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {stats?.fishermen || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardDescription>Drops créés</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {stats?.drops || 0}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-primary" />
                <CardDescription>Offres totales</CardDescription>
              </div>
              <CardTitle className="text-3xl">
                {stats?.offers || 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="fishermen" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fishermen" className="gap-2">
              <Anchor className="h-4 w-4" />
              Pêcheurs
              {pendingFishermen && pendingFishermen.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingFishermen.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="drops" className="gap-2">
              <MapPin className="h-4 w-4" />
              Drops
            </TabsTrigger>
          </TabsList>

          {/* Fishermen Tab */}
          <TabsContent value="fishermen" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pêcheurs en attente de validation</CardTitle>
                <CardDescription>
                  Vérifiez les informations et validez les nouveaux pêcheurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingFishermen && pendingFishermen.length > 0 ? (
                  <div className="space-y-4">
                    {pendingFishermen.map((fisherman) => (
                      <Card key={fisherman.id} className="border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{fisherman.boat_name}</h3>
                                <Badge variant="outline">En attente</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Email:</span>
                                  <span className="ml-2 font-medium">{fisherman.profiles?.email || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Immatriculation:</span>
                                  <span className="ml-2 font-medium">{fisherman.boat_registration}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">SIRET:</span>
                                  <span className="ml-2 font-medium">{fisherman.siret}</span>
                                </div>
                                {fisherman.phone && (
                                  <div>
                                    <span className="text-muted-foreground">Téléphone:</span>
                                    <span className="ml-2 font-medium">{fisherman.phone}</span>
                                  </div>
                                )}
                              </div>
                              {fisherman.bio && (
                                <p className="text-sm text-muted-foreground mt-2">{fisherman.bio}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Demande créée le {new Date(fisherman.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
                                onClick={() => handleVerifyFisherman(fisherman.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Valider
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 border-red-600 text-red-600 hover:bg-red-50"
                                onClick={() => handleRejectFisherman(fisherman.id)}
                              >
                                <XCircle className="h-4 w-4" />
                                Refuser
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                    <p className="text-muted-foreground">
                      Aucun pêcheur en attente de validation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tous les utilisateurs</CardTitle>
                <CardDescription>
                  Liste complète des utilisateurs inscrits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users && users.length > 0 ? (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="space-y-1">
                          <p className="font-medium">{user.email}</p>
                          <div className="flex gap-2">
                            {user.user_roles.length > 0 ? (
                              user.user_roles.map((role, idx) => (
                                <Badge key={idx} variant="secondary" className="capitalize">
                                  {role.role}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">Aucun rôle</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drops Tab */}
          <TabsContent value="drops" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Drops récents</CardTitle>
                <CardDescription>
                  Les 50 derniers drops créés sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                {drops && drops.length > 0 ? (
                  <div className="space-y-2">
                    {drops.map((drop) => (
                      <div key={drop.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {drop.ports.name}, {drop.ports.city}
                            </p>
                            <Badge variant={drop.status === 'scheduled' ? 'default' : 'secondary'}>
                              {drop.status}
                            </Badge>
                            {drop.is_premium && (
                              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                Premium
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Bateau: {drop.fishermen.boat_name} • {drop.offers.length} offre(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            ETA: {new Date(drop.eta_at).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(drop.eta_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Aucun drop trouvé</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
