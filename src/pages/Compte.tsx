import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useClientSubscriptionLevel } from "@/hooks/useClientSubscriptionLevel";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, User, Bell, Settings, Anchor, Shield, ArrowLeft, Loader2, ExternalLink, Bug, Send } from "lucide-react";
import { toast } from "sonner";

interface NotificationPrefs {
  push_enabled: boolean;
  email_enabled: boolean;
}

const Compte = () => {
  const { user, userRole, isVerifiedFisherman } = useAuth();
  const { level: subscriptionLevel, isPremium, isLoading: subLoading } = useClientSubscriptionLevel();
  const navigate = useNavigate();
  const location = useLocation();
  const [fishermanData, setFishermanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({ push_enabled: true, email_enabled: false });
  const [savingNotifs, setSavingNotifs] = useState(false);
  
  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<'bug' | 'idea'>('bug');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch fisherman data if applicable
        if (userRole === 'fisherman') {
          const { data } = await supabase
            .from('fishermen')
            .select('id, slug, boat_name, company_name')
            .eq('user_id', user.id)
            .maybeSingle();
          
          setFishermanData(data);
        }

        // Fetch notification preferences
        const { data: notifPrefs } = await supabase
          .from('notification_preferences')
          .select('push_enabled, email_enabled')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (notifPrefs) {
          setNotificationPrefs({
            push_enabled: notifPrefs.push_enabled ?? true,
            email_enabled: notifPrefs.email_enabled ?? false
          });
        }
        
        // Set feedback email from user
        setFeedbackEmail(user.email || '');
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, userRole, navigate]);

  // Scroll to feedback section if hash is #feedback
  useEffect(() => {
    if (location.hash === '#feedback' && !loading) {
      const feedbackSection = document.getElementById('feedback-section');
      if (feedbackSection) {
        feedbackSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash, loading]);

  const handleNotificationToggle = async (key: 'push_enabled' | 'email_enabled', value: boolean) => {
    if (!user) return;
    
    setSavingNotifs(true);
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          push_enabled: newPrefs.push_enabled,
          email_enabled: newPrefs.email_enabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      toast.success('Préférences mises à jour');
    } catch (error) {
      console.error('Error saving notification prefs:', error);
      toast.error('Erreur lors de la sauvegarde');
      setNotificationPrefs(notificationPrefs);
    } finally {
      setSavingNotifs(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackDescription.trim() || feedbackDescription.length < 20) {
      toast.error('Description trop courte (min 20 caractères)');
      return;
    }

    if (!feedbackEmail.trim()) {
      toast.error('Email obligatoire');
      return;
    }

    setSubmittingFeedback(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        type: feedbackType,
        page: window.location.pathname,
        description: feedbackDescription.trim(),
        email: feedbackEmail.trim(),
        user_id: user?.id || null,
      });

      if (error) throw error;

      toast.success('Merci ! Nous avons reçu votre retour 🙏');
      setFeedbackDescription('');
      setFeedbackType('bug');
    } catch (err) {
      console.error('Feedback error:', err);
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getSubscriptionBadge = () => {
    if (userRole === 'admin') {
      return (
        <Badge variant="outline" className="gap-1 bg-destructive/10 text-destructive border-destructive">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    if (userRole === 'fisherman') {
      return (
        <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary">
          <Anchor className="h-3 w-3" />
          Pêcheur ✓
        </Badge>
      );
    }
    
    // Client subscription level
    switch (subscriptionLevel) {
      case 'premium_plus':
        return (
          <Badge variant="outline" className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Crown className="h-3 w-3" />
            Premium+
          </Badge>
        );
      case 'premium':
        return (
          <Badge variant="outline" className="gap-1 bg-gradient-ocean text-white border-0">
            <Crown className="h-3 w-3" />
            Premium
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            Standard (Gratuit)
          </Badge>
        );
    }
  };

  const getDashboardRoute = () => {
    if (isPremium) return '/dashboard/premium';
    return '/dashboard/user';
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Bloc Profil */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarFallback className="bg-primary/10 text-2xl">
                  {userRole === 'fisherman' ? (
                    <Anchor className="h-8 w-8" />
                  ) : userRole === 'admin' ? (
                    <Shield className="h-8 w-8" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">
                      {fishermanData?.boat_name || user?.email?.split('@')[0] || 'Utilisateur'}
                    </h1>
                    {getSubscriptionBadge()}
                  </div>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                
                {userRole === 'fisherman' && fishermanData?.id && (
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => navigate('/pecheur/edit-profile')}
                  >
                    <Settings className="h-4 w-4" />
                    Modifier le profil
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {/* Bloc Mon Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-premium" />
                <CardTitle>Mon plan</CardTitle>
              </div>
              <CardDescription>
                Votre niveau d'abonnement actuel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">
                      {subscriptionLevel === 'premium_plus' ? 'Premium+' : 
                       subscriptionLevel === 'premium' ? 'Premium' : 'Standard (Gratuit)'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isPremium ? 
                        'Accès aux fonctionnalités avancées' : 
                        'Accès aux fonctionnalités de base'}
                    </p>
                  </div>
                  {getSubscriptionBadge()}
                </div>
              </div>
              
              {!isPremium && userRole !== 'fisherman' && (
                <Button 
                  className="w-full bg-gradient-ocean hover:opacity-90"
                  onClick={() => navigate('/premium')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Passer Premium
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Bloc Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Configurer mes alertes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Notifications Push</p>
                    <p className="text-xs text-muted-foreground">Alertes du navigateur pour les arrivages</p>
                  </div>
                  <Switch
                    checked={notificationPrefs.push_enabled}
                    onCheckedChange={(v) => handleNotificationToggle('push_enabled', v)}
                    disabled={savingNotifs}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Notifications Email</p>
                    <p className="text-xs text-muted-foreground">
                      {isPremium ? 'Alertes par email (points de vente, espèces)' : 'Réservé aux abonnés Premium'}
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.email_enabled}
                    onCheckedChange={(v) => handleNotificationToggle('email_enabled', v)}
                    disabled={savingNotifs || !isPremium}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloc Mes Préférences - CTA vers dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>Mes préférences</CardTitle>
              <CardDescription>
                Gérer vos pêcheurs favoris, ports préférés et alertes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full gap-2"
                onClick={() => navigate(getDashboardRoute() + '#preferences')}
              >
                <Settings className="h-4 w-4" />
                Gérer mes favoris et notifications
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>

          {/* Bloc Mon activité pêcheur (uniquement pour pêcheurs) */}
          {userRole === 'fisherman' && isVerifiedFisherman && (
            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Anchor className="h-5 w-5 text-primary" />
                  <CardTitle>Mon activité pêcheur</CardTitle>
                </div>
                <CardDescription>
                  Gérez vos arrivages et votre vitrine
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {fishermanData && (
                  <div className="p-3 bg-primary/5 rounded-lg space-y-1">
                    <p className="font-medium">{fishermanData.boat_name}</p>
                    {fishermanData.company_name && (
                      <p className="text-sm text-muted-foreground">{fishermanData.company_name}</p>
                    )}
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Button 
                    variant="default"
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/dashboard/pecheur')}
                  >
                    <Anchor className="h-4 w-4" />
                    Aller au tableau de bord pêcheur
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/pecheur/preferences')}
                  >
                    <Settings className="h-4 w-4" />
                    Gérer mes points de vente
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => navigate('/pecheur/contacts')}
                  >
                    <User className="h-4 w-4" />
                    Mes contacts clients
                  </Button>
                  
                  {fishermanData?.slug && (
                    <Button 
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => navigate(`/pecheurs/${fishermanData.slug}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir ma vitrine publique
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signaler un problème / Feedback */}
          <Card id="feedback-section">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Signaler un bug ou une idée</CardTitle>
              </div>
              <CardDescription>
                Aidez-nous à améliorer QuaiDirect
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={feedbackType} onValueChange={(v) => setFeedbackType(v as 'bug' | 'idea')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">🐞 Bug</SelectItem>
                      <SelectItem value="idea">💡 Idée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <Textarea
                    placeholder="Décrivez le problème ou votre idée..."
                    value={feedbackDescription}
                    onChange={(e) => setFeedbackDescription(e.target.value)}
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Min 20 caractères ({feedbackDescription.length}/20)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={feedbackEmail}
                    onChange={(e) => setFeedbackEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={submittingFeedback} className="gap-2">
                  {submittingFeedback ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {submittingFeedback ? 'Envoi...' : 'Envoyer'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Zone dangereuse */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Zone dangereuse</CardTitle>
              <CardDescription>
                Actions irréversibles sur votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" className="gap-2">
                Supprimer mon compte
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Compte;
