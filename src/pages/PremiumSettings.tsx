import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useClientSubscriptionLevel } from '@/hooks/useClientSubscriptionLevel';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, MapPin, Fish, Heart, Bell, HandHeart, X } from 'lucide-react';
import Header from '@/components/Header';

interface Fisherman {
  id: string;
  boat_name: string;
  company_name: string | null;
  photo_url: string | null;
}

const PremiumSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isPremium, isPremiumPlus, isLoading: subscriptionLoading } = useClientSubscriptionLevel();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Ports & Species
  const [ports, setPorts] = useState<any[]>([]);
  const [species, setSpecies] = useState<any[]>([]);
  const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  
  // Fishermen favorites & supported
  const [fishermen, setFishermen] = useState<Fisherman[]>([]);
  const [selectedFishermen, setSelectedFishermen] = useState<string[]>([]);
  const [supportedFisherman, setSupportedFisherman] = useState<string | null>(null);
  
  // Notifications
  const [notifNewDrop, setNotifNewDrop] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  // Limits based on subscription level
  const MAX_PORTS = 1;
  const MAX_FISHERMEN = 2;
  const MAX_SPECIES = isPremiumPlus ? 10 : 3;

  // Vérification du niveau d'abonnement premium (basé sur payments, pas user_roles)
  useEffect(() => {
    if (subscriptionLoading || authLoading) return;
    if (!isPremium && !isPremiumPlus) {
      toast.error('Accès réservé aux membres Premium');
      navigate('/premium');
    }
  }, [isPremium, isPremiumPlus, subscriptionLoading, authLoading, navigate]);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      // Charger ports, espèces, pêcheurs en parallèle
      const [portsRes, speciesRes, fishermenRes] = await Promise.all([
        supabase.from('ports').select('*').order('name'),
        supabase.from('species').select('*').order('name'),
        supabase.from('public_fishermen').select('id, boat_name, company_name, photo_url').not('id', 'is', null)
      ]);
      
      setPorts(portsRes.data || []);
      setSpecies(speciesRes.data || []);
      setFishermen(fishermenRes.data || []);

      // Charger les préférences existantes en parallèle
      const [followPorts, followSpecies, followFishermen, supportedRes, notifPrefs] = await Promise.all([
        supabase.from('follow_ports').select('port_id').eq('user_id', user.id),
        supabase.from('follow_species').select('species_id').eq('user_id', user.id),
        supabase.from('fishermen_followers').select('fisherman_id').eq('user_id', user.id),
        supabase.from('client_supported_fishermen').select('fisherman_id').eq('user_id', user.id).maybeSingle(),
        supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      setSelectedPorts(followPorts.data?.map(fp => fp.port_id) || []);
      setSelectedSpecies(followSpecies.data?.map(fs => fs.species_id) || []);
      setSelectedFishermen(followFishermen.data?.map(ff => ff.fisherman_id) || []);
      if (supportedRes.data?.fisherman_id) setSupportedFisherman(supportedRes.data.fisherman_id);
      
      if (notifPrefs.data) {
        setNotifNewDrop(notifPrefs.data.push_enabled ?? true);
        setNotifMarketing(notifPrefs.data.email_enabled ?? false);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePortChange = (portId: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      if (selectedPorts.length >= MAX_PORTS) {
        toast.error(`Vous pouvez sélectionner maximum ${MAX_PORTS} port`);
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
      if (selectedSpecies.length >= MAX_SPECIES) {
        toast.error(`Vous pouvez sélectionner maximum ${MAX_SPECIES} espèces`);
        return;
      }
      setSelectedSpecies([...selectedSpecies, speciesId]);
    }
  };

  const handleFishermanToggle = (fishermanId: string) => {
    if (selectedFishermen.includes(fishermanId)) {
      setSelectedFishermen(selectedFishermen.filter(id => id !== fishermanId));
    } else {
      if (selectedFishermen.length >= MAX_FISHERMEN) {
        toast.error(`Vous pouvez sélectionner maximum ${MAX_FISHERMEN} pêcheurs favoris`);
        return;
      }
      setSelectedFishermen([...selectedFishermen, fishermanId]);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Supprimer les anciennes préférences
      await Promise.all([
        supabase.from('follow_ports').delete().eq('user_id', user.id),
        supabase.from('follow_species').delete().eq('user_id', user.id),
        supabase.from('fishermen_followers').delete().eq('user_id', user.id),
        supabase.from('client_supported_fishermen').delete().eq('user_id', user.id)
      ]);

      // Insérer les nouvelles préférences
      const insertPromises = [];
      
      if (selectedPorts.length > 0) {
        insertPromises.push(
          supabase.from('follow_ports').insert(
            selectedPorts.slice(0, MAX_PORTS).map(portId => ({ user_id: user.id, port_id: portId }))
          )
        );
      }

      if (selectedSpecies.length > 0) {
        insertPromises.push(
          supabase.from('follow_species').insert(
            selectedSpecies.slice(0, MAX_SPECIES).map(speciesId => ({ user_id: user.id, species_id: speciesId }))
          )
        );
      }

      if (selectedFishermen.length > 0) {
        insertPromises.push(
          supabase.from('fishermen_followers').insert(
            selectedFishermen.slice(0, MAX_FISHERMEN).map(fishermanId => ({ user_id: user.id, fisherman_id: fishermanId }))
          )
        );
      }

      // Sauvegarder le pêcheur soutenu
      if (supportedFisherman) {
        insertPromises.push(
          supabase.from('client_supported_fishermen').insert({
            user_id: user.id,
            fisherman_id: supportedFisherman
          })
        );
      }

      // Sauvegarder les préférences de notification
      insertPromises.push(
        supabase.from('notification_preferences').upsert({
          user_id: user.id,
          push_enabled: notifNewDrop,
          email_enabled: notifMarketing,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
      );

      await Promise.all(insertPromises);

      toast.success('Préférences enregistrées avec succès');
      navigate('/compte');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading || subscriptionLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isPremium && !isPremiumPlus) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/compte')}
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

          {/* Port favori */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle>Port préféré</CardTitle>
              </div>
              <CardDescription>
                Sélectionnez 1 port pour recevoir des alertes dans un rayon de 10km
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPorts.length < MAX_PORTS && (
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
                {selectedPorts.length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucun port sélectionné</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pêcheurs favoris */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                <CardTitle>Pêcheurs favoris</CardTitle>
              </div>
              <CardDescription>
                Sélectionnez jusqu'à {MAX_FISHERMEN} pêcheurs pour recevoir leurs arrivages en priorité
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {selectedFishermen.length}/{MAX_FISHERMEN} pêcheurs sélectionnés
              </p>
              
              {fishermen.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun pêcheur disponible pour le moment</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fishermen.map(fisherman => {
                    const isSelected = selectedFishermen.includes(fisherman.id);
                    const isDisabled = !isSelected && selectedFishermen.length >= MAX_FISHERMEN;
                    
                    return (
                      <div 
                        key={fisherman.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-destructive/10 border-destructive' 
                            : isDisabled 
                              ? 'opacity-50 cursor-not-allowed bg-muted'
                              : 'bg-card hover:bg-accent'
                        }`}
                        onClick={() => !isDisabled && handleFishermanToggle(fisherman.id)}
                      >
                        <Checkbox 
                          checked={isSelected}
                          disabled={isDisabled}
                          className="pointer-events-none"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{fisherman.boat_name}</p>
                          {fisherman.company_name && (
                            <p className="text-xs text-muted-foreground truncate">{fisherman.company_name}</p>
                          )}
                        </div>
                        {isSelected && <Heart className="h-4 w-4 text-destructive fill-destructive" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pêcheur soutenu */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HandHeart className="h-5 w-5 text-red-500" />
                <CardTitle>Pêcheur soutenu</CardTitle>
              </div>
              <CardDescription>
                Choisissez un pêcheur à soutenir via le pool SMS. Votre contribution Premium lui sera attribuée.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {supportedFisherman ? (
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <HandHeart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">
                        {fishermen.find(f => f.id === supportedFisherman)?.company_name || 
                         fishermen.find(f => f.id === supportedFisherman)?.boat_name}
                      </p>
                      <p className="text-xs text-muted-foreground">Pêcheur que vous soutenez</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSupportedFisherman(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Select onValueChange={(value) => setSupportedFisherman(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un pêcheur à soutenir" />
                  </SelectTrigger>
                  <SelectContent>
                    {fishermen.map(fisherman => (
                      <SelectItem key={fisherman.id} value={fisherman.id}>
                        {fisherman.company_name || fisherman.boat_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <p className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
                Votre abonnement Premium contribue au pool SMS. En choisissant un pêcheur, une partie de cette contribution lui est directement attribuée.
              </p>
            </CardContent>
          </Card>

          {/* Espèces favorites */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Fish className="h-5 w-5 text-primary" />
                <CardTitle>Espèces favorites</CardTitle>
              </div>
              <CardDescription>
                Sélectionnez jusqu'à {MAX_SPECIES} espèces pour recevoir des alertes
                {isPremiumPlus && ' (Premium+ : limite étendue)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedSpecies.length}/{MAX_SPECIES} espèces sélectionnées
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {species.map(sp => {
                  const isSelected = selectedSpecies.includes(sp.id);
                  const isDisabled = !isSelected && selectedSpecies.length >= MAX_SPECIES;
                  
                  return (
                    <div key={sp.id} className={`flex items-center space-x-2 ${isDisabled ? 'opacity-50' : ''}`}>
                      <Checkbox
                        id={sp.id}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={() => handleSpeciesToggle(sp.id)}
                      />
                      <label
                        htmlFor={sp.id}
                        className={`text-sm font-medium leading-none cursor-pointer ${isDisabled ? 'cursor-not-allowed' : ''}`}
                      >
                        {sp.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>
                Gérez vos alertes et préférences de communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-drop" className="font-medium">Nouveaux arrivages</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification lors d'un nouvel arrivage correspondant à vos préférences
                  </p>
                </div>
                <Switch
                  id="notif-drop"
                  checked={notifNewDrop}
                  onCheckedChange={setNotifNewDrop}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-marketing" className="font-medium">Actualités & offres</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des informations sur les nouveautés QuaiDirect
                  </p>
                </div>
                <Switch
                  id="notif-marketing"
                  checked={notifMarketing}
                  onCheckedChange={setNotifMarketing}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/compte')}>
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
