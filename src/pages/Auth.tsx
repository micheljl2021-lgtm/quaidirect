import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Anchor, Lock } from 'lucide-react';

// Emails de test qui peuvent se connecter directement
const TEST_EMAILS = [
  'test@pecheur.fr',
  'test@premium.fr', 
  'test@admin.fr'
];

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'password' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithPassword, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Si c'est un email de test, passer à l'écran password
      if (TEST_EMAILS.includes(email.toLowerCase())) {
        setStep('password');
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      navigate('/');
    } catch (error) {
      console.error('Error signing in:', error);
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
              {step === 'password' && 'Mot de passe'}
              {step === 'otp' && 'Vérification'}
            </CardTitle>
            <CardDescription>
              {step === 'email' && 'Entrez votre adresse e-mail'}
              {step === 'password' && 'Entrez votre mot de passe'}
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
                  {loading ? 'Envoi...' : 'Continuer'}
                </Button>
              </form>
            ) : step === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Connexion avec <span className="font-medium">{email}</span>
                  </p>
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
                  <p className="text-xs text-muted-foreground text-center">
                    Mot de passe de test: <code className="bg-muted px-1 rounded">test123</code>
                  </p>
                </div>
                <div className="space-y-2">
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setStep('email');
                      setPassword('');
                    }}
                  >
                    Modifier l'e-mail
                  </Button>
                </div>
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
            <span className="text-xs">(mot de passe : test123)</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
