import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, User, Bell, MapPin, Settings, Anchor, Shield, Fish, ArrowLeft } from "lucide-react";
import { FavoriteSpeciesManager } from "@/components/FavoriteSpeciesManager";

const Compte = () => {
  const { user, userRole, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const [fishermanData, setFishermanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchUserData = async () => {
      if (userRole === 'fisherman') {
        const { data } = await supabase
          .from('fishermen')
          .select('id, slug, boat_name, company_name')
          .eq('user_id', user.id)
          .maybeSingle();
        
        setFishermanData(data);
      }
      setLoading(false);
    };

    fetchUserData();
  }, [user, userRole, navigate]);

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
        {/* Back Button */}
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
                  <div className="p-4 rounded-lg bg-gradient-ocean text-white text-center space-y-2">
                    <p className="font-medium">✓ Vous êtes Premium</p>
                    <p className="text-sm opacity-90">
                      Accès 30 min en avance à tous les arrivages
                    </p>
                  </div>
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
                
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">Avantages Premium :</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Accès 30 min avant le public</li>
                    <li>• Pré-réservation jusqu'à 5 pièces</li>
                    <li>• Notifications personnalisées</li>
                  </ul>
                </div>
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

          {/* Notifications */}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Nouveaux arrivages</span>
                  <div className="h-6 w-11 rounded-full bg-muted relative">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-background transition-transform" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Favoris disponibles</span>
                  <div className="h-6 w-11 rounded-full bg-muted relative">
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-background transition-transform" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Newsletter hebdo</span>
                  <div className="h-6 w-11 rounded-full bg-primary relative">
                    <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-primary-foreground transition-transform" />
                  </div>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">
                Configurer
              </Button>
            </CardContent>
          </Card>

          {/* Favorite Species - Premium Feature */}
          {userRole === 'premium' && (
            <FavoriteSpeciesManager />
          )}

          {/* Ports préférés */}
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
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Aucun port préféré pour le moment
                </p>
              </div>
              
              <Button variant="outline" className="w-full gap-2">
                <MapPin className="h-4 w-4" />
                Ajouter des ports
              </Button>
            </CardContent>
          </Card>

          {/* Activity */}
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
