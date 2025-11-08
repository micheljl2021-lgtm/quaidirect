import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, User, Bell, MapPin, Settings } from "lucide-react";

const Compte = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarFallback className="bg-primary/10 text-2xl">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-foreground">
                      Utilisateur QuaiDirect
                    </h1>
                    <Badge variant="outline" className="gap-1">
                      <User className="h-3 w-3" />
                      Gratuit
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    user@quaidirect.fr
                  </p>
                </div>
                
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Modifier le profil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Premium Status */}
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
              <div className="p-4 rounded-lg bg-muted text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Vous n'êtes pas encore Premium
                </p>
                <Button className="w-full bg-gradient-ocean hover:opacity-90">
                  Passer Premium
                </Button>
              </div>
              
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
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="h-3 w-3" />
                  Port-en-Bessin
                </Badge>
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
                    <p className="text-foreground">Inscription à QuaiDirect</p>
                    <p className="text-muted-foreground">Il y a 2 jours</p>
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
