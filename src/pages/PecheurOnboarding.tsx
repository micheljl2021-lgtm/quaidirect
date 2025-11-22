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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Anchor, Upload, FileText, CheckCircle2, Fish } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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

  // Step 3: Species selection
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [primarySpecies, setPrimarySpecies] = useState<string>('');

  // Step 4: Fishing activity
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [fishingMethods, setFishingMethods] = useState<string[]>([]);
  const [fishingZones, setFishingZones] = useState('');

  const progress = (step / 5) * 100;

  // Fetch species
  const { data: species } = useQuery({
    queryKey: ['species'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('species')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

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

  const handleStep3Next = () => {
    if (selectedSpecies.length === 0) {
      toast({
        title: 'Sélection requise',
        description: 'Veuillez sélectionner au moins une espèce que vous pêchez.',
        variant: 'destructive',
      });
      return;
    }
    setStep(4);
  };

  const handleStep4Next = () => {
    // All fields optional for this step
    setStep(5);
  };

  const toggleFishingMethod = (method: string) => {
    setFishingMethods(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const toggleSpecies = (speciesId: string) => {
    setSelectedSpecies(prev => 
      prev.includes(speciesId) 
        ? prev.filter(id => id !== speciesId)
        : [...prev, speciesId]
    );
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
          boat_name: boatName,
          boat_registration: immat,
          photo_url: photo || null,
          company_name: companyName || null,
          description: description || null,
          fishing_methods: fishingMethods.length > 0 ? fishingMethods : null,
          fishing_zones: fishingZones ? fishingZones.split(',').map(z => z.trim()) : null,
          verified_at: null,
        }) as { error: any };

      if (error) throw error;

      // Get the created fisherman to link species
      const { data: createdFisherman, error: fetchError } = await supabase
        .from('fishermen')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Save selected species
      if (selectedSpecies.length > 0) {
        const speciesToInsert = selectedSpecies.map(speciesId => ({
          fisherman_id: createdFisherman.id,
          species_id: speciesId,
          is_primary: speciesId === primarySpecies,
        }));

        const { error: speciesError } = await supabase
          .from('fishermen_species')
          .insert(speciesToInsert);

        if (speciesError) throw speciesError;
      }

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
              Étape {step} sur 5
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

          {/* Step 3: Species Selection */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fish className="h-5 w-5" />
                  Espèces pêchées
                </CardTitle>
                <CardDescription>
                  Sélectionnez les espèces que vous pêchez habituellement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                    {species?.map((s) => (
                      <div 
                        key={s.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => toggleSpecies(s.id)}
                      >
                        <Checkbox
                          checked={selectedSpecies.includes(s.id)}
                          onCheckedChange={() => toggleSpecies(s.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <label className="text-sm font-medium leading-none cursor-pointer">
                            {s.name}
                          </label>
                          {s.scientific_name && (
                            <p className="text-xs text-muted-foreground">
                              {s.scientific_name}
                            </p>
                          )}
                          {selectedSpecies.includes(s.id) && (
                            <Button
                              type="button"
                              size="sm"
                              variant={primarySpecies === s.id ? "default" : "outline"}
                              className="mt-2 h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimarySpecies(primarySpecies === s.id ? '' : s.id);
                              }}
                            >
                              {primarySpecies === s.id ? '★ Principale' : 'Marquer comme principale'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedSpecies.length > 0 && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm">
                        <strong>{selectedSpecies.length}</strong> espèce(s) sélectionnée(s)
                        {primarySpecies && (
                          <span className="text-muted-foreground ml-2">
                            • 1 marquée comme principale
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={handleStep3Next} className="flex-1">
                    Suivant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Fishing Activity */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Anchor className="h-5 w-5" />
                  Activité de pêche
                </CardTitle>
                <CardDescription>
                  Présentez votre activité (tous les champs sont optionnels)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Company Name */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l'entreprise (optionnel)</Label>
                    <Input
                      id="companyName"
                      placeholder="Ex: Pêche artisanale du Levant"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Apparaîtra sur votre page vitrine publique
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description de votre activité (optionnel)</Label>
                    <Textarea
                      id="description"
                      placeholder="Ex: Pêche artisanale au large de Porquerolles depuis 3 générations. Spécialisé dans la pêche à la ligne et au filet maillant..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Présentez votre savoir-faire et votre philosophie
                    </p>
                  </div>

                  {/* Fishing Methods */}
                  <div className="space-y-3">
                    <Label>Méthodes de pêche utilisées (optionnel)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { value: 'palangre', label: 'Palangre' },
                        { value: 'filet', label: 'Filet' },
                        { value: 'ligne', label: 'Ligne' },
                        { value: 'casier', label: 'Casier' },
                        { value: 'chalut', label: 'Chalut' },
                        { value: 'seine', label: 'Seine' },
                        { value: 'hamecon', label: 'Hameçon' },
                        { value: 'nasse', label: 'Nasse' },
                        { value: 'autre', label: 'Autre' },
                      ].map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            fishingMethods.includes(method.value)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={fishingMethods.includes(method.value)}
                            onChange={() => toggleFishingMethod(method.value)}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fishing Zones */}
                  <div className="space-y-2">
                    <Label htmlFor="fishingZones">Zones de pêche (optionnel)</Label>
                    <Input
                      id="fishingZones"
                      placeholder="Ex: Porquerolles, Port-Cros, Îles du Levant"
                      value={fishingZones}
                      onChange={(e) => setFishingZones(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Séparez les zones par des virgules
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={handleStep4Next} className="flex-1">
                    Suivant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Validation */}
          {step === 5 && (
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
                      <p><strong>Espèces pêchées :</strong> {selectedSpecies.length} espèce(s)</p>
                      {fishingMethods.length > 0 && (
                        <p><strong>Méthodes de pêche :</strong> {fishingMethods.length}</p>
                      )}
                      {fishingZones && (
                        <p><strong>Zones de pêche :</strong> {fishingZones}</p>
                      )}
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
                  <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
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
