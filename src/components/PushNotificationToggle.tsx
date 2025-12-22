import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Get VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

interface PushNotificationToggleProps {
  fishermanId?: string;
}

const PushNotificationToggle = ({ fishermanId }: PushNotificationToggleProps) => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const checkSubscriptionStatus = async () => {
    setError(null);
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('[Push] Notifications not supported in this browser');
      setError('Notifications non supportées');
      setIsLoading(false);
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service workers not supported');
      setError('Service workers non supportés');
      setIsLoading(false);
      return;
    }

    // Check VAPID key
    if (!VAPID_PUBLIC_KEY) {
      console.error('[Push] VAPID_PUBLIC_KEY is empty or not configured');
      setError('Configuration manquante');
      setIsLoading(false);
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    setPermission(Notification.permission);
    console.log('[Push] Current permission:', Notification.permission);

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service worker ready');
      
      const subscription = await registration.pushManager.getSubscription();
      console.log('[Push] Current subscription:', subscription ? 'exists' : 'none');
      
      if (subscription) {
        // Check if this subscription exists in database
        const { data, error: dbError } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint)
          .maybeSingle();

        if (dbError) {
          console.error('[Push] Error checking subscription in DB:', dbError);
        }

        setIsSubscribed(!!data);
        console.log('[Push] Subscription in DB:', !!data);
      } else {
        setIsSubscribed(false);
      }
    } catch (err) {
      console.error('[Push] Error checking subscription:', err);
      setError('Erreur de vérification');
    } finally {
      setIsLoading(false);
    }
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

    if (!('Notification' in window)) {
      toast.error('Les notifications ne sont pas supportées par votre navigateur');
      return;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('[Push] VAPID_PUBLIC_KEY is missing');
      toast.error('Configuration du serveur manquante. Contactez le support.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[Push] Starting subscription process...');

      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      console.log('[Push] Permission result:', perm);

      if (perm !== 'granted') {
        toast.error('Permission refusée pour les notifications. Vérifiez les paramètres de votre navigateur.');
        return;
      }

      // Register service worker if not already registered
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        console.log('[Push] Registering service worker...');
        registration = await navigator.serviceWorker.register('/sw.js');
        await registration.update();
      }
      console.log('[Push] Service worker registration:', registration.scope);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[Push] Service worker is ready');

      // Subscribe to push notifications
      console.log('[Push] Subscribing with VAPID key:', VAPID_PUBLIC_KEY.substring(0, 20) + '...');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subscriptionData = subscription.toJSON();
      console.log('[Push] Subscription created:', subscriptionData.endpoint?.substring(0, 50) + '...');

      if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
        throw new Error('Subscription data incomplete');
      }

      // Save subscription to database
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (dbError) {
        console.error('[Push] Database error:', dbError);
        throw dbError;
      }

      console.log('[Push] Subscription saved to database');
      setIsSubscribed(true);
      toast.success('🔔 Notifications activées ! Vous serez alerté des nouveaux arrivages');
    } catch (err) {
      console.error('[Push] Error subscribing:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(`Erreur lors de l'activation: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('[Push] Starting unsubscription...');

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('[Push] Browser subscription removed');

        // Remove from database
        const { error: dbError } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        if (dbError) {
          console.error('[Push] Database delete error:', dbError);
          throw dbError;
        }
        console.log('[Push] Subscription removed from database');
      }

      setIsSubscribed(false);
      toast.success('Notifications désactivées');
    } catch (err) {
      console.error('[Push] Error unsubscribing:', err);
      toast.error('Erreur lors de la désactivation');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if user not logged in
  if (!user) {
    return null;
  }

  // Show error state if configuration is missing
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  // Show if notifications not supported
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return (
      <div className="text-sm text-muted-foreground">
        Les notifications ne sont pas supportées
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="h-4 w-4" />
        <span>Notifications bloquées dans votre navigateur</span>
      </div>
    );
  }

  return (
    <Button
      variant={isSubscribed ? 'outline' : 'default'}
      size="sm"
      onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {isSubscribed ? 'Désactiver' : 'Activer'}
    </Button>
  );
};

export default PushNotificationToggle;
