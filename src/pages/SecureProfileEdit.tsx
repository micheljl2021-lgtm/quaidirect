import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const SecureProfileEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error('Error getting user in SecureProfileEdit:', error);
          setError('Erreur de connexion. Merci de reessayer via le lien recu par email.');
          setStatus('error');
          return;
        }

        if (!user) {
          // Pas de session => on renvoie vers /auth avec un redirect
          const params = new URLSearchParams(location.search);
          const redirect = encodeURIComponent('/pecheur/edit-profile');
          params.set('redirect', redirect);
          navigate(`/auth?${params.toString()}`, { replace: true });
          return;
        }

        setStatus('redirecting');
        navigate('/pecheur/edit-profile', { replace: true });
      } catch (e) {
        console.error(e);
        setError('Probleme technique. Contactez le support QuaiDirect.');
        setStatus('error');
      }
    };

    void checkSession();
  }, [navigate, location.search]);

  if (status === 'checking' || status === 'redirecting') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="text-lg font-semibold">Securisation de votre acces...</p>
          <p className="text-sm text-muted-foreground">
            On vous redirige vers la page de modification de profil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4 text-center">
        <p className="text-lg font-semibold">Lien invalide ou expire</p>
        <p className="text-sm text-muted-foreground">
          {error || 'Demandez a l\'equipe QuaiDirect de vous renvoyer un nouveau lien.'}
        </p>
        <Button onClick={() => navigate('/')}>Retour a l'accueil</Button>
      </div>
    </div>
  );
};

export default SecureProfileEdit;
