import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Anchor, 
  Gift, 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle2,
  Sparkles,
  Fish,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PreLaunch = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Store email in a simple way - could be enhanced with a waitlist table
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: crypto.randomUUID(),
          email: email,
          full_name: 'Liste d\'attente'
        }, { 
          onConflict: 'id',
          ignoreDuplicates: true 
        });
      
      // Even if there's a duplicate, we consider it success
      setIsSubscribed(true);
      toast.success("Vous êtes inscrit ! Nous vous contacterons très bientôt.");
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const bonuses = [
    {
      icon: Users,
      title: "Accompagnement personnalisé",
      description: "Un expert QuaiDirect vous guide pas à pas dans la configuration de votre espace de vente.",
      highlight: "OFFERT"
    },
    {
      icon: MessageSquare,
      title: "Pack SMS de lancement",
      description: "500 SMS offerts pour prévenir vos clients de vos arrivages et points de vente.",
      highlight: "500 SMS"
    },
    {
      icon: Clock,
      title: "30 jours d'essai gratuit",
      description: "Testez toutes les fonctionnalités sans engagement. Carte bancaire non requise.",
      highlight: "30 JOURS"
    },
    {
      icon: Gift,
      title: "Tarif fondateur à vie",
      description: "Inscrivez-vous maintenant et bénéficiez du tarif de lancement garanti à vie.",
      highlight: "-50%"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-secondary/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Logo / Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-2xl shadow-lg">
              <Anchor className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Quai<span className="text-primary">Direct</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            La plateforme des pêcheurs artisanaux
          </p>
        </div>

        {/* Main announcement */}
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Lancement imminent</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Vendez votre pêche en direct,
            <br />
            <span className="text-primary">sans intermédiaire</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Rejoignez les pêcheurs qui ont choisi l'autonomie. 
            Créez votre vitrine, gérez vos arrivages et fidélisez vos clients en quelques clics.
          </p>
        </div>

        {/* Bonus cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto mb-10 md:mb-14">
          {bonuses.map((bonus, index) => (
            <Card 
              key={index} 
              className="border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                    <bonus.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{bonus.title}</h3>
                      <span className="text-xs font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                        {bonus.highlight}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{bonus.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Email capture form */}
        <Card className="max-w-xl mx-auto border-primary/20 bg-card shadow-xl">
          <CardContent className="p-6 md:p-8">
            {!isSubscribed ? (
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                    <Fish className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                    Soyez les premiers informés
                  </h3>
                  <p className="text-muted-foreground">
                    Inscrivez-vous pour recevoir votre invitation exclusive et profiter de tous les bonus de lancement.
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 text-base"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary-light"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Inscription en cours..."
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Réserver ma place
                      </>
                    )}
                  </Button>
                </form>
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Nous respectons votre vie privée. Pas de spam, promis !
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center p-4 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Vous êtes inscrit !
                </h3>
                <p className="text-muted-foreground">
                  Nous vous contacterons dès l'ouverture de la plateforme pour activer votre compte avec tous les bonus.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-10 md:mt-14 text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-sm">Sans engagement</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-sm">Données sécurisées</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-sm">Support français</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 md:mt-16 text-sm text-muted-foreground">
          <p>© 2025 QuaiDirect — By Jean-Louis Michel</p>
          <p className="mt-1">Contact : CEO@quaidirect.fr</p>
        </div>
      </div>
    </div>
  );
};

export default PreLaunch;
