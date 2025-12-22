import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { requestFCMToken, onForegroundMessage } from '@/lib/firebase';

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

  // Listen for foreground messages
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      // Show toast for foreground notifications
      if (payload.notification) {
        toast(payload.notification.title, {
          description: payload.notification.body,
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const checkSubscriptionStatus = async () => {
    setError(null);
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('[FCM] Notifications not supported in this browser');
      setError('Notifications non supportées');
      setIsLoading(false);
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[FCM] Service workers not supported');
      setError('Service workers non supportés');
      setIsLoading(false);
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    setPermission(Notification.permission);
    console.log('[FCM] Current permission:', Notification.permission);

    try {
      // Check if user has FCM token in database
      const { data, error: dbError } = await supabase
        .from('fcm_tokens')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (dbError) {
        console.error('[FCM] Error checking token in DB:', dbError);
      }

      setIsSubscribed(!!data);
      console.log('[FCM] Token in DB:', !!data);
    } catch (err) {
      console.error('[FCM] Error checking subscription:', err);
      setError('Erreur de vérification');
    } finally {
      setIsLoading(false);
    }
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

    try {
      setIsLoading(true);
      setError(null);
      console.log('[FCM] Starting subscription process...');

      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      console.log('[FCM] Permission result:', perm);

      if (perm !== 'granted') {
        toast.error('Permission refusée pour les notifications. Vérifiez les paramètres de votre navigateur.');
        return;
      }

      // Get FCM token
      console.log('[FCM] Requesting FCM token...');
      const token = await requestFCMToken();
      
      if (!token) {
        console.error('[FCM] Token request failed - check browser console for Firebase errors');
        throw new Error('Impossible d\'obtenir le token. Vérifiez que les notifications sont autorisées et que vous n\'utilisez pas de bloqueur de publicités.');
      }

      console.log('[FCM] Token obtained, saving to database...');

      // Get device info
      const deviceInfo = `${navigator.userAgent.substring(0, 100)}`;

      // Save token to database
      const { error: dbError } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          device_info: deviceInfo,
        }, {
          onConflict: 'user_id,token',
        });

      if (dbError) {
        console.error('[FCM] Database error:', dbError);
        throw dbError;
      }

      console.log('[FCM] Token saved to database');
      setIsSubscribed(true);
      toast.success('🔔 Notifications activées ! Vous serez alerté des nouveaux arrivages');
    } catch (err) {
      console.error('[FCM] Error subscribing:', err);
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
      console.log('[FCM] Starting unsubscription...');

      // Remove from database
      const { error: dbError } = await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', user.id);

      if (dbError) {
        console.error('[FCM] Database delete error:', dbError);
        throw dbError;
      }
      console.log('[FCM] Token removed from database');

      setIsSubscribed(false);
      toast.success('Notifications désactivées');
    } catch (err) {
      console.error('[FCM] Error unsubscribing:', err);
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
