import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { requestFCMToken } from '@/lib/firebase';
import { 
  Bell, 
  BellOff, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw,
  Trash2,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticStep {
  label: string;
  status: 'pending' | 'checking' | 'ok' | 'warning' | 'error';
  message?: string;
}

const NotificationDiagnostic = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<DiagnosticStep[]>([]);

  const updateStep = (index: number, update: Partial<DiagnosticStep>) => {
    setSteps(prev => prev.map((step, i) => i === index ? { ...step, ...update } : step));
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setSteps([
      { label: 'Support navigateur', status: 'pending' },
      { label: 'Permission notifications', status: 'pending' },
      { label: 'Service Worker', status: 'pending' },
      { label: 'Token FCM', status: 'pending' },
      { label: 'Token en base', status: 'pending' },
    ]);

    // Step 1: Browser support
    updateStep(0, { status: 'checking' });
    await new Promise(r => setTimeout(r, 300));
    
    if (!('Notification' in window)) {
      updateStep(0, { status: 'error', message: 'API Notification non disponible' });
      setIsRunning(false);
      return;
    }
    if (!('serviceWorker' in navigator)) {
      updateStep(0, { status: 'error', message: 'Service Workers non supportés' });
      setIsRunning(false);
      return;
    }
    updateStep(0, { status: 'ok', message: 'Notifications et SW supportés' });

    // Step 2: Permission
    updateStep(1, { status: 'checking' });
    await new Promise(r => setTimeout(r, 300));
    
    const permission = Notification.permission;
    if (permission === 'denied') {
      updateStep(1, { status: 'error', message: 'Permission bloquée - réinitialisez dans les paramètres du navigateur' });
      setIsRunning(false);
      return;
    } else if (permission === 'default') {
      updateStep(1, { status: 'warning', message: 'Permission non demandée - cliquez sur "Activer" pour demander' });
    } else {
      updateStep(1, { status: 'ok', message: 'Permission accordée' });
    }

    // Step 3: Service Worker
    updateStep(2, { status: 'checking' });
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const swReg = registrations.find(r => r.active?.scriptURL.includes('sw.js'));
      
      if (swReg) {
        updateStep(2, { status: 'ok', message: `SW actif: ${swReg.scope}` });
      } else {
        updateStep(2, { status: 'warning', message: 'SW non trouvé, tentative d\'enregistrement...' });
        
        try {
          await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
          updateStep(2, { status: 'ok', message: 'SW enregistré avec succès' });
        } catch (swError: any) {
          updateStep(2, { status: 'error', message: `Échec enregistrement SW: ${swError.message}` });
          setIsRunning(false);
          return;
        }
      }
    } catch (swError: any) {
      updateStep(2, { status: 'error', message: `Erreur SW: ${swError.message}` });
      setIsRunning(false);
      return;
    }

    // Step 4: FCM Token
    updateStep(3, { status: 'checking' });
    try {
      // Only try if permission is granted
      if (Notification.permission === 'granted') {
        const token = await requestFCMToken();
        if (token) {
          updateStep(3, { status: 'ok', message: `Token obtenu: ${token.substring(0, 20)}...` });
        } else {
          updateStep(3, { status: 'error', message: 'Impossible d\'obtenir le token - vérifiez la console' });
          setIsRunning(false);
          return;
        }
      } else {
        updateStep(3, { status: 'warning', message: 'Permission requise d\'abord' });
      }
    } catch (tokenError: any) {
      updateStep(3, { status: 'error', message: `Erreur token: ${tokenError.message}` });
      setIsRunning(false);
      return;
    }

    // Step 5: Token in database
    updateStep(4, { status: 'checking' });
    if (user) {
      try {
        const { data, error } = await supabase
          .from('fcm_tokens')
          .select('id, created_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          updateStep(4, { status: 'error', message: `Erreur BDD: ${error.message}` });
        } else if (data) {
          updateStep(4, { status: 'ok', message: `Token enregistré le ${new Date(data.created_at).toLocaleDateString('fr-FR')}` });
        } else {
          updateStep(4, { status: 'warning', message: 'Aucun token en base - cliquez sur "Activer" ci-dessus' });
        }
      } catch (dbError: any) {
        updateStep(4, { status: 'error', message: `Erreur: ${dbError.message}` });
      }
    } else {
      updateStep(4, { status: 'warning', message: 'Non connecté' });
    }

    setIsRunning(false);
  };

  const resetNotifications = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setIsRunning(true);
    try {
      // 1. Delete token from database
      await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', user.id);

      // 2. Unregister service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }

      // 3. Clear caches
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }

      toast.success('Notifications réinitialisées. Rafraîchissez la page et réactivez les notifications.');
      setSteps([]);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const sendTestNotification = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-fcm-notification', {
        body: {
          userIds: [user.id],
          message: {
            title: '🐟 Test QuaiDirect',
            body: 'Si vous voyez ceci, les notifications fonctionnent !',
          }
        }
      });

      if (error) throw error;
      toast.success('Notification de test envoyée ! Vérifiez votre appareil.');
    } catch (error: any) {
      toast.error(`Erreur envoi: ${error.message}`);
    }
  };

  const getStatusIcon = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'pending': return <div className="w-4 h-4 rounded-full border-2 border-muted" />;
      case 'checking': return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'ok': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Diagnostic Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info */}
        <p className="text-sm text-muted-foreground">
          Cet outil vérifie que les notifications push sont correctement configurées sur votre appareil.
        </p>

        {/* Current status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Permission actuelle:</span>
          <Badge variant={
            Notification.permission === 'granted' ? 'default' :
            Notification.permission === 'denied' ? 'destructive' : 'secondary'
          }>
            {Notification.permission === 'granted' ? 'Accordée' :
             Notification.permission === 'denied' ? 'Bloquée' : 'Non demandée'}
          </Badge>
        </div>

        {/* Diagnostic steps */}
        {steps.length > 0 && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                {getStatusIcon(step.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.label}</p>
                  {step.message && (
                    <p className="text-xs text-muted-foreground truncate">{step.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runDiagnostic}
            disabled={isRunning}
          >
            {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Lancer le diagnostic
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetNotifications}
            disabled={isRunning}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>

          <Button 
            variant="default" 
            size="sm" 
            onClick={sendTestNotification}
            disabled={isRunning || !user}
          >
            <Send className="h-4 w-4 mr-2" />
            Envoyer un test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationDiagnostic;