import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Download as DownloadIcon, Globe, Check, Apple, Chrome } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

type Platform = 'android' | 'ios' | 'desktop';

export default function Download() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<Platform>('desktop');
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else {
      setPlatform('desktop');
    }
  }, []);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await promptInstall();
      if (success) {
        setTimeout(() => navigate('/'), 1000);
      }
    } else {
      // Rediriger vers l'app si pas installable
      navigate('/');
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Application installée !
              </h1>
              <p className="text-gray-600">
                QuaiDirect est maintenant disponible sur votre appareil.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full bg-primary hover:bg-primary-light"
            >
              Ouvrir QuaiDirect
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center">
              <Smartphone className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Télécharger QuaiDirect
              </h1>
              <p className="text-gray-600 mt-2">
                Installez l'application pour un accès rapide
              </p>
            </div>
          </div>

          {/* Android */}
          {platform === 'android' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Chrome className="h-5 w-5" />
                <span className="font-semibold">Installation sur Android</span>
              </div>
              
              {isInstallable ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Cliquez sur le bouton ci-dessous pour installer QuaiDirect sur votre appareil Android.
                  </p>
                  <Button 
                    onClick={handleInstallClick}
                    className="w-full bg-primary hover:bg-primary-light"
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Installer l'application
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Pour installer l'application :
                  </p>
                  <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                    <li>Ouvrez ce site dans Chrome</li>
                    <li>Appuyez sur le menu (⋮)</li>
                    <li>Sélectionnez "Installer l'application"</li>
                  </ol>
                  <Button 
                    onClick={handleInstallClick}
                    className="w-full bg-primary hover:bg-primary-light"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Ouvrir QuaiDirect
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* iOS */}
          {platform === 'ios' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Apple className="h-5 w-5" />
                <span className="font-semibold">Installation sur iOS</span>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Pour installer QuaiDirect sur votre iPhone ou iPad :
                </p>
                <ol className="text-sm text-gray-700 space-y-3 list-decimal list-inside">
                  <li>Ouvrez ce site dans <strong>Safari</strong></li>
                  <li>Appuyez sur l'icône <strong>Partager</strong> (□↑)</li>
                  <li>Faites défiler et sélectionnez <strong>"Sur l'écran d'accueil"</strong></li>
                  <li>Appuyez sur <strong>"Ajouter"</strong></li>
                </ol>
                
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full bg-primary hover:bg-primary-light"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Ouvrir dans Safari
                </Button>
              </div>
            </div>
          )}

          {/* Desktop */}
          {platform === 'desktop' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Globe className="h-5 w-5" />
                <span className="font-semibold">Installation sur ordinateur</span>
              </div>
              
              {isInstallable ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Installez QuaiDirect pour y accéder rapidement depuis votre bureau.
                  </p>
                  <Button 
                    onClick={handleInstallClick}
                    className="w-full bg-primary hover:bg-primary-light"
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Installer l'application
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Scannez ce QR code avec votre téléphone pour installer l'application mobile.
                  </p>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                      <p className="text-gray-400 text-sm text-center px-4">
                        QR Code vers<br/>quaidirect.fr/telecharger
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Utiliser la version web
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Avantages */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Pourquoi installer l'application ?
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Accès rapide depuis votre écran d'accueil</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Notifications pour les nouveaux arrivages</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Fonctionne même hors ligne</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Expérience native optimisée</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
