import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { PecheurSmsAnalytics } from '@/components/sms-analytics/PecheurSmsAnalytics';
import PageLoader from '@/components/PageLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const PecheurSmsAnalyticsPage = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    if (userRole !== 'fisherman' && userRole !== 'admin') {
      navigate('/');
      return;
    }

    const fetchFishermanId = async () => {
      try {
        const { data: fisherman, error } = await supabase
          .from('fishermen')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching fisherman:', error);
          setLoading(false);
          return;
        }

        if (fisherman) {
          setFishermanId(fisherman.id);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchFishermanId();
  }, [user, userRole, authLoading, navigate]);

  if (authLoading || loading) {
    return <PageLoader />;
  }

  if (!fishermanId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Impossible de charger vos données. Veuillez vous assurer que votre compte pêcheur est bien configuré.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <PecheurSmsAnalytics fishermanId={fishermanId} />
      </div>
    </div>
  );
};

export default PecheurSmsAnalyticsPage;
