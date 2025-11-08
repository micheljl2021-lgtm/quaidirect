import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Anchor, Upload, FileText, CheckCircle2 } from 'lucide-react';
import Header from '@/components/Header';

const PecheurOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Identité pro
  const [siret, setSiret] = useState('');
  const [siren, setSiren] = useState('');
  const [boatName, setBoatName] = useState('');
  const [immat, setImmat] = useState('');
  const [photo, setPhoto] = useState('');

  // Step 2: Charte
  const [acceptTraceability, setAcceptTraceability] = useState(false);
  const [acceptLabeling, setAcceptLabeling] = useState(false);
  const [acceptRules, setAcceptRules] = useState(false);

  const progress = (step / 3) * 100;

  const handleStep1Next = () => {
    if (!boatName || !immat) {
      toast({
        title: 'Informations manquantes',
        description: 'Veuillez remplir au minimum le nom du bateau et l\'immatriculation.',
        variant: 'destructive',
      });
      return;
    }
    setStep(2);
  };

  const handleStep2Next = () => {
    if (!acceptTraceability || !acceptLabeling || !acceptRules) {
      toast({
        title: 'Acceptation requise',
        description: 'Vous devez accepter toutes les conditions pour continuer.',
        variant: 'destructive',
      });
      return;
    }
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Récupérer le port par défaut (Hyères)
      const { data: port, error: portError } = await supabase
        .from('ports')
        .select('id')
        .eq('name', 'Port Saint-Pierre - Hyères')
        .maybeSingle() as { data: { id: string } | null; error: any };

      if (portError) {
        console.error('Error fetching port:', portError);
      }

      // Créer le profil pêcheur
      const { error } = await supabase
        .from('fishermen')
        .insert({
          user_id: user.id,
          siret: siret || null,
          siren: siren || null,
          boat_name: boatName,
          immat_navire: immat,
          photo: photo || null,
          home_port_id: port?.id || null,
          verified_at: null,
        }) as { error: any };

      if (error) throw error;

      toast({
        title: 'Demande envoyée',
        description: 'Votre profil pêcheur est en attente de validation par notre équipe.',
      });

      navigate('/compte');
    } catch (error: any) {
      console.error('Error creating fisherman profile:', error);
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-2xl px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Anchor className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Devenir pêcheur vérifié</h1>
            <p className="text-muted-foreground">Vendez votre poisson en direct à quai</p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Étape {step} sur 3
            </p>
          </div>

          {/* Step 1: Identité pro */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Identité professionnelle
                </CardTitle>
                <CardDescription>
                  Informations sur votre activité de pêche
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET (optionnel)</Label>
                    <Input
                      id="siret"
                      placeholder="12345678901234"
                      value={siret}
                      onChange={(e) => setSiret(e.target.value)}
                      maxLength={14}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siren">SIREN (optionnel)</Label>
                    <Input
                      id="siren"
                      placeholder="123456789"
                      value={siren}
                      onChange={(e) => setSiren(e.target.value)}
                      maxLength={9}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boatName">Nom du bateau *</Label>
                  <Input
                    id="boatName"
                    placeholder="L'Espérance"
                    value={boatName}
                    onChange={(e) => setBoatName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="immat">Immatriculation navire *</Label>
                  <Input
                    id="immat"
                    placeholder="HY-123456"
                    value={immat}
                    onChange={(e) => setImmat(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Photo (URL)</Label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="photo"
                      placeholder="https://..."
                      value={photo}
                      onChange={(e) => setPhoto(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button onClick={handleStep1Next} className="w-full">
                  Suivant
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Charte */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Charte et légalité
                </CardTitle>
                <CardDescription>
                  Engagements pour une vente directe responsable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="traceability"
                      checked={acceptTraceability}
                      onCheckedChange={(checked) => setAcceptTraceability(checked as boolean)}
                    />
                    <label
                      htmlFor="traceability"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      Je m'engage à garantir la <strong>traçabilité</strong> de mes captures 
                      (zone FAO, date de capture, engin de pêche)
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="labeling"
                      checked={acceptLabeling}
                      onCheckedChange={(checked) => setAcceptLabeling(checked as boolean)}
                    />
                    <label
                      htmlFor="labeling"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      Je m'engage à respecter les <strong>règles d'étiquetage</strong> 
                      (nom commercial et scientifique, taille minimale)
                    </label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="rules"
                      checked={acceptRules}
                      onCheckedChange={(checked) => setAcceptRules(checked as boolean)}
                    />
                    <label
                      htmlFor="rules"
                      className="text-sm leading-relaxed cursor-pointer"
                    >
                      Je m'engage à respecter les <strong>règles de vente directe</strong> 
                      et la réglementation en vigueur
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Pour plus d'informations, consultez notre{' '}
                    <a href="/legal" className="text-primary hover:underline">
                      page légale
                    </a>
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={handleStep2Next} className="flex-1">
                    Suivant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Validation */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Soumettre à validation
                </CardTitle>
                <CardDescription>
                  Dernière étape avant validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                    <h3 className="font-medium">Récapitulatif</h3>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p><strong>Bateau :</strong> {boatName}</p>
                      <p><strong>Immatriculation :</strong> {immat}</p>
                      {siret && <p><strong>SIRET :</strong> {siret}</p>}
                      {siren && <p><strong>SIREN :</strong> {siren}</p>}
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Votre demande sera examinée par notre équipe. 
                      Vous recevrez un e-mail une fois votre profil validé.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Retour
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Envoi...' : 'Soumettre ma demande'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PecheurOnboarding;
