import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Anchor, Save, Loader2 } from 'lucide-react';

import { Database } from '@/integrations/supabase/types';

type FishingMethod = Database['public']['Enums']['fishing_method'];

const formSchema = z.object({
  boat_name: z.string().min(1, 'Le nom du bateau est requis').max(100),
  company_name: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  bio: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

const FISHING_METHODS = [
  { value: 'palangre', label: 'Palangre' },
  { value: 'filet', label: 'Filet' },
  { value: 'ligne', label: 'Ligne' },
  { value: 'casier', label: 'Casier' },
  { value: 'chalut', label: 'Chalut' },
  { value: 'seine', label: 'Seine' },
  { value: 'hamecon', label: 'Hameçon' },
  { value: 'nasse', label: 'Nasse' },
  { value: 'autre', label: 'Autre' },
];

const EditFisherProfile = () => {
  const { user, isVerifiedFisherman, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [fishermanSlug, setFishermanSlug] = useState<string>('');
  const [allSpecies, setAllSpecies] = useState<any[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [primarySpeciesId, setPrimarySpeciesId] = useState<string>('');
  const [selectedMethods, setSelectedMethods] = useState<FishingMethod[]>([]);
  const [zones, setZones] = useState<string>('');
  const [displayNamePreference, setDisplayNamePreference] = useState<'boat_name' | 'company_name'>('boat_name');
  const [lockedData, setLockedData] = useState({ siret: '', boatRegistration: '' });
  const [regeneratingDesc, setRegeneratingDesc] = useState(false);
  const [allZones, setAllZones] = useState<any[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      boat_name: '',
      company_name: '',
      description: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load

    if (!user || !isVerifiedFisherman) {
      navigate('/dashboard/pecheur');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch fisherman data
        const { data: fisherman, error: fisherError } = await supabase
          .from('fishermen')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fisherError) throw fisherError;
        if (!fisherman) {
          toast({
            title: 'Erreur',
            description: 'Profil pêcheur introuvable',
            variant: 'destructive',
          });
          navigate('/dashboard/pecheur');
          return;
        }

        setFishermanId(fisherman.id);
        setFishermanSlug(fisherman.slug || '');
        setDisplayNamePreference((fisherman.display_name_preference || 'boat_name') as 'boat_name' | 'company_name');
        setLockedData({
          siret: fisherman.siret || '',
          boatRegistration: fisherman.boat_registration || '',
        });
        setSelectedZoneId(fisherman.zone_id || '');
        form.reset({
          boat_name: fisherman.boat_name || '',
          company_name: fisherman.company_name || '',
          description: fisherman.description || '',
          bio: fisherman.bio || '',
        });

        setSelectedMethods((fisherman.fishing_methods || []) as FishingMethod[]);
        setZones(fisherman.fishing_zones?.join(', ') || '');

        // Fetch zones
        const { data: zonesData } = await supabase
          .from('zones_peche')
          .select('*')
          .order('name');
        if (zonesData) setAllZones(zonesData);

        // Fetch fisherman species
        const { data: fisherSpecies } = await supabase
          .from('fishermen_species')
          .select('species_id, is_primary')
          .eq('fisherman_id', fisherman.id);

        if (fisherSpecies) {
          setSelectedSpecies(fisherSpecies.map(fs => fs.species_id));
          const primary = fisherSpecies.find(fs => fs.is_primary);
          if (primary) setPrimarySpeciesId(primary.species_id);
        }

        // Fetch all species
        const { data: species } = await supabase
          .from('species')
          .select('*')
          .order('name');

        if (species) setAllSpecies(species);
      } catch (error: any) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isVerifiedFisherman, authLoading, navigate, form, toast]);

  const onSubmit = async (values: FormData) => {
    if (!fishermanId) return;

    setSaving(true);
    try {
      // Update fisherman profile
      const zonesArray = zones.split(',').map(z => z.trim()).filter(z => z);
      
      const { error: updateError } = await supabase
        .from('fishermen')
        .update({
          boat_name: values.boat_name,
          company_name: values.company_name || null,
          description: values.description || null,
          bio: values.bio || null,
          fishing_methods: selectedMethods.length > 0 ? selectedMethods : null,
          fishing_zones: zonesArray.length > 0 ? zonesArray : null,
          display_name_preference: displayNamePreference,
          zone_id: selectedZoneId || null,
        })
        .eq('id', fishermanId);

      if (updateError) throw updateError;

      // Delete existing species
      await supabase
        .from('fishermen_species')
        .delete()
        .eq('fisherman_id', fishermanId);

      // Insert new species
      if (selectedSpecies.length > 0) {
        const speciesToInsert = selectedSpecies.map(speciesId => ({
          fisherman_id: fishermanId,
          species_id: speciesId,
          is_primary: speciesId === primarySpeciesId,
        }));

        const { error: speciesError } = await supabase
          .from('fishermen_species')
          .insert(speciesToInsert);

        if (speciesError) throw speciesError;
      }

      toast({
        title: 'Profil mis à jour',
        description: 'Vos modifications ont été enregistrées',
      });

      navigate(`/pecheurs/${fishermanSlug}`);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Anchor className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Modifier ma vitrine</h1>
          </div>
          <p className="text-muted-foreground">
            Personnalisez votre profil public visible par les clients
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Locked Fields Card */}
            <Card className="border-muted bg-muted/20">
              <CardHeader>
                <CardTitle>Informations verrouillées</CardTitle>
                <CardDescription>
                  Ces données ne peuvent plus être modifiées après validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">SIRET</Label>
                  <div className="px-3 py-2 bg-muted rounded-md text-foreground font-mono">
                    {lockedData.siret || 'Non renseigné'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">N° Immatriculation</Label>
                  <div className="px-3 py-2 bg-muted rounded-md text-foreground font-mono">
                    {lockedData.boatRegistration || 'Non renseigné'}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations modifiables</CardTitle>
                <CardDescription>
                  Ces informations seront visibles sur votre page publique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="boat_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du bateau *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: L'Océane" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pêcheries de l'Atlantique" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Nom affiché publiquement</FormLabel>
                  <Select value={displayNamePreference} onValueChange={(value: 'boat_name' | 'company_name') => setDisplayNamePreference(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boat_name">Nom du bateau ({form.watch('boat_name') || 'non défini'})</SelectItem>
                      <SelectItem value="company_name">Raison sociale ({form.watch('company_name') || 'non défini'})</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Ce nom apparaîtra dans vos arrivages et sur votre vitrine publique
                  </FormDescription>
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Description courte</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setRegeneratingDesc(true);
                            try {
                              const { data, error } = await supabase.functions.invoke('generate-fisherman-description', {
                                body: {
                                  yearsExperience: '5',
                                  passion: form.watch('bio') || '',
                                  workPhilosophy: zones || '',
                                  clientMessage: form.watch('company_name') || '',
                                }
                              });
                              if (error) throw error;
                              if (data?.description) {
                                form.setValue('description', data.description);
                                toast({
                                  title: 'Description régénérée',
                                  description: 'La description a été mise à jour par l\'IA',
                                });
                              }
                            } catch (error: any) {
                              toast({
                                title: 'Erreur',
                                description: error.message,
                                variant: 'destructive',
                              });
                            } finally {
                              setRegeneratingDesc(false);
                            }
                          }}
                          disabled={regeneratingDesc}
                        >
                          {regeneratingDesc ? 'Génération...' : '✨ Régénérer avec IA'}
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Décrivez votre activité en quelques mots..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/500 caractères
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio / Histoire</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Parlez de votre parcours, votre passion pour la pêche..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/500 caractères
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Espèces pêchées</CardTitle>
                <CardDescription>
                  Sélectionnez les espèces que vous pêchez régulièrement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {allSpecies.map((species) => (
                    <div key={species.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={species.id}
                        checked={selectedSpecies.includes(species.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSpecies([...selectedSpecies, species.id]);
                          } else {
                            setSelectedSpecies(selectedSpecies.filter(id => id !== species.id));
                            if (primarySpeciesId === species.id) {
                              setPrimarySpeciesId('');
                            }
                          }
                        }}
                      />
                      <label
                        htmlFor={species.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {species.name}
                      </label>
                    </div>
                  ))}
                </div>

                {selectedSpecies.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <FormLabel>Espèce principale (optionnel)</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {selectedSpecies.map(speciesId => {
                        const species = allSpecies.find(s => s.id === speciesId);
                        return (
                          <Badge
                            key={speciesId}
                            variant={primarySpeciesId === speciesId ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setPrimarySpeciesId(speciesId)}
                          >
                            {primarySpeciesId === speciesId && '★ '}
                            {species?.name}
                          </Badge>
                        );
                      })}
                    </div>
                    <FormDescription>
                      Cliquez sur une espèce pour la marquer comme principale
                    </FormDescription>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Méthodes et zones de pêche</CardTitle>
                <CardDescription>
                  Informations complémentaires sur votre activité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <FormLabel>Méthodes de pêche</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {FISHING_METHODS.map((method) => (
                      <div key={method.value} className="flex items-start space-x-2">
                        <Checkbox
                          id={method.value}
                          checked={selectedMethods.includes(method.value as FishingMethod)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMethods([...selectedMethods, method.value as FishingMethod]);
                            } else {
                              setSelectedMethods(selectedMethods.filter(m => m !== method.value));
                            }
                          }}
                        />
                        <label
                          htmlFor={method.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {method.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Zone de pêche principale</FormLabel>
                  <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {allZones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name} ({zone.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    La zone où vous pêchez principalement
                  </FormDescription>
                </div>

                <div>
                  <FormLabel>Zones de pêche (texte libre)</FormLabel>
                  <Input
                    placeholder="Ex: Manche, Atlantique Nord, Méditerranée"
                    value={zones}
                    onChange={(e) => setZones(e.target.value)}
                    className="mt-2"
                  />
                  <FormDescription>
                    Séparez les zones par des virgules (optionnel)
                  </FormDescription>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/pecheurs/${fishermanSlug}`)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EditFisherProfile;
