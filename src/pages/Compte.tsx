import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Crown, User, Bell, MapPin, Settings, Anchor, Shield, Fish, ArrowLeft, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Port {
  id: string;
  name: string;
  city: string;
}

interface Species {
  id: string;
  name: string;
}

interface FollowedFisherman {
  id: string;
  boat_name: string;
  company_name: string | null;
}

interface NotificationPrefs {
  push_enabled: boolean;
  email_enabled: boolean;
}

const Compte = () => {
  const { user, userRole, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const [fishermanData, setFishermanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Données réelles des préférences
  const [favoritePorts, setFavoritePorts] = useState<Port[]>([]);
  const [favoriteSpecies, setFavoriteSpecies] = useState<Species[]>([]);
  const [favoriteFishermen, setFavoriteFishermen] = useState<FollowedFisherman[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({ push_enabled: true, email_enabled: false });
  const [savingNotifs, setSavingNotifs] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch fisherman data if applicable
        if (userRole === 'fisherman') {
          const { data } = await supabase
            .from('fishermen')
            .select('id, slug, boat_name, company_name')
            .eq('user_id', user.id)
            .maybeSingle();
          
          setFishermanData(data);
        }

        // Fetch follow_ports with port details
        const { data: followPorts } = await supabase
          .from('follow_ports')
          .select('port_id, ports(id, name, city)')
          .eq('user_id', user.id);
        
        if (followPorts) {
          setFavoritePorts(followPorts.map(fp => fp.ports as unknown as Port).filter(Boolean));
        }

        // Fetch follow_species with species details
        const { data: followSpecies } = await supabase
          .from('follow_species')
          .select('species_id, species(id, name)')
          .eq('user_id', user.id);
        
        if (followSpecies) {
          setFavoriteSpecies(followSpecies.map(fs => fs.species as unknown as Species).filter(Boolean));
        }

        // Fetch fishermen_followers with fisherman details
        const { data: followFishermen } = await supabase
          .from('fishermen_followers')
          .select('fisherman_id')
          .eq('user_id', user.id);
        
        if (followFishermen && followFishermen.length > 0) {
          const fishermenIds = followFishermen.map(ff => ff.fisherman_id);
          const { data: fishermenData } = await supabase
            .from('public_fishermen')
            .select('id, boat_name, company_name')
            .in('id', fishermenIds);
          
          if (fishermenData) {
            setFavoriteFishermen(fishermenData as FollowedFisherman[]);
          }
        }

        // Fetch notification preferences
        const { data: notifPrefs } = await supabase
          .from('notification_preferences')
          .select('push_enabled, email_enabled')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (notifPrefs) {
          setNotificationPrefs({
            push_enabled: notifPrefs.push_enabled ?? true,
            email_enabled: notifPrefs.email_enabled ?? false
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, userRole, navigate]);

  const handleNotificationToggle = async (key: 'push_enabled' | 'email_enabled', value: boolean) => {
    if (!user) return;
    
    setSavingNotifs(true);
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          push_enabled: newPrefs.push_enabled,
          email_enabled: newPrefs.email_enabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      toast.success('Préférences mises à jour');
    } catch (error) {
      console.error('Error saving notification prefs:', error);
      toast.error('Erreur lors de la sauvegarde');
      // Revert on error
      setNotificationPrefs(notificationPrefs);
    } finally {
      setSavingNotifs(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return (
          <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case 'premium':
        return (
          <Badge variant="outline" className="gap-1 bg-gradient-ocean text-white border-0">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        );
      case 'fisherman':
        return (
          <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary">
            <Anchor className="h-3 w-3" />
            Pêcheur {isVerifiedFisherman ? '✓' : '(en attente)'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            Gratuit
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarFallback className="bg-primary/10 text-2xl">
                  {userRole === 'fisherman' ? (
                    <Anchor className="h-8 w-8" />
                  ) : userRole === 'admin' ? (
                    <Shield className="h-8 w-8" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-foreground">
                      {fishermanData?.boat_name || user?.email?.split('@')[0] || 'Utilisateur'}
                    </h1>
                    {getRoleBadge()}
                  </div>
                  <p className="text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => {
                    if (userRole === 'fisherman' && fishermanData?.id) {
                      navigate('/pecheur/edit-profile');
                    }
                  }}
                  disabled={userRole !== 'fisherman'}
                >
                  <Settings className="h-4 w-4" />
                  Modifier le profil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Premium Status */}
          {userRole !== 'fisherman' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-premium" />
                  <CardTitle>Abonnement Premium</CardTitle>
                </div>
                <CardDescription>
                  Accédez en priorité aux meilleurs arrivages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRole === 'premium' ? (
                  <>
                    <div className="p-4 rounded-lg bg-gradient-ocean text-white text-center space-y-2">
                      <p className="font-medium">✓ Vous êtes Premium</p>
                      <p className="text-sm opacity-90">
                        Accès 30 min en avance à tous les arrivages
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/premium/reglages')}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Gérer mes préférences
                    </Button>
                  </>
                ) : (
                  <div className="p-4 rounded-lg bg-muted text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Vous n'êtes pas encore Premium
                    </p>
                    <Button 
                      className="w-full bg-gradient-ocean hover:opacity-90"
                      onClick={() => navigate('/premium')}
                    >
                      Passer Premium
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fisherman Dashboard Link */}
          {userRole === 'fisherman' && isVerifiedFisherman && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Anchor className="h-5 w-5 text-primary" />
                  <CardTitle>Mon espace pêcheur</CardTitle>
                </div>
                <CardDescription>
                  Gérez vos arrivages et votre vitrine
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {fishermanData?.boat_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Nom du bateau</p>
                      <p className="font-medium">{fishermanData.boat_name}</p>
                    </div>
                  )}
                  {fishermanData?.company_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Entreprise</p>
                      <p className="font-medium">{fishermanData.company_name}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate('/dashboard/pecheur')}
                  >
                    Tableau de bord
                  </Button>
                  {fishermanData?.slug && (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate(`/pecheurs/${fishermanData.slug}`)}
                    >
                      Ma vitrine
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications - Fonctionnelles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Gérez vos alertes et préférences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Nouveaux arrivages</span>
                  <Switch
                    checked={notificationPrefs.push_enabled}
                    onCheckedChange={(v) => handleNotificationToggle('push_enabled', v)}
                    disabled={savingNotifs}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Actualités & offres</span>
                  <Switch
                    checked={notificationPrefs.email_enabled}
                    onCheckedChange={(v) => handleNotificationToggle('email_enabled', v)}
                    disabled={savingNotifs}
                  />
                </div>
              </div>
              
              {userRole === 'premium' && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/premium/reglages')}
                >
                  Configurer les alertes avancées
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pêcheurs favoris */}
          {userRole === 'premium' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive" />
                  <CardTitle>Pêcheurs favoris</CardTitle>
                </div>
                <CardDescription>
                  Vos pêcheurs préférés à soutenir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {favoriteFishermen.length > 0 ? (
                  <div className="space-y-2">
                    {favoriteFishermen.map(fisherman => (
                      <div key={fisherman.id} className="flex items-center gap-2 p-2 bg-destructive/5 rounded-lg">
                        <Heart className="h-4 w-4 text-destructive fill-destructive" />
                        <span className="font-medium">{fisherman.boat_name}</span>
                        {fisherman.company_name && (
                          <span className="text-sm text-muted-foreground">({fisherman.company_name})</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun pêcheur favori sélectionné
                  </p>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => navigate('/premium/reglages')}
                >
                  <Heart className="h-4 w-4" />
                  Modifier mes pêcheurs favoris
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Ports préférés - Affichage réel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Ports préférés</CardTitle>
              </div>
              <CardDescription>
                Recevez des alertes pour ces ports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {favoritePorts.length > 0 ? (
                <div className="space-y-2">
                  {favoritePorts.map(port => (
                    <div key={port.id} className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{port.name}</span>
                      <span className="text-sm text-muted-foreground">({port.city})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun port préféré sélectionné
                </p>
              )}
              
              {userRole === 'premium' ? (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => navigate('/premium/reglages')}
                >
                  <MapPin className="h-4 w-4" />
                  Modifier mes ports favoris
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/premium')}
                >
                  Passer Premium pour ajouter des ports
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Espèces préférées */}
          {userRole === 'premium' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Fish className="h-5 w-5 text-primary" />
                  <CardTitle>Espèces favorites</CardTitle>
                </div>
                <CardDescription>
                  Vos espèces préférées pour les alertes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {favoriteSpecies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {favoriteSpecies.map(species => (
                      <Badge key={species.id} variant="secondary">
                        {species.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucune espèce favorite sélectionnée
                  </p>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => navigate('/premium/reglages')}
                >
                  <Fish className="h-4 w-4" />
                  Modifier mes espèces favorites
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Activité */}
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                Vos dernières interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="text-foreground">
                      {userRole === 'fisherman' ? 'Compte pêcheur créé' : 'Inscription à QuaiDirect'}
                    </p>
                    <p className="text-muted-foreground">Récemment</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="mt-6 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
            <CardDescription>
              Actions irréversibles sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="gap-2">
              Supprimer mon compte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Compte;
