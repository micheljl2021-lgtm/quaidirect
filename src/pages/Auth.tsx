import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Anchor, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'auth' | 'otp'>('auth');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithPassword, verifyOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;
      
      // Check if this is a test account and assign role
      const testAccounts: Record<string, 'fisherman' | 'premium' | 'admin'> = {
        'test@pecheur.fr': 'fisherman',
        'test@premium.fr': 'premium',
        'test@admin.fr': 'admin',
      };
      
      if (data.user && testAccounts[email.toLowerCase()]) {
        // Call the helper function to assign role
        await supabase.rpc('add_test_user_role', {
          user_email: email.toLowerCase(),
          user_role: testAccounts[email.toLowerCase()],
        });
      }
      
      toast({
        title: 'Compte créé',
        description: 'Connexion automatique en cours...',
      });
      
      // Auto sign in after signup
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (error: any) {
      toast({
        title: 'Erreur d\'inscription',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      
      // Get user role and redirect to appropriate dashboard
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        if (roles && roles.length > 0) {
          const userRoles = roles.map(r => r.role);
          if (userRoles.includes('admin')) {
            navigate('/dashboard/admin');
          } else if (userRoles.includes('fisherman')) {
            navigate('/dashboard/pecheur');
          } else if (userRoles.includes('premium')) {
            navigate('/dashboard/premium');
          } else {
            navigate('/dashboard/user');
          }
        } else {
          navigate('/dashboard/user');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email);
      setStep('otp');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      navigate('/');
    } catch (error) {
      console.error('Error verifying OTP:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Anchor className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">QuaiDirect</h1>
          <p className="text-muted-foreground">Connexion à votre compte</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'auth' && 'Connexion'}
              {step === 'otp' && 'Vérification'}
            </CardTitle>
            <CardDescription>
              {step === 'auth' && 'Connectez-vous à votre compte'}
              {step === 'otp' && 'Saisissez le code reçu par e-mail'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'auth' ? (
              <div className="space-y-4">
                <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'signin' | 'signup')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Connexion</TabsTrigger>
                    <TabsTrigger value="signup">Inscription</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin">
                    <Tabs defaultValue="password" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="password">Mot de passe</TabsTrigger>
                        <TabsTrigger value="magic">Lien magique</TabsTrigger>
                      </TabsList>
                
                <TabsContent value="password">
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="votre@email.fr"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="Mot de passe"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="magic">
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="votre@email.fr"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Envoi...' : 'Envoyer le code'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="votre@email.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Mot de passe (min. 6 caractères)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Création...' : 'Créer un compte'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Code envoyé à <span className="font-medium">{email}</span>
                  </p>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? 'Vérification...' : 'Valider'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setStep('auth');
                      setOtp('');
                    }}
                  >
                    Retour
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p className="font-medium">🚀 Comptes de test prêts à l'emploi</p>
          <div className="p-4 rounded-lg bg-muted/50 text-left space-y-1">
            <p><strong>Pêcheur :</strong> test@pecheur.fr / pecheur123</p>
            <p><strong>Premium :</strong> test@premium.fr / premium123</p>
            <p><strong>Admin :</strong> test@admin.fr / admin123</p>
          </div>
          <p className="text-xs text-green-600 font-medium">
            ✓ Connexion directe activée - Aucune confirmation d'email requise
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
