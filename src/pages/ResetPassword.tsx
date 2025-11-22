import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Anchor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si nous avons un token de réinitialisation valide
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidToken(true);
      } else {
        toast({
          title: 'Lien invalide',
          description: 'Ce lien de réinitialisation est invalide ou a expiré',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/auth'), 2000);
      }
    });
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 6 caractères',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été modifié avec succès',
      });

      setTimeout(() => navigate('/auth'), 1500);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Anchor className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">QuaiDirect</h1>
          <p className="text-muted-foreground">Réinitialisation du mot de passe</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nouveau mot de passe</CardTitle>
            <CardDescription>
              Entrez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Nouveau mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Modification...' : 'Modifier le mot de passe'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                Retour à la connexion
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
