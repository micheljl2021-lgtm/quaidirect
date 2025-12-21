import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import CaisseModule from '@/components/CaisseModule';
import { SalePointsSection } from '@/components/SalePointsSection';
import { FisherReferralLink } from '@/components/FisherReferralLink';
import { SmsQuotaManager } from '@/components/SmsQuotaManager';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardStatsSkeleton from '@/components/dashboard/DashboardStatsSkeleton';
import MessagingSection from '@/components/dashboard/MessagingSection';
import ArrivalsList from '@/components/dashboard/ArrivalsList';
import ArrivalsListSkeleton from '@/components/dashboard/ArrivalsListSkeleton';
import { MessagerieSection } from '@/components/dashboard/MessagerieSection';
import { QuickDropModal } from '@/components/dashboard/QuickDropModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Anchor, Loader2, ShoppingCart, MessageSquare, AlertCircle, Mail } from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getRedirectPathByRole } from '@/lib/authRedirect';
import { useQuery } from '@tanstack/react-query';
import { TestModeBanner } from '@/components/admin/TestModeBanner';
import { QuickActionBar } from '@/components/dashboard/QuickActionBar';

const PecheurDashboard = () => {
  const { user, userRole, effectiveRole, viewAsRole, isAdmin, isVerifiedFisherman, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drops, setDrops] = useState<any[]>([]);
  const [archivedDrops, setArchivedDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const messagingSectionRef = useRef<HTMLDivElement>(null);
  const [showExpressModal, setShowExpressModal] = useState(false);

  // Get pre-selected drop ID from navigation state
  const preSelectedDropId = (location.state as any)?.selectedDropId as string | undefined;
  const scrollToMessaging = (location.state as any)?.scrollToMessaging as boolean | undefined;

  // Check for ?express=true query param to auto-open the Express modal
  useEffect(() => {
    if (searchParams.get('express') === 'true') {
      setShowExpressModal(true);
      // Remove the query param after opening the modal
      searchParams.delete('express');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

    if (effectiveRole && effectiveRole !== 'fisherman' && effectiveRole !== 'admin') {
      navigate(getRedirectPathByRole(effectiveRole));
      return;
    }

    const isFisherView = effectiveRole === 'fisherman' || effectiveRole === 'admin';
    if (!isFisherView) return;

    // Check if fisherman has completed onboarding
    const checkOnboardingStatus = async () => {
      const { data: fisherman } = await supabase
        .from('fishermen')
        .select('id, boat_name, siret, verified_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!fisherman) {
        // Mode test: on autorise l'accès au dashboard pêcheur même sans profil pêcheur
        if (isAdmin && viewAsRole === 'fisherman') {
          setOnboardingComplete(true);
          setFishermanId(null);
          setLoading(false);
          return;
        }

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
        // Mode test: ne bloque pas sur l'onboarding, on veut pouvoir vérifier l'UI
        if (isAdmin && viewAsRole === 'fisherman') {
          setOnboardingComplete(true);
          setFishermanId(fisherman.id);
          fetchDrops();
          return;
        }

        // Onboarding not complete - redirect to onboarding
        navigate('/pecheur/onboarding');
        return;
      }

      setOnboardingComplete(true);
      setFishermanId(fisherman.id);

      // Onboarding complete - fetch drops directly (no admin verification needed)
      fetchDrops();
    };

    checkOnboardingStatus();
  }, [user, userRole, effectiveRole, viewAsRole, isAdmin, authLoading, navigate]);

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

        // Filter expired drops from active to history (sale_start_time + 2h is in the past)
        const now = new Date();
        const allActive = activeData || [];
        
        const expiredDrops = allActive.filter(drop => {
          // Use sale_start_time + 2 hours as expiration, fallback to eta_at
          const saleStart = drop.sale_start_time ? new Date(drop.sale_start_time) : new Date(drop.eta_at);
          const expirationTime = new Date(saleStart.getTime() + 2 * 60 * 60 * 1000); // +2h
          return expirationTime < now;
        });

        const stillActiveDrops = allActive.filter(drop => {
          const saleStart = drop.sale_start_time ? new Date(drop.sale_start_time) : new Date(drop.eta_at);
          const expirationTime = new Date(saleStart.getTime() + 2 * 60 * 60 * 1000);
          return expirationTime >= now;
        });

        if (!activeError) setDrops(stillActiveDrops);
        if (!archivedError) setArchivedDrops([...expiredDrops, ...(archivedData || [])]);
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

  const isDataLoading = loading;

  // Count drops needing correction
  const dropsNeedingCorrection = drops.filter(d => d.status === 'needs_correction');

  // Mode test actif si l'admin simule un rôle "fisherman"
  const isTestMode = isAdmin && viewAsRole === 'fisherman';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Express Modal - triggered by ?express=true query param */}
      <QuickDropModal 
        open={showExpressModal} 
        onOpenChange={setShowExpressModal}
        onSuccess={() => {
          setShowExpressModal(false);
          fetchDrops();
        }}
      />
      
      <div className="container px-4 py-6 md:py-8">
        {/* Test Mode Banner */}
        {isTestMode && <TestModeBanner roleLabel="Pêcheur" />}

        <DashboardHeader fishermanId={fishermanId} onDropCreated={fetchDrops} />

        {/* Barre d'actions rapides */}
        <QuickActionBar fishermanId={fishermanId} onDropCreated={fetchDrops} />

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

        {fishermanId && <FisherReferralLink fishermanId={fishermanId} />}
        {isDataLoading ? (
          <DashboardStatsSkeleton />
        ) : (
          <DashboardStats drops={drops} archivedDrops={archivedDrops} />
        )}

        <Tabs defaultValue="arrivages" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 h-auto p-1">
            <TabsTrigger value="arrivages" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <Anchor className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">Arrivages</span>
            </TabsTrigger>
            <TabsTrigger value="messagerie" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm relative">
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">Messages</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="caisse" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">Caisse</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2 px-1 sm:px-3 text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              <span className="truncate">SMS</span>
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
