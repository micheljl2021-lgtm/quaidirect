import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Eye, Copy, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingConfirmation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const slug = searchParams.get('slug');
  const publicUrl = `/pecheurs/${slug}`;

  const handleCopyUrl = () => {
    const fullUrl = `${window.location.origin}${publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success('URL copiée dans le presse-papier');
  };

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p>Erreur : Aucun slug trouvé</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-12 pb-12 space-y-8">
          {/* Icon de succès */}
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Message principal */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">
              🎉 Ta page vitrine est prête !
            </h1>
            <p className="text-muted-foreground text-lg">
              Elle sera vérifiée par notre équipe sous 48h
            </p>
          </div>

          {/* URL de la page */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              URL de ta page publique :
            </p>
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono truncate">
                {window.location.origin}{publicUrl}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate(publicUrl)}
              className="gap-2"
            >
              <Eye className="h-5 w-5" />
              Voir ma page publique
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <Home className="h-5 w-5" />
              Retourner sur QuaiDirect
            </Button>
          </div>

          {/* Note complémentaire */}
          <div className="text-center pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Tu recevras un email dès que ta page sera validée et visible publiquement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
