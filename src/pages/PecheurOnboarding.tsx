import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Globe, Waves, Fish, Camera, Loader2, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { PhotoUpload } from '@/components/PhotoUpload';
import { FisherProfilePreview } from '@/components/FisherProfilePreview';

const ZONES_PRINCIPALES = [
  'Hyères',
  'Giens',
  'Porquerolles',
  'Port-Cros',
  'Var Est',
  'Var Ouest',
  'Méditerranée Nord',
  'Autre'
];

const FISHING_METHODS = [
  { value: 'filet', label: 'Filets' },
  { value: 'palangre', label: 'Palangre' },
  { value: 'casier', label: 'Casier' },
  { value: 'ligne', label: 'Ligne' },
  { value: 'autre', label: 'Autre' },
];

const PecheurOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingSiret, setLoadingSiret] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);

  // Étape 1: Société & Contact
  const [siret, setSiret] = useState('');
  const [boatName, setBoatName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [immat, setImmat] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Étape 2: Présence en ligne
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Étape 3: Zones & Méthodes
  const [mainFishingZone, setMainFishingZone] = useState('');
  const [fishingZonesDetail, setFishingZonesDetail] = useState('');
  const [fishingMethods, setFishingMethods] = useState<string[]>([]);
  const [otherMethod, setOtherMethod] = useState('');

  // Étape 4: Espèces
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [primarySpecies, setPrimarySpecies] = useState<string>('');
  const [otherSpecies, setOtherSpecies] = useState('');

  // Étape 5: Photos & Description
  const [photoBoat1, setPhotoBoat1] = useState<string | null>(null);
  const [photoBoat2, setPhotoBoat2] = useState<string | null>(null);
  const [photoDockSale, setPhotoDockSale] = useState<string | null>(null);
  const [yearsExperience, setYearsExperience] = useState('');
  const [passionQuote, setPassionQuote] = useState('');
  const [workPhilosophy, setWorkPhilosophy] = useState('');
  const [clientMessage, setClientMessage] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');

  const progress = (step / 5) * 100;

  // Générer automatiquement la description
  useEffect(() => {
    const generateDescription = () => {
      const parts = [];
      
      if (yearsExperience) {
        parts.push(yearsExperience);
      }
      
      if (passionQuote) {
        parts.push(`Ce que j'aime le plus dans mon métier ? ${passionQuote}`);
      }
      
      if (workPhilosophy) {
        parts.push(`Ma philosophie : ${workPhilosophy}`);
      }
      
      if (clientMessage) {
        parts.push(`Mon message : ${clientMessage}`);
      }
      
      return parts.join('\n\n');
    };

    setGeneratedDescription(generateDescription());
  }, [yearsExperience, passionQuote, workPhilosophy, clientMessage]);

  // Check payment status
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      if (searchParams.get('payment') === 'success') {
        toast.success('Paiement réussi ! Remplissez maintenant le formulaire');
      }

      try {
        const { data: fishermanData, error } = await supabase
          .from('fishermen')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (!fishermanData || fishermanData.onboarding_payment_status === 'pending') {
          navigate('/pecheur/payment');
          return;
        }

        // Pré-remplir si données existantes
        if (fishermanData && fishermanData.boat_name !== 'À compléter') {
          setBoatName(fishermanData.boat_name || '');
          setImmat(fishermanData.boat_registration || '');
          setSiret(fishermanData.siret || '');
          setCompanyName(fishermanData.company_name || '');
          setAddress(fishermanData.address || '');
          setPostalCode(fishermanData.postal_code || '');
          setCity(fishermanData.city || '');
          setEmail(fishermanData.email || user.email || '');
          setPhone(fishermanData.phone || '');
          setFacebookUrl(fishermanData.facebook_url || '');
          setInstagramUrl(fishermanData.instagram_url || '');
          setWebsiteUrl(fishermanData.website_url || '');
          setMainFishingZone(fishermanData.main_fishing_zone || '');
          setFishingZonesDetail(fishermanData.fishing_zones?.join(', ') || '');
          setFishingMethods(fishermanData.fishing_methods || []);
          setPhotoBoat1(fishermanData.photo_boat_1);
          setPhotoBoat2(fishermanData.photo_boat_2);
          setPhotoDockSale(fishermanData.photo_dock_sale);
          setYearsExperience(fishermanData.years_experience || '');
          setPassionQuote(fishermanData.passion_quote || '');
          setWorkPhilosophy(fishermanData.work_philosophy || '');
          setClientMessage(fishermanData.client_message || '');
        } else {
          setEmail(user.email || '');
        }

        setCheckingPayment(false);
      } catch (error: any) {
        console.error('Error:', error);
        toast.error('Erreur lors de la vérification');
        setCheckingPayment(false);
      }
    };

    checkPaymentStatus();
  }, [user, navigate, searchParams]);

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

  const speciesNames = species?.reduce((acc, s) => {
    acc[s.id] = s.name;
    return acc;
  }, {} as Record<string, string>) || {};

  const handleSiretLookup = async () => {
    if (!siret || siret.length !== 14) {
      toast.error('Le SIRET doit contenir 14 chiffres');
      return;
    }

    setLoadingSiret(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-company-info', {
        body: { siret },
      });

      if (error) throw error;

      setCompanyName(data.companyName || '');
      setAddress(data.address || '');
      setPostalCode(data.postalCode || '');
      setCity(data.city || '');
      
      toast.success('Informations récupérées avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Impossible de récupérer les informations');
    } finally {
      setLoadingSiret(false);
    }
  };

  const validateStep1 = () => {
    if (!boatName || !immat || !phone || !email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email invalide');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const urlPattern = /^https?:\/\/.+/;
    if (facebookUrl && !urlPattern.test(facebookUrl)) {
      toast.error('URL Facebook invalide');
      return false;
    }
    if (instagramUrl && !urlPattern.test(instagramUrl)) {
      toast.error('URL Instagram invalide');
      return false;
    }
    if (websiteUrl && !urlPattern.test(websiteUrl)) {
      toast.error('URL du site web invalide');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (selectedSpecies.length === 0 && !otherSpecies) {
      toast.error('Sélectionnez au moins une espèce');
      return false;
    }
    return true;
  };

  const toggleFishingMethod = (method: string) => {
    setFishingMethods(prev => 
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const toggleSpecies = (speciesId: string) => {
    setSelectedSpecies(prev => 
      prev.includes(speciesId) ? prev.filter(id => id !== speciesId) : [...prev, speciesId]
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const zonesArray = fishingZonesDetail
        .split(',')
        .map(z => z.trim())
        .filter(z => z.length > 0);

      const finalMethods = [...fishingMethods];
      if (otherMethod) finalMethods.push(otherMethod);

      // Upsert fisherman profile
      const { data: fishermanData, error: upsertError } = await supabase
        .from('fishermen')
        .upsert({
          user_id: user.id,
          siret: siret || null,
          boat_name: boatName,
          boat_registration: immat,
          company_name: companyName || null,
          address: address || null,
          postal_code: postalCode || null,
          city: city || null,
          phone: phone,
          email: email,
          facebook_url: facebookUrl || null,
          instagram_url: instagramUrl || null,
          website_url: websiteUrl || null,
          main_fishing_zone: mainFishingZone || null,
          fishing_zones: zonesArray.length > 0 ? zonesArray : null,
          fishing_methods: finalMethods.length > 0 ? finalMethods : null,
          photo_boat_1: photoBoat1,
          photo_boat_2: photoBoat2,
          photo_dock_sale: photoDockSale,
          years_experience: yearsExperience || null,
          passion_quote: passionQuote || null,
          work_philosophy: workPhilosophy || null,
          client_message: clientMessage || null,
          generated_description: generatedDescription || null,
          verified_at: null,
        }, {
          onConflict: 'user_id'
        })
        .select('id, slug')
        .single();

      if (upsertError) throw upsertError;

      // Delete existing species links
      await supabase
        .from('fishermen_species')
        .delete()
        .eq('fisherman_id', fishermanData.id);

      // Insert species
      if (selectedSpecies.length > 0) {
        const speciesToInsert = selectedSpecies.map(speciesId => ({
          fisherman_id: fishermanData.id,
          species_id: speciesId,
          is_primary: speciesId === primarySpecies,
        }));

        const { error: speciesError } = await supabase
          .from('fishermen_species')
          .insert(speciesToInsert);

        if (speciesError) throw speciesError;
      }

      toast.success('Page vitrine créée avec succès !');
      navigate(`/onboarding/confirmation?slug=${fishermanData.slug}`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (checkingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold">Créer ma page vitrine</h1>
          <p className="text-muted-foreground">Présentez votre activité de pêche</p>
          <div className="max-w-md mx-auto space-y-2 pt-4">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">Étape {step} sur 5</p>
          </div>
        </div>

        {/* Layout 2 colonnes */}
        <div className="grid lg:grid-cols-[1fr,400px] gap-8 max-w-7xl mx-auto">
          {/* Colonne formulaire */}
          <div>
            {/* Étape 1: Société & Contact */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Société & Contact
                  </CardTitle>
                  <CardDescription>Informations de base sur votre activité</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* SIRET */}
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET (14 chiffres)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="siret"
                        placeholder="12345678901234"
                        value={siret}
                        onChange={(e) => setSiret(e.target.value.replace(/\D/g, ''))}
                        maxLength={14}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSiretLookup}
                        disabled={loadingSiret || siret.length !== 14}
                      >
                        {loadingSiret ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Récupérer'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
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
                      <Label htmlFor="companyName">Nom de l'entreprise</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
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
                    <Label htmlFor="address">Adresse</Label>
                    <Input
                      id="address"
                      placeholder="Port de Hyères"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Code postal</Label>
                      <Input
                        id="postalCode"
                        placeholder="83400"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        placeholder="Hyères"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone portable *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="06 12 34 56 78"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@exemple.fr"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (validateStep1()) setStep(2);
                    }}
                    className="w-full"
                  >
                    Suivant
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Étape 2: Présence en ligne */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Présence en ligne
                  </CardTitle>
                  <CardDescription>Liens vers vos réseaux sociaux (optionnel)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook">URL Facebook</Label>
                    <Input
                      id="facebook"
                      type="url"
                      placeholder="https://facebook.com/..."
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram">URL Instagram</Label>
                    <Input
                      id="instagram"
                      type="url"
                      placeholder="https://instagram.com/..."
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Site web personnel</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://..."
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Retour
                    </Button>
                    <Button
                      onClick={() => {
                        if (validateStep2()) setStep(3);
                      }}
                      className="flex-1"
                    >
                      Suivant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Étape 3: Zones & Méthodes */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Waves className="h-5 w-5" />
                    Zones & Méthodes de pêche
                  </CardTitle>
                  <CardDescription>Où et comment vous pêchez</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mainZone">Zone principale de pêche</Label>
                    <Select value={mainFishingZone} onValueChange={setMainFishingZone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {ZONES_PRINCIPALES.map(zone => (
                          <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zonesDetail">Zones détaillées (optionnel)</Label>
                    <Textarea
                      id="zonesDetail"
                      placeholder="Ex: Rade de Hyères, îles d'Or, Cap Bénat..."
                      value={fishingZonesDetail}
                      onChange={(e) => setFishingZonesDetail(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Méthodes de pêche (optionnel)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {FISHING_METHODS.map(method => (
                        <label
                          key={method.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                            fishingMethods.includes(method.value)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Checkbox
                            checked={fishingMethods.includes(method.value)}
                            onCheckedChange={() => toggleFishingMethod(method.value)}
                          />
                          <span className="text-sm font-medium">{method.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {fishingMethods.includes('autre') && (
                    <div className="space-y-2">
                      <Label htmlFor="otherMethod">Autre méthode</Label>
                      <Input
                        id="otherMethod"
                        placeholder="Précisez..."
                        value={otherMethod}
                        onChange={(e) => setOtherMethod(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Retour
                    </Button>
                    <Button onClick={() => setStep(4)} className="flex-1">
                      Suivant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Étape 4: Espèces */}
            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fish className="h-5 w-5" />
                    Espèces pêchées
                  </CardTitle>
                  <CardDescription>Sélectionnez les espèces que vous pêchez</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {species?.map(s => (
                      <label
                        key={s.id}
                        className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition ${
                          selectedSpecies.includes(s.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Checkbox
                          checked={selectedSpecies.includes(s.id)}
                          onCheckedChange={() => toggleSpecies(s.id)}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="text-sm font-medium">{s.name}</div>
                          {selectedSpecies.includes(s.id) && (
                            <Button
                              type="button"
                              size="sm"
                              variant={primarySpecies === s.id ? "default" : "outline"}
                              className="mt-1 h-6 text-xs"
                              onClick={(e) => {
                                e.preventDefault();
                                setPrimarySpecies(primarySpecies === s.id ? '' : s.id);
                              }}
                            >
                              {primarySpecies === s.id ? '★ Principale' : 'Marquer'}
                            </Button>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherSpecies">Autre espèce (optionnel)</Label>
                    <Input
                      id="otherSpecies"
                      placeholder="Ex: Langouste"
                      value={otherSpecies}
                      onChange={(e) => setOtherSpecies(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                      Retour
                    </Button>
                    <Button
                      onClick={() => {
                        if (validateStep4()) setStep(5);
                      }}
                      className="flex-1"
                    >
                      Suivant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Étape 5: Photos & Description */}
            {step === 5 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Photos de ton bateau (max 2)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <PhotoUpload
                        label="Photo 1"
                        value={photoBoat1}
                        onChange={setPhotoBoat1}
                      />
                      <PhotoUpload
                        label="Photo 2"
                        value={photoBoat2}
                        onChange={setPhotoBoat2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Photo vente à quai (1 photo)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PhotoUpload
                      label="Photo vente"
                      value={photoDockSale}
                      onChange={setPhotoDockSale}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Raconte ton histoire</CardTitle>
                    <CardDescription>
                      Réponds à ces questions pour créer ta description
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="years">Depuis quand tu es marin pêcheur ?</Label>
                      <Input
                        id="years"
                        placeholder="Ex: Depuis 15 ans, transmission familiale..."
                        value={yearsExperience}
                        onChange={(e) => setYearsExperience(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passion">Qu'est-ce que tu préfères dans ton métier ?</Label>
                      <Textarea
                        id="passion"
                        placeholder="Ex: Le contact avec la mer, la liberté..."
                        value={passionQuote}
                        onChange={(e) => setPassionQuote(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="philosophy">Comment tu travailles ?</Label>
                      <Textarea
                        id="philosophy"
                        placeholder="Ex: Pêche artisanale, respect des saisons..."
                        value={workPhilosophy}
                        onChange={(e) => setWorkPhilosophy(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Un message pour tes clients ?</Label>
                      <Textarea
                        id="message"
                        placeholder="Ex: Consommer local, c'est soutenir une pêche durable..."
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Aperçu de ta description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={generatedDescription}
                      onChange={(e) => setGeneratedDescription(e.target.value)}
                      rows={8}
                      className="font-serif"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Tu peux modifier le texte avant de valider
                    </p>
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                    Retour
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Créer ma page
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Colonne preview - hidden sur mobile */}
          <div className="hidden lg:block">
            <FisherProfilePreview
              boatName={boatName}
              companyName={companyName}
              mainFishingZone={mainFishingZone}
              generatedDescription={generatedDescription}
              selectedSpecies={selectedSpecies}
              speciesNames={speciesNames}
              fishingMethods={fishingMethods}
              fishingZones={fishingZonesDetail.split(',').map(z => z.trim()).filter(z => z)}
              phone={phone}
              email={email}
              facebookUrl={facebookUrl}
              instagramUrl={instagramUrl}
              websiteUrl={websiteUrl}
              photoBoat1={photoBoat1}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PecheurOnboarding;
