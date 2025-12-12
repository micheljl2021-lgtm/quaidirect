import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Anchor, 
  Fish, 
  Send, 
  Loader2, 
  CheckCircle,
  Trophy,
  Gift,
  ArrowRight,
  Check,
  Waves,
  Ship,
  Sparkles,
  MapPin,
  Clock,
  Heart,
  Leaf,
  Home,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MaintenancePageProps {
  showAdminLink?: boolean;
}

export default function MaintenancePage({ showAdminLink = true }: MaintenancePageProps) {
  const [clickCount, setClickCount] = useState(0);
  const [showAdminButton, setShowAdminButton] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [inquiryType, setInquiryType] = useState("question");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [earlySubscribers, setEarlySubscribers] = useState<string[]>([]);

  useEffect(() => {
    // Fetch early subscribers for raffle display
    const fetchSubscribers = async () => {
      const { data } = await supabase
        .from('launch_subscribers')
        .select('email')
        .order('created_at', { ascending: true })
        .limit(4);
      
      if (data) {
        setEarlySubscribers(data.map(s => maskEmail(s.email)));
      }
    };
    fetchSubscribers();
  }, []);

  const maskEmail = (email: string): string => {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local[0]}${local[1]}***@${domain}`;
  };

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
          message: message.trim() || null,
          type: inquiryType,
          status: 'new'
        });

      if (error) {
        if (error.code === '23505') {
          toast.info("Vous êtes déjà inscrit !");
        } else {
          throw error;
        }
      } else {
        // Send confirmation email
        try {
          await supabase.functions.invoke('send-inquiry-confirmation', {
            body: { 
              email: email.trim().toLowerCase(), 
              message: message.trim(), 
              type: inquiryType 
            }
          });
        } catch (emailError) {
          console.error('Email confirmation failed:', emailError);
        }
        
        setIsSubscribed(true);
        toast.success("Message envoyé ! Vérifiez votre boîte mail.");
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50">
      {/* Hero Section - Lancement + Tirage au sort */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-100/50 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div 
            onClick={handleLogoClick}
            className="inline-flex items-center gap-3 mb-8 cursor-pointer"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Fish className="w-10 h-10 text-white" />
            </div>
            <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              QuaiDirect
            </span>
          </div>

          {/* Main headline */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              C'est officiel !
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              QuaiDirect est{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                lancé !
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
              Du bateau à votre assiette, sans aucun intermédiaire.
              <br />
              <span className="font-medium text-blue-600">La pêche artisanale reprend le pouvoir.</span>
            </p>
          </div>

          {/* Raffle section */}
          {earlySubscribers.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-xl border border-blue-100 mb-8 max-w-xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900">Tirage au sort</h3>
                <Gift className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-gray-600 mb-4">
                Merci aux <span className="font-bold text-blue-600">{earlySubscribers.length} premiers inscrits</span> qui ont cru en nous !
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {earlySubscribers.map((maskedEmail, i) => (
                  <span 
                    key={i}
                    className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 px-3 py-1.5 rounded-full text-sm font-mono text-blue-700"
                  >
                    {maskedEmail}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                🎁 Un panier de poisson frais sera offert à l'un d'entre vous !
              </p>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/arrivages">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/30">
                Découvrir les arrivages
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={scrollToContact}
              className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-6 text-lg rounded-xl"
            >
              Nous contacter
            </Button>
          </div>

          {/* Scroll indicator */}
          <div className="animate-bounce">
            <ChevronDown className="w-8 h-8 text-blue-400 mx-auto" />
          </div>
        </div>
      </section>

      {/* Section 2: La révolution */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Waves className="w-4 h-4" />
              Une nouvelle ère
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              La révolution de la{' '}
              <span className="text-blue-600">vente directe</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fini les intermédiaires, les criées et les marges obscures.
              Le pêcheur vend directement à quai à ceux qui veulent du vrai poisson frais.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Ship, title: 'Vente à quai', desc: 'Le pêcheur vend directement depuis son bateau' },
              { icon: Clock, title: 'Ultra frais', desc: 'Poisson pêché le jour même, parfois quelques heures avant' },
              { icon: MapPin, title: '100% traçable', desc: 'Vous savez qui a pêché, où, quand et comment' },
              { icon: Leaf, title: 'Zéro gaspillage', desc: 'Vous achetez ce qui est réellement pêché' },
            ].map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Bénéfices Pêcheurs */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Anchor className="w-4 h-4" />
                Pour les marins-pêcheurs
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Reprenez le contrôle de votre métier
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Nous redonnons aux pêcheurs artisanaux ce qui leur appartient : 
                la relation directe avec leurs clients et une rémunération juste.
              </p>
              
              <blockquote className="border-l-4 border-white/50 pl-4 italic text-blue-100">
                "Avant, je vendais à la criée et je ne savais jamais à quel prix. 
                Maintenant, c'est moi qui fixe mes tarifs et je rencontre mes clients."
              </blockquote>
            </div>

            <div className="space-y-4">
              {[
                { icon: '🚫', text: 'Plus de vente aux enchères à des prix dérisoires' },
                { icon: '💰', text: 'Une rémunération juste pour un travail difficile' },
                { icon: '📱', text: "Publication d'arrivage en 2 minutes, même à 3h du matin" },
                { icon: '🤝', text: 'Relation directe et humaine avec vos clients' },
                { icon: '🧠', text: 'Aucune compétence informatique requise' },
                { icon: '📊', text: 'Visibilité sur votre activité et vos ventes' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-lg">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Bénéfices Consommateurs */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Check, title: 'Fraîcheur maximale', desc: 'Pêché le matin, acheté le soir', color: 'bg-green-100 text-green-600' },
                  { icon: MapPin, title: 'Traçabilité totale', desc: 'Bateau, zone, méthode', color: 'bg-blue-100 text-blue-600' },
                  { icon: Heart, title: 'Économie locale', desc: 'Soutenez vos pêcheurs', color: 'bg-red-100 text-red-600' },
                  { icon: Leaf, title: 'Pêche durable', desc: 'Produits de saison', color: 'bg-emerald-100 text-emerald-600' },
                ].map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center mb-3`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Fish className="w-4 h-4" />
                Pour les amateurs de poisson frais
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Le goût du vrai poisson,{' '}
                <span className="text-cyan-600">comme avant</span>
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Vous en avez assez du poisson sans goût des grandes surfaces ? 
                Retrouvez la saveur authentique d'un produit pêché par un artisan de votre région.
              </p>
              <ul className="space-y-3">
                {[
                  'Un lien humain avec celui qui nourrit votre famille',
                  "Des produits de saison, jamais d'élevage industriel",
                  'La fierté de soutenir un métier ancestral',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Tout le monde y gagne */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Un modèle où{' '}
            <span className="text-cyan-400">tout le monde gagne</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12">
            Quand le circuit est court, tout le monde grandit.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { emoji: '🎣', title: 'Le pêcheur', benefits: ['Mieux payé', 'Reconnu', 'Autonome'] },
              { emoji: '🏠', title: 'Le consommateur', benefits: ['Qualité', 'Fraîcheur', 'Confiance'] },
              { emoji: '🌊', title: "L'environnement", benefits: ['Pêche responsable', 'Circuit court', 'Moins de transport'] },
              { emoji: '🏘️', title: 'Le territoire', benefits: ['Économie locale', 'Emplois préservés', 'Patrimoine vivant'] },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{item.emoji}</span>
                  <h3 className="text-xl font-bold">{item.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.benefits.map((b, j) => (
                    <span key={j} className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Comment ça marche */}
      <section className="py-20 px-4 bg-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              3 étapes simples pour du poisson ultra-frais
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Le pêcheur publie son arrivage',
                desc: "En rentrant de pêche, il annonce ce qu'il a attrapé : espèces, quantités, horaire de vente.",
                example: '"Dorade, Loup, Rouget — Demain 7h-9h — Port des Salettes"'
              },
              {
                step: '2',
                title: 'Vous recevez une alerte',
                desc: 'Par email ou notification, vous êtes prévenu dès qu\'un arrivage correspond à vos préférences.',
                example: '🔔 "Nouveau : Loup de ligne disponible demain à Hyères"'
              },
              {
                step: '3',
                title: 'Vous venez chercher à quai',
                desc: 'Rendez-vous au point de vente, rencontrez le pêcheur, voyez le bateau et repartez avec votre poisson.',
                example: '📍 "Rencontrez Jean-Michel sur son bateau Le Mistral"'
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-6 items-start bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {item.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600 mb-3">{item.desc}</p>
                  <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-500 italic">
                    {item.example}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: CTA + Contact */}
      <section id="contact-section" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* Final CTA */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Prêt à rejoindre le mouvement ?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/arrivages">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg">
                  <Fish className="mr-2 w-5 h-5" />
                  Voir les arrivages
                </Button>
              </Link>
              <Link to="/carte">
                <Button variant="outline" size="lg" className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-6 text-lg rounded-xl">
                  <MapPin className="mr-2 w-5 h-5" />
                  Carte des points de vente
                </Button>
              </Link>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Send className="w-4 h-4" />
                Une question ?
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Contactez-nous</h3>
            </div>

            {isSubscribed ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Message envoyé !</h4>
                <p className="text-gray-600">Vérifiez votre boîte mail, nous vous avons envoyé une confirmation.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                <div>
                  <Input
                    type="email"
                    placeholder="Votre email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 bg-white border-gray-200"
                  />
                </div>

                <div>
                  <Select value={inquiryType} onValueChange={setInquiryType}>
                    <SelectTrigger className="h-12 bg-white border-gray-200">
                      <SelectValue placeholder="Type de demande" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="question">Question générale</SelectItem>
                      <SelectItem value="fisherman_interest">Je suis pêcheur et intéressé</SelectItem>
                      <SelectItem value="partnership">Partenariat / Presse</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Textarea
                    placeholder="Votre message (optionnel)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="bg-white border-gray-200 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      Envoyer
                      <Send className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-cyan-400" />
            <span className="font-medium text-white">QuaiDirect</span>
            <span className="text-sm">© 2025</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
            <Link to="/cgv" className="hover:text-white transition-colors">CGV</Link>
            {showAdminLink && showAdminButton && (
              <Link to="/auth" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Connexion Admin
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
