import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';

const PremiumSettings = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ports, setPorts] = useState<any[]>([]);
  const [species, setSpecies] = useState<any[]>([]);
  const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);

  // Vérification du rôle premium
  useEffect(() => {
    if (userRole && userRole !== 'premium') {
      toast.error('Accès réservé aux membres Premium');
      navigate('/premium');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Charger les ports
      const { data: portsData } = await supabase
        .from('ports')
        .select('*')
        .order('name');
      
      // Charger les espèces
      const { data: speciesData } = await supabase
        .from('species')
        .select('*')
        .order('name');
      
      setPorts(portsData || []);
      setSpecies(speciesData || []);

      // Charger les préférences existantes
      const { data: followPorts } = await supabase
        .from('follow_ports')
        .select('port_id')
        .eq('user_id', user.id);

      const { data: followSpecies } = await supabase
        .from('follow_species')
        .select('species_id')
        .eq('user_id', user.id);

      setSelectedPorts(followPorts?.map(fp => fp.port_id) || []);
      setSelectedSpecies(followSpecies?.map(fs => fs.species_id) || []);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePortChange = (portId: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      if (selectedPorts.length >= 2) {
        toast.error('Vous pouvez sélectionner maximum 2 ports');
        return;
      }
      setSelectedPorts([...selectedPorts, portId]);
    } else {
      setSelectedPorts(selectedPorts.filter(id => id !== portId));
    }
  };

  const handleSpeciesToggle = (speciesId: string) => {
    if (selectedSpecies.includes(speciesId)) {
      setSelectedSpecies(selectedSpecies.filter(id => id !== speciesId));
    } else {
      setSelectedSpecies([...selectedSpecies, speciesId]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Supprimer les anciennes préférences
      await supabase.from('follow_ports').delete().eq('user_id', user.id);
      await supabase.from('follow_species').delete().eq('user_id', user.id);

      // Insérer les nouvelles préférences ports
      if (selectedPorts.length > 0) {
        await supabase.from('follow_ports').insert(
          selectedPorts.map(portId => ({ user_id: user.id, port_id: portId }))
        );
      }

      // Insérer les nouvelles préférences espèces
      if (selectedSpecies.length > 0) {
        await supabase.from('follow_species').insert(
          selectedSpecies.map(speciesId => ({ user_id: user.id, species_id: speciesId }))
        );
      }

      toast.success('Préférences enregistrées avec succès');
      navigate('/');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Double vérification après chargement
  if (userRole !== 'premium') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Mes préférences Premium</h1>
            <p className="text-muted-foreground mt-2">
              Configurez vos alertes personnalisées pour ne rien manquer
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ports favoris</CardTitle>
              <CardDescription>
                Sélectionnez jusqu'à 2 ports pour recevoir des alertes prioritaires (maximum 2)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPorts.length < 2 && (
                <Select onValueChange={(value) => handlePortChange(value, 'add')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un port" />
                  </SelectTrigger>
                  <SelectContent>
                    {ports
                      .filter(port => !selectedPorts.includes(port.id))
                      .map(port => (
                        <SelectItem key={port.id} value={port.id}>
                          {port.name} - {port.city}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              <div className="space-y-2">
                {selectedPorts.map(portId => {
                  const port = ports.find(p => p.id === portId);
                  return port ? (
                    <div key={portId} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <span className="font-medium">{port.name} - {port.city}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePortChange(portId, 'remove')}
                      >
                        Retirer
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Espèces favorites</CardTitle>
              <CardDescription>
                Sélectionnez les espèces pour lesquelles vous souhaitez recevoir des alertes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {species.map(sp => (
                  <div key={sp.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={sp.id}
                      checked={selectedSpecies.includes(sp.id)}
                      onCheckedChange={() => handleSpeciesToggle(sp.id)}
                    />
                    <label
                      htmlFor={sp.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {sp.name}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer mes préférences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumSettings;
