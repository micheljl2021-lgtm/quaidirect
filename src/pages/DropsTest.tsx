import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Fish, MapPin } from 'lucide-react';

interface TestDrop {
  id: string;
  port: string;
  eta: Date;
  visibleAt: Date;
  publicVisibleAt: Date;
  isPremium: boolean;
  offers: Array<{
    species: string;
    quantity: number;
    price: number;
  }>;
}

const DropsTest = () => {
  const { user, userRole } = useAuth();
  const [drops, setDrops] = useState<TestDrop[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Mettre à jour l'heure actuelle chaque seconde
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Créer des drops de test BETA
    const now = new Date();
    const testDrops: TestDrop[] = [
      {
        id: '1',
        port: 'Port de Hyères',
        eta: new Date(now.getTime() + 15 * 60000), // Dans 15 min
        visibleAt: new Date(now.getTime() - 5 * 60000), // Visible depuis 5 min (Premium)
        publicVisibleAt: new Date(now.getTime() + 25 * 60000), // Public dans 25 min
        isPremium: true,
        offers: [
          { species: 'Daurade', quantity: 12, price: 15 },
          { species: 'Loup de mer', quantity: 8, price: 22 }
        ]
      },
      {
        id: '2',
        port: 'Port de Toulon',
        eta: new Date(now.getTime() + 45 * 60000), // Dans 45 min
        visibleAt: new Date(now.getTime() + 10 * 60000), // Visible dans 10 min (Premium)
        publicVisibleAt: new Date(now.getTime() + 40 * 60000), // Public dans 40 min
        isPremium: false,
        offers: [
          { species: 'Rouget', quantity: 20, price: 12 },
          { species: 'Pageot', quantity: 15, price: 10 }
        ]
      },
      {
        id: '3',
        port: 'Port de Saint-Tropez',
        eta: new Date(now.getTime() + 90 * 60000), // Dans 1h30
        visibleAt: new Date(now.getTime() + 60 * 60000), // Visible dans 1h (Premium)
        publicVisibleAt: new Date(now.getTime() + 90 * 60000), // Public dans 1h30
        isPremium: false,
        offers: [
          { species: 'Bar', quantity: 10, price: 18 },
          { species: 'Sole', quantity: 6, price: 25 }
        ]
      }
    ];

    setDrops(testDrops);
  }, []);

  const getTimeUntil = (date: Date) => {
    const diff = date.getTime() - currentTime.getTime();
    if (diff < 0) return 'Maintenant';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}min`;
    }
    
    return `${minutes}min ${seconds}s`;
  };

  const canSee = (drop: TestDrop) => {
    const isPremiumUser = userRole === 'premium';
    
    if (isPremiumUser) {
      return currentTime >= drop.visibleAt;
    } else {
      return currentTime >= drop.publicVisibleAt;
    }
  };

  const getAccessBadge = (drop: TestDrop) => {
    const isPremiumUser = userRole === 'premium';
    const canView = canSee(drop);
    
    if (!canView && !isPremiumUser) {
      const timeLeft = getTimeUntil(drop.publicVisibleAt);
      return (
        <Badge variant="secondary" className="gap-2">
          <Clock className="h-3 w-3" />
          Ouverture dans {timeLeft}
        </Badge>
      );
    }
    
    if (canView && isPremiumUser && currentTime < drop.publicVisibleAt) {
      return (
        <Badge className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500">
          ⭐ Accès Premium
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Débarquements à venir</h1>
          <p className="text-muted-foreground">
            {userRole === 'premium' ? (
              <span className="flex items-center gap-2">
                ⭐ <strong>Accès Premium</strong> : Vous voyez les débarquements 30 min avant tout le monde
              </span>
            ) : (
              'Découvrez les prochains débarquements de poisson frais'
            )}
          </p>
        </div>

        {/* Statut utilisateur */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Votre statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type de compte</span>
              <Badge variant={userRole === 'premium' ? 'default' : 'secondary'}>
                {userRole === 'premium' ? '⭐ Premium' : 'Gratuit'}
              </Badge>
            </div>
            {userRole !== 'premium' && (
              <Button className="w-full mt-4" onClick={() => window.location.href = '/premium'}>
                Passer Premium pour voir en avant-première
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Liste des drops */}
        <div className="space-y-4">
          {drops.map((drop) => {
            const visible = canSee(drop);
            
            return (
              <Card key={drop.id} className={!visible ? 'opacity-50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {drop.port}
                      </CardTitle>
                      <CardDescription>
                        Arrivée prévue : {drop.eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </CardDescription>
                    </div>
                    {getAccessBadge(drop)}
                  </div>
                </CardHeader>
                <CardContent>
                  {visible ? (
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        {drop.offers.map((offer, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <Fish className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium">{offer.species}</p>
                                <p className="text-sm text-muted-foreground">{offer.quantity} pièces disponibles</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{offer.price}€</p>
                              <p className="text-xs text-muted-foreground">la pièce</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full">
                        {userRole === 'premium' ? 'Pré-réserver (max 5 pièces)' : 'Réserver'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-2">
                      <Clock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Ce débarquement sera visible dans <strong>{getTimeUntil(drop.publicVisibleAt)}</strong>
                      </p>
                      {userRole !== 'premium' && (
                        <p className="text-sm text-primary">
                          Les membres Premium peuvent déjà voir et réserver ce drop !
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DropsTest;
