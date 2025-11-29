import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, ShoppingCart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const SMS_PACKS = [
  { id: 'pack_100', quantity: 100, price: '5€', description: '100 SMS' },
  { id: 'pack_500', quantity: 500, price: '20€', description: '500 SMS', badge: 'Populaire' },
  { id: 'pack_1500', quantity: 1500, price: '50€', description: '1500 SMS', badge: 'Meilleur prix' },
];

export function SmsQuotaManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [quota, setQuota] = useState({
    free_remaining: 0,
    paid_balance: 0,
    total_available: 0,
    free_quota: 100,
    free_used: 0,
  });

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-sms-quota');
      
      if (error) throw error;
      
      setQuota(data);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching SMS quota:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer le quota SMS',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handlePurchase = async (packType: string) => {
    setPurchasing(packType);
    
    try {
      const { data, error } = await supabase.functions.invoke('purchase-sms-pack', {
        body: { pack_type: packType },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: 'Redirection',
          description: 'Ouverture du paiement sécurisé Stripe...',
        });
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (error: any) {
      console.error('Error purchasing SMS pack:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la session de paiement',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(null);
    }
  };

  const freePercentage = (quota.free_used / quota.free_quota) * 100;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Quota SMS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quota Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Quota SMS mensuel
          </CardTitle>
          <CardDescription>
            {quota.free_remaining} SMS gratuits restants ce mois-ci
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>SMS gratuits utilisés</span>
              <span className="font-medium">{quota.free_used} / {quota.free_quota}</span>
            </div>
            <Progress value={freePercentage} className="h-2" />
          </div>
          
          {quota.paid_balance > 0 && (
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">SMS achetés disponibles</span>
                <span className="text-2xl font-bold text-primary">{quota.paid_balance}</span>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total disponible</span>
              <span className="text-2xl font-bold">{quota.total_available} SMS</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Packs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Acheter des SMS supplémentaires
          </CardTitle>
          <CardDescription>
            100 SMS gratuits/mois. Besoin de plus ? Achetez des packs supplémentaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {SMS_PACKS.map((pack) => (
              <Card key={pack.id} className={pack.badge ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg">{pack.description}</CardTitle>
                  {pack.badge && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full w-fit">
                      {pack.badge}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">{pack.price}</div>
                  <Button
                    className="w-full"
                    onClick={() => handlePurchase(pack.id)}
                    disabled={purchasing === pack.id}
                  >
                    {purchasing === pack.id ? 'Chargement...' : 'Acheter'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Les SMS achetés ne sont jamais perdus et restent disponibles sans limite de temps
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
