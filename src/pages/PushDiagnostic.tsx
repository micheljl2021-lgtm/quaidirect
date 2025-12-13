import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import PushDiagnostic from '@/components/PushDiagnostic';
import { Loader2 } from 'lucide-react';

const PushDiagnosticPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl px-4 py-8">
        <PushDiagnostic />
      </div>
    </div>
  );
};

export default PushDiagnosticPage;
