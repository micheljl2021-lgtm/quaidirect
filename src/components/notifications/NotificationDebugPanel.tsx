import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { requestFCMToken, getFirebaseMessaging } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Bell,
  Smartphone,
  Monitor,
  Wifi,
  Database,
  Key,
  Send
} from "lucide-react";
import { toast } from "sonner";

interface DiagnosticResult {
  step: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  detail?: string;
}

const NotificationDebugPanel = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [platform, setPlatform] = useState<string>('');
  const [tokenInDb, setTokenInDb] = useState<string | null>(null);

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) {
      setPlatform('iOS (Safari/WebView)');
    } else if (/Android/.test(ua)) {
      setPlatform('Android');
    } else if (/Windows/.test(ua)) {
      setPlatform('Windows');
    } else if (/Mac/.test(ua)) {
      setPlatform('macOS');
    } else if (/Linux/.test(ua)) {
      setPlatform('Linux');
    } else {
      setPlatform('Inconnu');
    }
  }, []);

  const addResult = (result: DiagnosticResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (step: string, update: Partial<DiagnosticResult>) => {
    setResults(prev => prev.map(r => r.step === step ? { ...r, ...update } : r));
  };

  const runDiagnostic = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setTokenInDb(null);

    // Step 1: Check VAPID Key
    addResult({ step: 'vapid', status: 'pending', message: 'Vérification clé VAPID...' });
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (vapidKey && vapidKey.length > 50) {
      updateResult('vapid', { 
        status: 'success', 
        message: 'Clé VAPID configurée',
        detail: `Longueur: ${vapidKey.length} | Début: ${vapidKey.substring(0, 12)}...`
      });
    } else {
      updateResult('vapid', { 
        status: 'error', 
        message: 'Clé VAPID manquante ou invalide',
        detail: vapidKey ? `Longueur: ${vapidKey.length}` : 'Non définie'
      });
      setIsRunning(false);
      return;
    }

    // Step 2: Check browser support
    addResult({ step: 'browser', status: 'pending', message: 'Vérification support navigateur...' });
    if (!('Notification' in window)) {
      updateResult('browser', { 
        status: 'error', 
        message: 'Notifications non supportées',
        detail: `Plateforme: ${platform}`
      });
      setIsRunning(false);
      return;
    }
    if (!('serviceWorker' in navigator)) {
      updateResult('browser', { 
        status: 'error', 
        message: 'Service Worker non supporté',
        detail: `Plateforme: ${platform}`
      });
      setIsRunning(false);
      return;
    }
    updateResult('browser', { 
      status: 'success', 
      message: 'Navigateur compatible',
      detail: `Plateforme: ${platform}`
    });

    // Step 3: Check permission
    addResult({ step: 'permission', status: 'pending', message: 'Vérification permission...' });
    const permission = Notification.permission;
    if (permission === 'denied') {
      updateResult('permission', { 
        status: 'error', 
        message: 'Notifications bloquées',
        detail: 'Allez dans les paramètres du navigateur pour autoriser'
      });
      setIsRunning(false);
      return;
    }
    if (permission === 'default') {
      updateResult('permission', { 
        status: 'warning', 
        message: 'Permission non demandée',
        detail: 'Cliquez sur "Activer" pour demander l\'autorisation'
      });
    } else {
      updateResult('permission', { 
        status: 'success', 
        message: 'Notifications autorisées',
        detail: `Permission: ${permission}`
      });
    }

    // Step 4: Check Service Worker
    addResult({ step: 'sw', status: 'pending', message: 'Vérification Service Worker...' });
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        // Try to register
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
        updateResult('sw', { 
          status: 'success', 
          message: 'Service Worker enregistré',
          detail: `Scope: ${reg.scope}`
        });
      } else {
        const mainReg = registrations.find(r => r.active?.scriptURL.includes('sw.js'));
        if (mainReg) {
          updateResult('sw', { 
            status: 'success', 
            message: 'Service Worker actif',
            detail: `URL: ${mainReg.active?.scriptURL.split('/').pop()} | Scope: ${mainReg.scope}`
          });
        } else {
          updateResult('sw', { 
            status: 'warning', 
            message: 'Service Worker trouvé mais pas le bon',
            detail: registrations.map(r => r.active?.scriptURL.split('/').pop()).join(', ')
          });
        }
      }
    } catch (err: any) {
      updateResult('sw', { 
        status: 'error', 
        message: 'Erreur Service Worker',
        detail: err.message
      });
      setIsRunning(false);
      return;
    }

    // Step 5: Try Firebase Messaging
    addResult({ step: 'firebase', status: 'pending', message: 'Initialisation Firebase...' });
    try {
      const messaging = getFirebaseMessaging();
      if (!messaging) {
        updateResult('firebase', { 
          status: 'error', 
          message: 'Firebase Messaging indisponible',
          detail: 'Le navigateur ne supporte pas FCM'
        });
        setIsRunning(false);
        return;
      }
      updateResult('firebase', { 
        status: 'success', 
        message: 'Firebase Messaging initialisé'
      });
    } catch (err: any) {
      updateResult('firebase', { 
        status: 'error', 
        message: 'Erreur Firebase',
        detail: err.message
      });
      setIsRunning(false);
      return;
    }

    // Step 6: Get FCM Token
    addResult({ step: 'token', status: 'pending', message: 'Obtention token FCM...' });
    try {
      const token = await requestFCMToken();
      if (token) {
        updateResult('token', { 
          status: 'success', 
          message: 'Token FCM obtenu',
          detail: `${token.substring(0, 20)}...${token.substring(token.length - 10)}`
        });

        // Step 7: Save to database
        addResult({ step: 'db_save', status: 'pending', message: 'Enregistrement en base...' });
        try {
          const deviceInfo = `${platform} - ${navigator.userAgent.substring(0, 50)}`;
          
          // Delete old tokens for this user first
          await supabase
            .from('fcm_tokens')
            .delete()
            .eq('user_id', user.id);

          // Insert new token
          const { error: insertError } = await supabase
            .from('fcm_tokens')
            .insert({
              user_id: user.id,
              token: token,
              device_info: deviceInfo
            });

          if (insertError) {
            updateResult('db_save', { 
              status: 'error', 
              message: 'Erreur sauvegarde',
              detail: insertError.message
            });
          } else {
            updateResult('db_save', { 
              status: 'success', 
              message: 'Token enregistré en base'
            });

            // Step 8: Verify in database
            addResult({ step: 'db_verify', status: 'pending', message: 'Vérification en base...' });
            const { data: verifyData, error: verifyError } = await supabase
              .from('fcm_tokens')
              .select('token, created_at')
              .eq('user_id', user.id)
              .maybeSingle();

            if (verifyError) {
              updateResult('db_verify', { 
                status: 'error', 
                message: 'Erreur lecture base',
                detail: verifyError.message
              });
            } else if (verifyData) {
              setTokenInDb(verifyData.token);
              updateResult('db_verify', { 
                status: 'success', 
                message: 'Token confirmé en base',
                detail: `Créé: ${new Date(verifyData.created_at).toLocaleString()}`
              });
            } else {
              updateResult('db_verify', { 
                status: 'error', 
                message: 'Token non trouvé en base après insertion'
              });
            }
          }
        } catch (dbErr: any) {
          updateResult('db_save', { 
            status: 'error', 
            message: 'Exception base de données',
            detail: dbErr.message
          });
        }
      } else {
        updateResult('token', { 
          status: 'error', 
          message: 'Impossible d\'obtenir le token FCM',
          detail: 'Vérifiez la permission et réessayez'
        });
      }
    } catch (tokenErr: any) {
      updateResult('token', { 
        status: 'error', 
        message: 'Erreur obtention token',
        detail: `${tokenErr.code || ''} ${tokenErr.message}`
      });
    }

    setIsRunning(false);
  };

  const sendTestNotification = async () => {
    if (!user || !tokenInDb) {
      toast.error('Lancez d\'abord le diagnostic');
      return;
    }

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-fcm-notification', {
        body: {
          userIds: [user.id],
          message: {
            title: '🔔 Test QuaiDirect',
            body: `Notification envoyée à ${new Date().toLocaleTimeString()}`,
            icon: '/icon-192.png',
            data: { url: '/compte' }
          }
        }
      });

      if (error) {
        toast.error(`Erreur: ${error.message}`);
      } else if (data?.sent > 0) {
        toast.success(`Notification envoyée ! (${data.sent} succès, ${data.failed} échec)`);
      } else {
        toast.warning(`Aucune notification envoyée. Détail: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      toast.error(`Exception: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const resetAndRetry = async () => {
    if (!user) return;

    setIsRunning(true);
    setResults([]);
    
    addResult({ step: 'reset', status: 'pending', message: 'Réinitialisation...' });

    try {
      // Delete tokens from DB
      await supabase
        .from('fcm_tokens')
        .delete()
        .eq('user_id', user.id);

      // Unregister service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }

      // Clear caches
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }

      updateResult('reset', { 
        status: 'success', 
        message: 'Réinitialisation terminée',
        detail: `${registrations.length} SW supprimés, ${cacheNames.length} caches vidés`
      });

      toast.success('Réinitialisation terminée. Relancez le diagnostic.');
    } catch (err: any) {
      updateResult('reset', { 
        status: 'error', 
        message: 'Erreur réinitialisation',
        detail: err.message
      });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'vapid':
        return <Key className="h-4 w-4" />;
      case 'browser':
        return <Monitor className="h-4 w-4" />;
      case 'permission':
        return <Bell className="h-4 w-4" />;
      case 'sw':
        return <Wifi className="h-4 w-4" />;
      case 'firebase':
      case 'token':
        return <Smartphone className="h-4 w-4" />;
      case 'db_save':
      case 'db_verify':
        return <Database className="h-4 w-4" />;
      default:
        return <RefreshCw className="h-4 w-4" />;
    }
  };

  if (!user) {
    return null;
  }

  const hasErrors = results.some(r => r.status === 'error');
  const allSuccess = results.length > 0 && results.every(r => r.status === 'success');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Diagnostic Notifications Push
            </CardTitle>
            <CardDescription>
              Plateforme détectée : <Badge variant="outline">{platform}</Badge>
              {platform.includes('iOS') && (
                <span className="text-yellow-600 ml-2 text-xs">
                  ⚠️ iOS a des limitations pour les notifications web
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Lancer le diagnostic
          </Button>

          <Button 
            onClick={resetAndRetry} 
            disabled={isRunning}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Réinitialiser
          </Button>

          {tokenInDb && (
            <Button 
              onClick={sendTestNotification} 
              disabled={isSendingTest || isRunning}
              variant="secondary"
              className="gap-2"
            >
              {isSendingTest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Envoyer test
            </Button>
          )}
        </div>

        {/* Status summary */}
        {results.length > 0 && (
          <div className={`p-3 rounded-lg ${
            allSuccess ? 'bg-green-500/10 border border-green-500/30' :
            hasErrors ? 'bg-destructive/10 border border-destructive/30' :
            'bg-yellow-500/10 border border-yellow-500/30'
          }`}>
            {allSuccess ? (
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                ✅ Tout est configuré ! Cliquez sur "Envoyer test" pour vérifier.
              </p>
            ) : hasErrors ? (
              <p className="text-sm font-medium text-destructive">
                ❌ Des erreurs ont été détectées. Consultez les détails ci-dessous.
              </p>
            ) : (
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                ⚠️ Diagnostic en cours ou avertissements détectés.
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result) => (
              <div 
                key={result.step} 
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(result.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStepIcon(result.step)}
                    <p className="text-sm font-medium">{result.message}</p>
                  </div>
                  {result.detail && (
                    <p className="text-xs text-muted-foreground mt-1 break-words whitespace-pre-wrap font-mono">
                      {result.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help text */}
        {results.length === 0 && (
          <div className="p-4 bg-muted/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Cliquez sur "Lancer le diagnostic" pour vérifier la configuration des notifications push.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationDebugPanel;
