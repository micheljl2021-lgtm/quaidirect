import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Anchor, Lock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getRedirectPathByRole } from '@/lib/authRedirect';

// Helper functions for role management
const getPrimaryRole = (userRoles: string[] = []) => {
  if (userRoles.includes('admin')) return 'admin';
  if (userRoles.includes('fisherman')) return 'fisherman';
  if (userRoles.includes('premium')) return 'premium';
  return 'user';
};

const fetchPrimaryRole = async (userId: string) => {
  const { data: roles, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return 'user';
  }

  const userRoles = roles?.map((r: { role: string }) => r.role) || [];
  return getPrimaryRole(userRoles);
};

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [step, setStep] = useState<'auth' | 'otp' | 'reset'>('auth');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithPassword, signInWithGoogle, verifyOtp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Capture referral code from URL on mount
  useEffect(() => {
    const refCode = searchParams.get('ref') || searchParams.get('referral') || searchParams.get('code');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setAuthMode('signup'); // Switch to signup mode if referral code is present
      console.log('[AUTH] Referral code captured from URL:', refCode);
    }
  }, [searchParams]);

  const handlePostAuthRedirect = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const primaryRole = await fetchPrimaryRole(user.id);
    navigate(getRedirectPathByRole(primaryRole));
  };


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            referral_code: referralCode || null,
          },
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        console.log('[SIGNUP] User created:', data.user.id);
        
        // Assigner le rôle 'user' de base
        try {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({ user_id: data.user.id, role: 'user' });

          if (roleError) {
            console.error('[SIGNUP] Error assigning user role:', roleError);
          } else {
            console.log('[SIGNUP] User role assigned successfully');
          }
        } catch (roleError) {
          console.error('[SIGNUP] Exception assigning role:', roleError);
        }

        // Traiter le code de parrainage si présent
        if (referralCode) {
          console.log('[SIGNUP] Processing referral code:', referralCode);
          try {
            // Chercher le pêcheur avec ce code d'affiliation
            const { data: fisherman, error: fishermanError } = await supabase
              .from('fishermen')
              .select('id, user_id')
              .eq('affiliate_code', referralCode.toUpperCase())
              .maybeSingle();

            if (fishermanError) {
              console.error('[SIGNUP] Error finding referrer:', fishermanError);
            } else if (fisherman) {
              console.log('[SIGNUP] Found referrer fisherman:', fisherman.id);
              
              // Créer l'entrée dans referrals
              const { error: referralError } = await supabase
                .from('referrals')
                .insert({
                  referrer_id: fisherman.id,
                  referrer_type: 'fisherman',
                  referred_id: data.user.id,
                  referred_type: 'user',
                  bonus_claimed: false,
                });

              if (referralError) {
                console.error('[SIGNUP] Error creating referral:', referralError);
              } else {
                console.log('[SIGNUP] Referral created successfully');
                toast({
                  title: 'Parrainage enregistré !',
                  description: 'Votre parrain recevra son bonus lors de votre premier achat.',
                });
              }
            } else {
              console.log('[SIGNUP] No fisherman found with code:', referralCode);
              toast({
                title: 'Code non reconnu',
                description: 'Le code de parrainage n\'existe pas, mais votre compte a été créé.',
                variant: 'destructive',
              });
            }
          } catch (refError) {
            console.error('[SIGNUP] Exception processing referral:', refError);
          }
        }

        // Envoyer l'email de bienvenue (ne pas bloquer l'inscription si ça échoue)
        try {
          console.log('[SIGNUP] Sending welcome email to:', data.user.email);
          const { data: emailData, error: emailError } = await supabase.functions.invoke('send-user-welcome-email', {
            body: { email: data.user.email }
          });
          
          if (emailError) {
            console.error('[SIGNUP] Email function error:', emailError);
          } else {
            console.log('[SIGNUP] Email sent successfully:', emailData);
          }
        } catch (emailError) {
          console.error('[SIGNUP] Email sending exception:', emailError);
        }

        toast({
          title: 'Compte créé',
          description: 'Connexion automatique en cours...',
        });

        const primaryRole = await fetchPrimaryRole(data.user.id);
        navigate(getRedirectPathByRole(primaryRole));
      }
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
      await handlePostAuthRedirect();
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
      await handlePostAuthRedirect();
    } catch (error) {
      console.error('Error verifying OTP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Email envoyé',
        description: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe',
      });
      setStep('auth');
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      <Link to="/" className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Retour</span>
      </Link>
      
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 hover:bg-primary/20 transition-colors cursor-pointer">
              <Anchor className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">QuaiDirect</h1>
          <p className="text-muted-foreground">Connexion à votre compte</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 'auth' && 'Connexion'}
              {step === 'otp' && 'Vérification'}
              {step === 'reset' && 'Réinitialiser le mot de passe'}
            </CardTitle>
            <CardDescription>
              {step === 'auth' && 'Connectez-vous à votre compte'}
              {step === 'otp' && 'Saisissez le code reçu par e-mail'}
              {step === 'reset' && 'Entrez votre email pour recevoir un lien de réinitialisation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'auth' ? (
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {googleLoading ? 'Connexion...' : 'Se connecter avec Google'}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

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
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" aria-hidden="true" />
                        <PasswordInput
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
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-sm text-muted-foreground"
                      onClick={() => setStep('reset')}
                    >
                      Mot de passe oublié ?
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="magic">
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" aria-hidden="true" />
                    <PasswordInput
                      placeholder="Mot de passe (min. 6 caractères)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      type="text"
                      placeholder="Code parrainage (optionnel)"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="pl-10 uppercase"
                      maxLength={10}
                    />
                  </div>
                  {referralCode && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      Code parrainage : {referralCode}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Création...' : 'Créer un compte'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      ) : step === 'otp' ? (
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
            ) : step === 'reset' ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
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
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setStep('auth');
                      setEmail('');
                    }}
                  >
                    Retour
                  </Button>
                </div>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
