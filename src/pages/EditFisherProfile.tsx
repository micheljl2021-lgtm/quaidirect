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
  const { user, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fishermanId, setFishermanId] = useState<string | null>(null);
  const [allSpecies, setAllSpecies] = useState<any[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [primarySpeciesId, setPrimarySpeciesId] = useState<string>('');
  const [selectedMethods, setSelectedMethods] = useState<FishingMethod[]>([]);
  const [zones, setZones] = useState<string>('');

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
    if (!user || !isVerifiedFisherman) {
      navigate('/auth');
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
        form.reset({
          boat_name: fisherman.boat_name || '',
          company_name: fisherman.company_name || '',
          description: fisherman.description || '',
          bio: fisherman.bio || '',
        });

        setSelectedMethods((fisherman.fishing_methods || []) as FishingMethod[]);
        setZones(fisherman.fishing_zones?.join(', ') || '');

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
  }, [user, isVerifiedFisherman, navigate, form, toast]);

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

      navigate(`/pecheur/${fishermanId}`);
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
            <Card>
              <CardHeader>
                <CardTitle>Informations principales</CardTitle>
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description courte</FormLabel>
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

                <div>
                  <FormLabel>Zones de pêche</FormLabel>
                  <Input
                    placeholder="Ex: Manche, Atlantique Nord, Méditerranée"
                    value={zones}
                    onChange={(e) => setZones(e.target.value)}
                    className="mt-2"
                  />
                  <FormDescription>
                    Séparez les zones par des virgules
                  </FormDescription>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/pecheur/${fishermanId}`)}
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
