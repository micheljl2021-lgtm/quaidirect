import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Bell, 
  BellOff, 
  Send, 
  Loader2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

// Get VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

type DiagnosticStatus = 'ok' | 'error' | 'warning';

interface DiagnosticItemProps {
  label: string;
  status: DiagnosticStatus;
  detail: string;
  endpoint?: string;
}

const DiagnosticItem = ({ label, status, detail, endpoint }: DiagnosticItemProps) => {
  const icons = {
    ok: <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />,
  };

  const bgColors = {
    ok: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
    warning: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${bgColors[status]}`}>
      <div className="flex-shrink-0 mt-0.5">{icons[status]}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{label}</div>
        <div className="text-sm text-muted-foreground mt-1">{detail}</div>
        {endpoint && (
          <div className="text-xs text-muted-foreground mt-1 font-mono break-all">
            {endpoint}
          </div>
        )}
      </div>
    </div>
  );
};

const PushDiagnostic = () => {
  const { user } = useAuth();
  const [browserSupport, setBrowserSupport] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hasServiceWorker, setHasServiceWorker] = useState(false);
  const [hasVapidKey, setHasVapidKey] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    checkDiagnostics();
  }, []);

  const checkDiagnostics = async () => {
    console.log('[Push] Starting diagnostics check...');
    setIsLoading(true);

    // Check browser support
    const support = 'Notification' in window && 'serviceWorker' in navigator;
    setBrowserSupport(support);
    console.log('[Push] Browser support:', support);

    if (!support) {
      setIsLoading(false);
      return;
    }

    // Check permission
    const perm = Notification.permission;
    setPermission(perm);
    console.log('[Push] Permission status:', perm);

    // Check VAPID key
    const hasKey = !!VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY.length > 0;
    setHasVapidKey(hasKey);
    console.log('[Push] VAPID key present:', hasKey);

    // Check Service Worker
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      setHasServiceWorker(!!registration);
      console.log('[Push] Service Worker registered:', !!registration);

      // Check subscription
      if (registration) {
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        console.log('[Push] Subscription:', sub ? 'Active' : 'None');
        if (sub) {
          console.log('[Push] Endpoint:', sub.endpoint);
        }
      }
    } catch (error) {
      console.error('[Push] Error checking Service Worker:', error);
    }

    setIsLoading(false);
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (!browserSupport) {
      toast.error('Les notifications ne sont pas supportées par votre navigateur');
      return;
    }

    if (!hasVapidKey) {
      toast.error('Configuration VAPID manquante côté serveur');
      return;
    }

    try {
      setActionLoading('subscribe');
      console.log('[Push] Starting subscription process...');

      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      console.log('[Push] Permission requested:', perm);

      if (perm !== 'granted') {
        toast.error('Permission refusée pour les notifications');
        return;
      }

      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('[Push] Registering Service Worker...');
        registration = await navigator.serviceWorker.register('/sw.js');
        await registration.update();
      }
      setHasServiceWorker(true);

      // Subscribe to push notifications
      console.log('[Push] Subscribing to push notifications...');
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subscriptionData = sub.toJSON();
      console.log('[Push] Subscription created');

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint!,
          p256dh: subscriptionData.keys!.p256dh!,
          auth: subscriptionData.keys!.auth!,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) throw error;

      setSubscription(sub);
      console.log('[Push] Subscription saved to database');
      toast.success('🔔 Notifications activées avec succès !');
      await checkDiagnostics();
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      toast.error('Erreur lors de l\'activation des notifications');
    } finally {
      setActionLoading(null);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!user) return;

    try {
      setActionLoading('unsubscribe');
      console.log('[Push] Starting unsubscribe process...');

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
        console.log('[Push] Unsubscribed from push');

        // Remove from database
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', sub.endpoint);

        if (error) throw error;
        console.log('[Push] Subscription removed from database');
      }

      setSubscription(null);
      toast.success('Notifications désactivées');
      await checkDiagnostics();
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      toast.error('Erreur lors de la désactivation');
    } finally {
      setActionLoading(null);
    }
  };

  const sendTestPush = async () => {
    if (!user || !subscription) {
      toast.error('Vous devez être abonné aux notifications');
      return;
    }

    try {
      setActionLoading('test');
      console.log('[Push] Sending test notification...');

      const { data, error } = await supabase.functions.invoke('send-test-push', {
        body: { userId: user.id },
      });

      if (error) throw error;

      console.log('[Push] Test notification sent:', data);
      toast.success('Notification de test envoyée ! Vérifiez vos notifications.');
    } catch (error) {
      console.error('[Push] Error sending test push:', error);
      toast.error('Erreur lors de l\'envoi de la notification de test');
    } finally {
      setActionLoading(null);
    }
  };

  const permissionLabels: Record<NotificationPermission, string> = {
    default: 'Non demandée',
    granted: 'Autorisée',
    denied: 'Refusée',
  };

  const getBrowserInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) {
      return 'Chrome: Paramètres → Confidentialité et sécurité → Paramètres des sites → Notifications';
    } else if (userAgent.includes('firefox')) {
      return 'Firefox: Paramètres → Vie privée et sécurité → Permissions → Notifications';
    } else if (userAgent.includes('safari')) {
      return 'Safari: Préférences → Sites web → Notifications';
    }
    return 'Consultez les paramètres de votre navigateur pour gérer les notifications';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Diagnostic des notifications push
            </CardTitle>
            <CardDescription className="mt-2">
              Vérifiez l'état de vos notifications et résolvez les problèmes
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkDiagnostics}
            disabled={isLoading}
          >
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diagnostic items */}
        <div className="space-y-3">
          <DiagnosticItem
            label="Support navigateur"
            status={browserSupport ? 'ok' : 'error'}
            detail={
              browserSupport
                ? 'Notifications supportées ✓'
                : 'Votre navigateur ne supporte pas les notifications push'
            }
          />

          <DiagnosticItem
            label="Permission"
            status={
              permission === 'granted' ? 'ok' : permission === 'denied' ? 'error' : 'warning'
            }
            detail={permissionLabels[permission]}
          />

          {permission === 'denied' && (
            <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Pour réactiver les notifications :</strong><br />
                {getBrowserInstructions()}
              </AlertDescription>
            </Alert>
          )}

          <DiagnosticItem
            label="Service Worker"
            status={hasServiceWorker ? 'ok' : 'warning'}
            detail={
              hasServiceWorker
                ? 'Service Worker enregistré ✓'
                : 'Service Worker non enregistré (sera enregistré lors de l\'abonnement)'
            }
          />

          <DiagnosticItem
            label="VAPID Public Key"
            status={hasVapidKey ? 'ok' : 'error'}
            detail={
              hasVapidKey
                ? 'Clé VAPID configurée ✓'
                : 'Configuration serveur incomplète - contactez l\'administrateur'
            }
          />

          <DiagnosticItem
            label="Abonnement push"
            status={subscription ? 'ok' : 'warning'}
            detail={subscription ? 'Abonné aux notifications ✓' : 'Pas d\'abonnement actif'}
          />

          {subscription?.endpoint && (
            <DiagnosticItem
              label="Endpoint"
              status="ok"
              detail="Endpoint d'abonnement :"
              endpoint={`${subscription.endpoint.substring(0, 80)}...`}
            />
          )}
        </div>

        {/* Action buttons */}
        {user && browserSupport && hasVapidKey && (
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {!subscription ? (
              <Button
                onClick={subscribeToPush}
                disabled={!!actionLoading || permission === 'denied'}
                className="gap-2"
              >
                {actionLoading === 'subscribe' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                S'abonner aux notifications
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={unsubscribeFromPush}
                  disabled={!!actionLoading}
                  className="gap-2"
                >
                  {actionLoading === 'unsubscribe' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                  Se désabonner
                </Button>
                <Button
                  onClick={sendTestPush}
                  disabled={!!actionLoading}
                  className="gap-2"
                >
                  {actionLoading === 'test' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Envoyer un push de test
                </Button>
              </>
            )}
          </div>
        )}

        {/* Status summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2">
            <Badge
              variant={
                subscription && browserSupport && hasVapidKey
                  ? 'default'
                  : !browserSupport || permission === 'denied'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {subscription && browserSupport && hasVapidKey
                ? '✓ Notifications actives'
                : !browserSupport
                ? '✗ Navigateur incompatible'
                : permission === 'denied'
                ? '✗ Permission refusée'
                : !hasVapidKey
                ? '✗ Configuration incomplète'
                : '⚠ Notifications inactives'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PushDiagnostic;
