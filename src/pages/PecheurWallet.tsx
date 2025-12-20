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
        // Get fisherman data including affiliate_code
        const { data: fisherman } = await supabase
          .from('fishermen')
          .select('id, affiliate_code')
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

        // Use real affiliate_code from database or generate one
        setAffiliateCode(fisherman.affiliate_code || fisherman.id.slice(0, 8));

        // Fetch SMS pool balance (from premium client contributions)
        const { data: smsPool } = await supabase
          .from('sms_pool')
          .select('balance_cents, total_credited_cents, total_used_cents')
          .eq('fisherman_id', fisherman.id)
          .maybeSingle();

        // Fetch current month SMS usage
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const { data: smsUsage } = await supabase
          .from('fishermen_sms_usage')
          .select('paid_sms_balance, free_sms_used, monthly_allocation, bonus_sms_at_signup')
          .eq('fisherman_id', fisherman.id)
          .eq('month_year', currentMonth)
          .maybeSingle();

        // Calculate total SMS balance
        const paidSmsBalance = smsUsage?.paid_sms_balance || 0;
        const poolBalanceCents = smsPool?.balance_cents || 0;
        // Convert pool cents to SMS (assuming ~5 cents per SMS)
        const poolSmsEquivalent = Math.floor(poolBalanceCents / 5);
        
        setWallet({ 
          balance_sms: paidSmsBalance + poolSmsEquivalent,
          balance_eur_cents: poolBalanceCents
        });
        
        // For now, history is empty (would need to query fishermen_sms_wallet_history)
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
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Programme d'affiliation
              </CardTitle>
              <CardDescription>
                Partagez votre lien et gagnez des crédits SMS quand vos clients passent Premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Votre lien d'affiliation</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`https://quaidirect.fr/premium?ref=${affiliateCode}`}
                      readOnly
                      className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
                    />
                    <Button onClick={copyAffiliateLink} variant="outline">
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Crédits par Premium */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Premium (25€/an)</p>
                    <p className="text-2xl font-bold text-blue-600">~114 SMS</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">crédités par souscription (8€)</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Premium+ (40€/an)</p>
                    <p className="text-2xl font-bold text-purple-600">~257 SMS</p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">crédités par souscription (18€)</p>
                  </div>
                </div>

                {/* Parrainage Pêcheur */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🤝</span>
                    <p className="font-semibold text-orange-900 dark:text-orange-100">Parrainage Pêcheur</p>
                  </div>
                  <p className="text-orange-800 dark:text-orange-200">
                    <span className="font-bold text-lg">+300 SMS</span> pour vous ET pour le nouveau pêcheur parrainé
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                    Partagez votre code auprès de vos collègues pêcheurs
                  </p>
                </div>

                {/* Plafonds selon forfait */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium mb-2">💡 Plafonds d'affiliation selon votre forfait</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• <strong>Standard</strong> : max 200 SMS/mois financés par affiliation</li>
                    <li>• <strong>PRO / ELITE</strong> : crédits illimités</li>
                  </ul>
                  <p className="text-xs mt-2 text-muted-foreground italic">
                    Passez PRO pour débloquer les crédits illimités !
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Challenges Section - Coming Soon */}
        <Card className="mb-8 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Challenges & Récompenses
              <Badge variant="secondary" className="ml-2">Bientôt</Badge>
            </CardTitle>
            <CardDescription>
              Accomplissez des objectifs et gagnez des bonus SMS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg opacity-60">
                <p className="font-medium">5 Premium via votre lien</p>
                <p className="text-xl font-bold text-green-600">+500 SMS</p>
              </div>
              <div className="p-4 border rounded-lg opacity-60">
                <p className="font-medium">10 Premium+ via votre lien</p>
                <p className="text-xl font-bold text-green-600">+1 500 SMS</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Système de challenges disponible prochainement
            </p>
          </CardContent>
        </Card>

        {/* Points System - Coming Soon */}
        <Card className="mb-8 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              Système de Points Partenaires
              <Badge variant="secondary" className="ml-2">Bientôt</Badge>
            </CardTitle>
            <CardDescription>
              Évaluez la tenue des points de vente partagés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">👍 Points positifs</strong> : 
                Bonne tenue du point de vente, propreté, respect des horaires
              </p>
              <p>
                <strong className="text-foreground">👎 Points négatifs</strong> : 
                Problèmes signalés, non-respect des engagements
              </p>
              <div className="p-3 bg-muted rounded-lg mt-4">
                <p className="font-medium text-foreground mb-1">Récompenses à venir :</p>
                <ul className="space-y-1">
                  <li>• Bonus SMS pour les pêcheurs bien notés</li>
                  <li>• Privatisation d'un point de vente</li>
                  <li>• Interdiction temporaire en cas de trop de points négatifs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

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
