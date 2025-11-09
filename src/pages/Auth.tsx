import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Anchor } from 'lucide-react';

// Emails de test qui peuvent se connecter directement
const TEST_EMAILS = [
  'test@pecheur.fr',
  'test@premium.fr', 
  'test@admin.fr'
];

const Auth = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithPassword, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Si c'est un email de test, connexion automatique SANS backend
      if (TEST_EMAILS.includes(email.toLowerCase())) {
        // Simuler une connexion réussie avec les bons rôles
        const fakeUserId = email === 'test@pecheur.fr' ? 'pecheur-test-id' :
                          email === 'test@premium.fr' ? 'premium-test-id' : 'admin-test-id';
        
        const roles = email === 'test@pecheur.fr' ? ['user', 'fisherman'] :
                     email === 'test@premium.fr' ? ['user', 'premium'] : ['user', 'admin'];
        
        localStorage.setItem('test_user_id', fakeUserId);
        localStorage.setItem('test_user_email', email);
        localStorage.setItem('test_user_roles', JSON.stringify(roles));
        
        setTimeout(() => {
          navigate('/');
          window.location.reload();
        }, 500);
      } else {
        await signIn(email);
        setStep('otp');
      }
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
              {step === 'email' && 'Connexion par e-mail'}
              {step === 'otp' && 'Vérification'}
            </CardTitle>
            <CardDescription>
              {step === 'email' && 'Entrez votre adresse e-mail'}
              {step === 'otp' && 'Saisissez le code reçu par e-mail'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
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
                  {loading ? 'Connexion...' : 'Continuer'}
                </Button>
              </form>
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
                      setStep('email');
                      setOtp('');
                    }}
                  >
                    Modifier l'e-mail
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Comptes de test disponibles :</p>
          <p className="mt-1">
            <strong>Pêcheur :</strong> test@pecheur.fr<br />
            <strong>Premium :</strong> test@premium.fr<br />
            <strong>Admin :</strong> test@admin.fr<br />
            <span className="text-xs">(connexion automatique)</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
