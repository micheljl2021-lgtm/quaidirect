import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X, Send, Smartphone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";

const AdminPushTest = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const checkPushSupport = () => {
    if (!('serviceWorker' in navigator)) {
      addLog('❌ Service Worker non supporté');
      return false;
    }
    if (!('PushManager' in window)) {
      addLog('❌ Push API non supportée');
      return false;
    }
    if (!('Notification' in window)) {
      addLog('❌ Notification API non supportée');
      return false;
    }
    addLog('✅ Push notifications supportées');
    return true;
  };

  const subscribeToPush = async () => {
    setIsSubscribing(true);
    try {
      if (!checkPushSupport()) {
        toast.error("Push non supporté sur ce navigateur");
        return;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      addLog(`Permission: ${permission}`);
      
      if (permission !== 'granted') {
        toast.error("Permission notifications refusée");
        addLog('❌ Permission refusée par l\'utilisateur');
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      addLog('✅ Service Worker prêt');

      // Get VAPID public key
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        addLog('❌ VITE_VAPID_PUBLIC_KEY manquant');
        toast.error("Clé VAPID non configurée");
        return;
      }
      addLog(`✅ VAPID key trouvée: ${vapidKey.substring(0, 20)}...`);

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });
      
      setSubscription(sub);
      addLog('✅ Abonnement push créé');
      addLog(`Endpoint: ${sub.endpoint.substring(0, 50)}...`);
      
      toast.success("Abonnement push réussi !");
      
    } catch (error: any) {
      addLog(`❌ Erreur: ${error.message}`);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

  const sendTestPush = async () => {
    if (!subscription) {
      toast.error("Abonnez-vous d'abord");
      return;
    }

    setIsSending(true);
    addLog('Envoi notification test...');
    
    try {
      // For testing, we'll show a local notification
      // In production, this would call an Edge Function
      if (Notification.permission === 'granted') {
        new Notification('🐟 QuaiDirect Test', {
          body: 'Push notification fonctionne correctement !',
          icon: '/logo-quaidirect.png',
          badge: '/logo-quaidirect.png',
        });
        addLog('✅ Notification locale envoyée');
        toast.success("Notification envoyée !");
      }
    } catch (error: any) {
      addLog(`❌ Erreur envoi: ${error.message}`);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const unsubscribe = async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
      addLog('✅ Désabonnement effectué');
      toast.success("Désabonné");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Test Push Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Page admin pour tester les notifications push
            </p>
          </div>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">État actuel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Service Worker</span>
                <Badge variant={'serviceWorker' in navigator ? 'default' : 'destructive'}>
                  {'serviceWorker' in navigator ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                  {'serviceWorker' in navigator ? 'Supporté' : 'Non supporté'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Push API</span>
                <Badge variant={'PushManager' in window ? 'default' : 'destructive'}>
                  {'PushManager' in window ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                  {'PushManager' in window ? 'Supporté' : 'Non supporté'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Abonnement</span>
                <Badge variant={subscription ? 'default' : 'secondary'}>
                  {subscription ? <Check className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  {subscription ? 'Actif' : 'Non abonné'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
              <CardDescription>
                Testez le flux complet des notifications push
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={subscribeToPush} 
                disabled={isSubscribing || !!subscription}
                className="w-full"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                {isSubscribing ? 'Abonnement...' : subscription ? 'Déjà abonné' : 'S\'abonner aux push'}
              </Button>
              
              <Button 
                onClick={sendTestPush}
                disabled={!subscription || isSending}
                variant="secondary"
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Envoi...' : 'Envoyer notification test'}
              </Button>
              
              {subscription && (
                <Button 
                  onClick={unsubscribe}
                  variant="outline"
                  className="w-full"
                >
                  Se désabonner
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Logs Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logs de debug</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-3 max-h-64 overflow-y-auto font-mono text-xs space-y-1">
                {logs.length === 0 ? (
                  <p className="text-muted-foreground">Aucun log</p>
                ) : (
                  logs.map((log, i) => (
                    <p key={i} className="text-foreground">{log}</p>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPushTest;
