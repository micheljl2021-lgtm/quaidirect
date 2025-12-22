import { useState, useEffect } from 'react';
import { Copy, Check, Link2, Share2, Users, Facebook, Twitter, MessageCircle, Send, Linkedin, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShareOnQuaiDirectButton } from '@/components/SocialShareButtons';

interface FisherReferralLinkProps {
  fishermanId: string;
  fishermanName?: string;
  fishermanSlug?: string;
}

export const FisherReferralLink = ({ fishermanId, fishermanName, fishermanSlug }: FisherReferralLinkProps) => {
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [boatName, setBoatName] = useState<string>('');
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ referralCount: 0, smsEarned: 0 });
  const { toast } = useToast();

  useEffect(() => {
    const fetchAffiliateData = async () => {
      try {
        // Récupérer le code d'affiliation et les infos du pêcheur
        const { data: fisherman, error } = await supabase
          .from('fishermen')
          .select('affiliate_code, boat_name, company_name, slug')
          .eq('id', fishermanId)
          .single();

        if (error) throw error;

        if (fisherman) {
          setBoatName(fisherman.company_name || fisherman.boat_name || '');
          setSlug(fisherman.slug);

          if (fisherman.affiliate_code) {
            setAffiliateCode(fisherman.affiliate_code);
          } else {
            // Générer un code si non existant
            const newCode = generateAffiliateCode();
            const { error: updateError } = await supabase
              .from('fishermen')
              .update({ affiliate_code: newCode })
              .eq('id', fishermanId);

            if (!updateError) {
              setAffiliateCode(newCode);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching affiliate data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliateData();
  }, [fishermanId]);

  const generateAffiliateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Domaine de production pour les liens de parrainage
  const PRODUCTION_DOMAIN = 'https://quaidirect.fr';
  
  const referralUrl = affiliateCode
    ? `${PRODUCTION_DOMAIN}/premium?ref=${affiliateCode}`
    : '';

  const copyToClipboard = async () => {
    if (!referralUrl) return;

    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast({
        title: 'Lien copié !',
        description: 'Partagez ce lien avec vos clients',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le lien',
        variant: 'destructive',
      });
    }
  };

  const shareLink = async () => {
    if (!referralUrl || !navigator.share) return;

    try {
      await navigator.share({
        title: 'Rejoignez QuaiDirect',
        text: 'Suivez mes arrivages de poisson frais sur QuaiDirect !',
        url: referralUrl,
      });
    } catch (err) {
      // User cancelled or share failed silently
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-20 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Link2 className="h-5 w-5 text-primary" />
          Votre lien de parrainage
        </CardTitle>
        <CardDescription>
          Partagez ce lien pour inviter vos clients sur QuaiDirect
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lien partageable */}
        <div className="flex gap-2">
          <Input
            value={referralUrl}
            readOnly
            className="font-mono text-sm bg-muted/50"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          {'share' in navigator && (
            <Button
              variant="outline"
              size="icon"
              onClick={shareLink}
              className="shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Partager sur les réseaux sociaux */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">📣 Annoncez votre présence sur QuaiDirect</p>
          <ShareOnQuaiDirectButton 
            fishermanName={boatName || fishermanName || 'Pêcheur'} 
            fishermanSlug={slug || fishermanSlug}
          />
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.referralCount}</p>
              <p className="text-xs text-muted-foreground">Filleuls Premium</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <span className="text-2xl">📱</span>
            <div>
              <p className="text-2xl font-bold">{stats.smsEarned}</p>
              <p className="text-xs text-muted-foreground">SMS gagnés</p>
            </div>
          </div>
        </div>

        {/* Explication */}
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Quand un client s'inscrit via votre lien et prend un abonnement Premium, 
          vous recevez des SMS gratuits (≈114 SMS pour Premium, ≈257 pour Premium+).
        </p>
      </CardContent>
    </Card>
  );
};

export default FisherReferralLink;
