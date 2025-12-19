import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import CaisseModule from '@/components/CaisseModule';
import { SalePointsSection } from '@/components/SalePointsSection';
import { SmsQuotaManager } from '@/components/SmsQuotaManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardStatsSkeleton from '@/components/dashboard/DashboardStatsSkeleton';
import MessagingSection from '@/components/dashboard/MessagingSection';
import ArrivalsList from '@/components/dashboard/ArrivalsList';
import ArrivalsListSkeleton from '@/components/dashboard/ArrivalsListSkeleton';
import { MessagerieSection } from '@/components/dashboard/MessagerieSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Anchor, Loader2, ShoppingCart, MessageSquare, AlertCircle, Mail } from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getRedirectPathByRole } from '@/lib/authRedirect';
import { useQuery } from '@tanstack/react-query';

const PecheurDashboard = () => {
  const { user, userRole, isVerifiedFisherman, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drops, setDrops] = useState<any[]>([]);
  const [archivedDrops, setArchivedDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const messagingSectionRef = useRef<HTMLDivElement>(null);

  // Get pre-selected drop ID from navigation state
  const preSelectedDropId = (location.state as any)?.selectedDropId as string | undefined;
  const scrollToMessaging = (location.state as any)?.scrollToMessaging as boolean | undefined;

  // Count unread messages
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Scroll to messaging section if requested
  useEffect(() => {
    if (scrollToMessaging && messagingSectionRef.current && !loading) {
      setTimeout(() => {
        messagingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [scrollToMessaging, loading]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if (userRole && userRole !== 'fisherman' && userRole !== 'admin') {
      navigate(getRedirectPathByRole(userRole));
      return;
    }

    // Check if fisherman has completed onboarding
    const checkOnboardingStatus = async () => {
      const { data: fisherman } = await supabase
        .from('fishermen')
        .select('id, boat_name, siret, verified_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!fisherman) {
        // No fisherman record - redirect to payment
        navigate('/pecheur/payment');
        return;
      }

      // Check if critical fields are filled (onboarding complete)
      const isOnboardingDone = fisherman.boat_name && 
                               fisherman.boat_name !== 'À compléter' &&
                               fisherman.siret && 
                               fisherman.siret !== 'À compléter';
      
      if (!isOnboardingDone) {
        // Onboarding not complete - redirect to onboarding
        navigate('/pecheur/onboarding');
        return;
      }

      setOnboardingComplete(true);
      setFishermanId(fisherman.id);

      // If admin verified, fetch drops
      if (fisherman.verified_at) {
        fetchDrops();
      } else {
        setLoading(false);
      }
    };

    if (userRole === 'fisherman' || userRole === 'admin') {
      checkOnboardingStatus();
    }
  }, [user, userRole, authLoading, navigate]);

  // Realtime subscription for drops
  useEffect(() => {
    if (!user || !isVerifiedFisherman) return;

    const channel = supabase
      .channel('fisherman-drops-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drops' },
        () => fetchDrops()
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
        
        // Fetch active drops (including needs_correction)
        const { data: activeData, error: activeError } = await supabase
          .from('drops')
          .select(`
            *,
            port:ports(*),
            sale_point:fisherman_sale_points(*),
            offers(*),
            drop_species(species:species(*))
          `)
          .eq('fisherman_id', fisherman.id)
          .in('status', ['scheduled', 'landed', 'needs_correction'])
          .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

        if (!activeError) setDrops(activeData || []);

        // Fetch archived drops
        const { data: archivedData, error: archivedError } = await supabase
          .from('drops')
          .select(`
            *,
            port:ports(*),
            sale_point:fisherman_sale_points(*),
            offers(*),
            drop_species(species:species(*))
          `)
          .eq('fisherman_id', fisherman.id)
          .in('status', ['completed', 'cancelled'])
          .order('created_at', { ascending: false })
          .limit(10) as { data: any[] | null; error: any };

        if (!archivedError) setArchivedDrops(archivedData || []);
      }
    } catch (error) {
      console.error('Error fetching drops:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  // Onboarding complete but awaiting admin verification
  if (onboardingComplete && !isVerifiedFisherman) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-2xl px-4 py-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-500" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Profil en cours de vérification</h1>
            <p className="text-muted-foreground">
              Merci d'avoir complété votre inscription ! Notre équipe vérifie actuellement votre profil.
            </p>
          </div>
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" aria-hidden="true" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              <strong>Prochaine étape :</strong> Vous recevrez un e-mail dès que votre profil sera validé par notre équipe.
              Cela prend généralement moins de 24h.
            </AlertDescription>
          </Alert>
          <div className="text-center text-sm text-muted-foreground">
            <p>Une question ? Contactez-nous à <a href="mailto:support@quaidirect.fr" className="text-primary underline">support@quaidirect.fr</a></p>
          </div>
        </div>
      </div>
    );
  }

  const isDataLoading = loading && isVerifiedFisherman;

  // Count drops needing correction
  const dropsNeedingCorrection = drops.filter(d => d.status === 'needs_correction');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-6 md:py-8">
        <DashboardHeader fishermanId={fishermanId} />

        {/* Alert for drops needing correction */}
        {dropsNeedingCorrection.length > 0 && (
          <Alert className="mb-6 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            <AlertDescription className="text-orange-800 dark:text-orange-300">
              <strong>{dropsNeedingCorrection.length} arrivage{dropsNeedingCorrection.length > 1 ? 's' : ''} nécessite{dropsNeedingCorrection.length > 1 ? 'nt' : ''} une correction.</strong>
              {' '}Ces arrivages sont dépubliés jusqu'à correction. Consultez votre messagerie pour plus de détails.
            </AlertDescription>
          </Alert>
        )}

        {fishermanId && (
          <div ref={messagingSectionRef}>
            <MessagingSection fishermanId={fishermanId} preSelectedDropId={preSelectedDropId} />
          </div>
        )}

        {fishermanId && <SalePointsSection fishermanId={fishermanId} />}

        {isDataLoading ? (
          <DashboardStatsSkeleton />
        ) : (
          <DashboardStats drops={drops} />
        )}

        <Tabs defaultValue="arrivages" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="arrivages" className="gap-2 text-sm">
              <Anchor className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xs:inline">Mes </span>arrivages
            </TabsTrigger>
            <TabsTrigger value="messagerie" className="gap-2 text-sm relative">
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xs:inline">Messagerie</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="caisse" className="gap-2 text-sm">
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xs:inline">Caisse</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2 text-sm">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              <span className="hidden xs:inline">SMS</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arrivages">
            {isDataLoading ? (
              <ArrivalsListSkeleton count={3} />
            ) : (
              <ArrivalsList 
                drops={drops} 
                archivedDrops={archivedDrops} 
                fishermanId={fishermanId}
                onRefresh={fetchDrops}
              />
            )}
          </TabsContent>

          <TabsContent value="messagerie">
            {user && (
              <MessagerieSection 
                userId={user.id} 
                userRole={userRole || undefined}
                fishermanId={fishermanId || undefined}
              />
            )}
          </TabsContent>

          <TabsContent value="caisse">
            <CaisseModule />
          </TabsContent>

          <TabsContent value="sms">
            <SmsQuotaManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PecheurDashboard;
