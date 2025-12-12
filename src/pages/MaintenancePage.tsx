import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Anchor, Fish, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LAUNCH_DATE } from "@/lib/constants";

interface MaintenancePageProps {
  showAdminLink?: boolean;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  isLaunched: boolean;
}

function calculateTimeLeft(): TimeLeft {
  const now = new Date();
  const difference = LAUNCH_DATE.getTime() - now.getTime();
  
  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isLaunched: true };
  }
  
  return {
    hours: Math.floor(difference / (1000 * 60 * 60)),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isLaunched: false,
  };
}

export default function MaintenancePage({ showAdminLink = true }: MaintenancePageProps) {
  const [clickCount, setClickCount] = useState(0);
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleLogoClick = () => {
    setClickCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setShowAdminButton(true);
      }
      return newCount;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('launch_subscribers')
        .insert({ 
          email: email.trim().toLowerCase(), 
          message: message.trim() || null 
        });

      if (error) {
        if (error.code === '23505') {
          toast.info("Vous êtes déjà inscrit ! Nous vous contacterons à l'ouverture.");
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast.success("Merci ! Nous vous préviendrons dès l'ouverture.");
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 opacity-20">
          <Fish className="w-16 h-16 text-primary animate-bounce" style={{ animationDelay: '0s' }} />
        </div>
        <div className="absolute top-1/4 right-20 opacity-15">
          <Anchor className="w-20 h-20 text-primary animate-pulse" />
        </div>
        <div className="absolute bottom-20 left-1/4 opacity-20">
          <Fish className="w-12 h-12 text-primary animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute bottom-1/3 right-1/4 opacity-15">
          <Anchor className="w-14 h-14 text-primary animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-lg w-full z-10">
        {/* Logo */}
        <div 
          className="flex items-center justify-center gap-3 mb-8 cursor-pointer select-none"
          onClick={handleLogoClick}
        >
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Fish className="w-8 h-8 text-primary-foreground" />
          </div>
          <span className="text-3xl font-bold text-foreground">QuaiDirect</span>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          {timeLeft.isLaunched ? (
            /* Launched state */
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <h1 className="text-3xl font-bold text-foreground">C'est parti !</h1>
              <p className="text-muted-foreground">
                QuaiDirect est maintenant ouvert. Découvrez le poisson frais de nos pêcheurs locaux !
              </p>
              <Button onClick={handleRefresh} size="lg" className="w-full">
                Accéder au site →
              </Button>
            </div>
          ) : (
            /* Countdown state */
            <div className="space-y-8">
              {/* Countdown */}
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-foreground">🚀 Lancement dans...</h1>
                
                <div className="flex justify-center gap-4">
                  <div className="bg-primary/10 rounded-xl p-4 min-w-[80px]">
                    <div className="text-4xl font-bold text-primary">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">heures</div>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-4 min-w-[80px]">
                    <div className="text-4xl font-bold text-primary">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">minutes</div>
                  </div>
                  <div className="bg-primary/10 rounded-xl p-4 min-w-[80px]">
                    <div className="text-4xl font-bold text-primary">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">secondes</div>
                  </div>
                </div>

                <p className="text-lg text-muted-foreground">
                  Ouverture <span className="font-semibold text-foreground">aujourd'hui à 18h00</span> !
                </p>
                <p className="text-sm text-muted-foreground">
                  Du poisson frais en direct des pêcheurs de votre région
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Email form */}
              {isSubscribed ? (
                <div className="text-center space-y-3 py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-semibold text-foreground">Vous êtes inscrit !</p>
                  <p className="text-sm text-muted-foreground">
                    Nous vous enverrons un email dès l'ouverture.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="font-medium text-foreground">📧 Soyez informé à l'ouverture</p>
                  </div>
                  
                  <Input
                    type="email"
                    placeholder="Votre email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-background"
                    required
                  />
                  
                  <Textarea
                    placeholder="Une question ? Un message ? (optionnel)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-background resize-none"
                    rows={3}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Être informé 🔔
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Admin link (hidden until 5 clicks) */}
        {showAdminLink && showAdminButton && (
          <div className="mt-6 text-center">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Connexion Admin
              </Button>
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2025 QuaiDirect — Pêche artisanale en circuit ultra-court
        </p>
      </div>
    </div>
  );
}
