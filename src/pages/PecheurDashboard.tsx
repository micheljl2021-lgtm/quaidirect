import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import CaisseModule from '@/components/CaisseModule';
import { SalePointsSection } from '@/components/SalePointsSection';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStats from '@/components/dashboard/DashboardStats';
import MessagingSection from '@/components/dashboard/MessagingSection';
import ArrivalsList from '@/components/dashboard/ArrivalsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Anchor, Loader2, ShoppingCart, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getRedirectPathByRole } from '@/lib/authRedirect';

const PecheurDashboard = () => {
  const { user, userRole, isVerifiedFisherman, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [drops, setDrops] = useState<any[]>([]);
  const [archivedDrops, setArchivedDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fishermanId, setFishermanId] = useState<string | null>(null);

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

    if (userRole === 'fisherman' && !isVerifiedFisherman) {
      setLoading(false);
      return;
    }

    if (isVerifiedFisherman) {
      fetchDrops();
    }
  }, [user, userRole, isVerifiedFisherman, authLoading, navigate]);

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
        
        // Fetch active drops
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
          .in('status', ['scheduled', 'landed'])
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isVerifiedFisherman) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-2xl px-4 py-8">
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              Votre compte pêcheur est en attente de validation. Vous recevrez un e-mail 
              une fois votre profil vérifié par notre équipe.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <DashboardHeader fishermanId={fishermanId} />

        {fishermanId && <MessagingSection fishermanId={fishermanId} />}

        {fishermanId && <SalePointsSection fishermanId={fishermanId} />}

        <DashboardStats drops={drops} />

        <Tabs defaultValue="arrivages" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="arrivages" className="gap-2">
              <Anchor className="h-4 w-4" />
              Mes arrivages
            </TabsTrigger>
            <TabsTrigger value="caisse" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Caisse au port
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arrivages">
            <ArrivalsList 
              drops={drops} 
              archivedDrops={archivedDrops} 
              fishermanId={fishermanId}
              onRefresh={fetchDrops}
            />
          </TabsContent>

          <TabsContent value="caisse">
            <CaisseModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PecheurDashboard;
