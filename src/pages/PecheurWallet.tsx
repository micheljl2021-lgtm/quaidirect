import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  MessageSquare, 
  Gift, 
  ShoppingCart,
  TrendingUp,
  Copy,
  CheckCircle
} from 'lucide-react';
import Header from '@/components/Header';

interface WalletData {
  balance_sms: number;
  balance_eur_cents: number;
}

interface WalletHistoryItem {
  id: string;
  operation_type: string;
  sms_delta: number;
  eur_cents_delta: number;
  notes: string;
  created_at: string;
}

const PecheurWallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [history, setHistory] = useState<WalletHistoryItem[]>([]);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchWalletData = async () => {
      try {
        // Get fisherman ID
        const { data: fisherman } = await supabase
          .from('fishermen')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!fisherman) {
          toast({
            title: 'Erreur',
            description: 'Profil pêcheur non trouvé',
            variant: 'destructive',
          });
          return;
        }

        // For now, set a placeholder affiliate code based on fisherman id
        setAffiliateCode(fisherman.id.slice(0, 8));

        // Set default wallet data (tables don't exist yet)
        setWallet({ balance_sms: 0, balance_eur_cents: 0 });
        setHistory([]);
      } catch (error) {
        console.error('Error fetching wallet data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données du wallet',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [user, toast]);

  const copyAffiliateLink = () => {
    if (affiliateCode) {
      const link = `https://quaidirect.fr/premium?ref=${affiliateCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: 'Lien copié',
        description: 'Le lien d\'affiliation a été copié dans le presse-papier',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      opening_bonus: 'Bonus ouverture',
      pack_purchase: 'Achat pack SMS',
      affiliate_premium: 'Affiliation Premium',
      affiliate_premium_plus: 'Affiliation Premium+',
      sms_sent: 'SMS envoyé',
      manual_adjustment: 'Ajustement manuel',
    };
    return labels[type] || type;
  };

  const getOperationColor = (type: string) => {
    if (type.includes('affiliate') || type === 'opening_bonus' || type === 'pack_purchase') {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-6xl mx-auto px-4 py-12">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wallet SMS</h1>
          <p className="text-muted-foreground">
            Gérez vos crédits SMS et suivez vos revenus d'affiliation
          </p>
        </div>

        {/* Wallet Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solde SMS</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{wallet?.balance_sms || 0} SMS</div>
              <p className="text-xs text-muted-foreground">
                Disponibles dans votre wallet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur en euros</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((wallet?.balance_eur_cents || 0) / 100).toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground">
                Basé sur 0.07€/SMS
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acheter des SMS</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="sm">
                Voir les packs SMS
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Rechargez votre wallet
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Affiliate Section */}
        {affiliateCode && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Programme d'affiliation
              </CardTitle>
              <CardDescription>
                Partagez votre lien et gagnez des crédits SMS quand vos clients passent Premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Votre lien d'affiliation</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`https://quaidirect.fr/premium?ref=${affiliateCode}`}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-muted"
                    />
                    <Button onClick={copyAffiliateLink} variant="outline">
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Premium (25€/an)</p>
                    <p className="text-2xl font-bold text-blue-600">114 SMS</p>
                    <p className="text-xs text-blue-700">crédités par souscription</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">Premium+ (40€/an)</p>
                    <p className="text-2xl font-bold text-purple-600">257 SMS</p>
                    <p className="text-xs text-purple-700">crédités par souscription</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Historique des opérations
            </CardTitle>
            <CardDescription>
              Les 20 dernières transactions sur votre wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune opération pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getOperationLabel(item.operation_type)}</Badge>
                        <span className={`font-semibold ${getOperationColor(item.operation_type)}`}>
                          {item.sms_delta > 0 ? '+' : ''}{item.sms_delta} SMS
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PecheurWallet;
