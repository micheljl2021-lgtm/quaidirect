import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClientSubscriptionLevel } from '@/hooks/useClientSubscriptionLevel';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MapPin, Bell, Fish, Crown, Mail, Loader2, X, AlertCircle, MessageSquare, HandHeart, Store } from 'lucide-react';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';

interface ClientPreferencesPanelProps {
  compact?: boolean;
}

// Alert type icons component
const AlertTypeIndicator = ({ level }: { level: 'follower' | 'premium' | 'premium_plus' }) => {
  if (level === 'follower') {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Bell className="h-3 w-3" />
        <span>Push</span>
      </div>
    );
  }
  if (level === 'premium') {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Bell className="h-3 w-3" />
        <Mail className="h-3 w-3" />
        <span>Push / Email</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Bell className="h-3 w-3" />
      <Mail className="h-3 w-3" />
      <MessageSquare className="h-3 w-3" />
      <span>Push / Email / SMS</span>
    </div>
  );
};

export default function ClientPreferencesPanel({ compact = false }: ClientPreferencesPanelProps) {
  const { user } = useAuth();
  const { level, isPremium, isPremiumPlus, isLoading: levelLoading } = useClientSubscriptionLevel();
  const { toast } = useToast();
  
  const [favoritePorts, setFavoritePorts] = useState<string[]>([]);
  const [favoriteSpecies, setFavoriteSpecies] = useState<string[]>([]);
  const [favoriteFishermen, setFavoriteFishermen] = useState<string[]>([]);
  const [favoriteSalePoints, setFavoriteSalePoints] = useState<string[]>([]);
  const [supportedFisherman, setSupportedFisherman] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Limits based on subscription level
  // Standard: 2 pêcheurs, 1 port, 0 pdv, 0 espèces
  // Premium: +2 pdv, 3 espèces
  // Premium+: +5 pdv, 10 espèces
  const MAX_FISHERMEN = 2;
  const MAX_PORTS = 1;
  const MAX_SALE_POINTS = isPremiumPlus ? 5 : isPremium ? 2 : 0;
  const MAX_SPECIES = isPremiumPlus ? 10 : isPremium ? 3 : 0;

  // Fetch all data
  const { data: allPorts } = useQuery({
    queryKey: ['all-ports'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ports').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: allSpecies } = useQuery({
    queryKey: ['all-species'],
    queryFn: async () => {
      const { data, error } = await supabase.from('species').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: allFishermen } = useQuery({
    queryKey: ['all-public-fishermen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_fishermen')
        .select('id, boat_name, company_name, photo_url')
        .order('boat_name');
      if (error) throw error;
      return data;
    },
  });

  const { data: allSalePoints } = useQuery({
    queryKey: ['all-sale-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fisherman_sale_points')
        .select('id, label, address, fisherman_id, fishermen(boat_name)')
        .order('label');
      if (error) throw error;
      return data;
    },
    enabled: isPremium || isPremiumPlus,
  });

  // Load user preferences
  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      const [portsRes, speciesRes, fishermenRes, salePointsRes, supportedRes] = await Promise.all([
        supabase.from('follow_ports').select('port_id').eq('user_id', user.id),
        supabase.from('follow_species').select('species_id').eq('user_id', user.id),
        supabase.from('fishermen_followers').select('fisherman_id').eq('user_id', user.id),
        supabase.from('client_follow_sale_points').select('sale_point_id').eq('user_id', user.id),
        supabase.from('client_supported_fishermen').select('fisherman_id').eq('user_id', user.id).maybeSingle(),
      ]);

      if (portsRes.data) setFavoritePorts(portsRes.data.map(p => p.port_id));
      if (speciesRes.data) setFavoriteSpecies(speciesRes.data.map(s => s.species_id));
      if (fishermenRes.data) setFavoriteFishermen(fishermenRes.data.map(f => f.fisherman_id));
      if (salePointsRes.data) setFavoriteSalePoints(salePointsRes.data.map(sp => sp.sale_point_id));
      if (supportedRes.data?.fisherman_id) setSupportedFisherman(supportedRes.data.fisherman_id);
    };

    loadPreferences();
  }, [user]);

  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Delete and re-insert all preferences
      await Promise.all([
        supabase.from('follow_ports').delete().eq('user_id', user.id),
        supabase.from('follow_species').delete().eq('user_id', user.id),
        supabase.from('fishermen_followers').delete().eq('user_id', user.id),
        supabase.from('client_follow_sale_points').delete().eq('user_id', user.id),
        supabase.from('client_supported_fishermen').delete().eq('user_id', user.id),
      ]);

      const insertPromises = [];

      if (favoritePorts.length > 0) {
        insertPromises.push(
          supabase.from('follow_ports').insert(
            favoritePorts.slice(0, MAX_PORTS).map(port_id => ({ user_id: user.id, port_id }))
          )
        );
      }

      // Espèces: Premium et Premium+ seulement
      if (favoriteSpecies.length > 0 && (isPremium || isPremiumPlus)) {
        insertPromises.push(
          supabase.from('follow_species').insert(
            favoriteSpecies.slice(0, MAX_SPECIES).map(species_id => ({ user_id: user.id, species_id }))
          )
        );
      }

      if (favoriteFishermen.length > 0) {
        insertPromises.push(
          supabase.from('fishermen_followers').insert(
            favoriteFishermen.slice(0, MAX_FISHERMEN).map(fisherman_id => ({ user_id: user.id, fisherman_id }))
          )
        );
      }

      // Points de vente: Premium et Premium+ seulement
      if (favoriteSalePoints.length > 0 && (isPremium || isPremiumPlus)) {
        insertPromises.push(
          supabase.from('client_follow_sale_points').insert(
            favoriteSalePoints.slice(0, MAX_SALE_POINTS).map(sale_point_id => ({ user_id: user.id, sale_point_id }))
          )
        );
      }

      // Pêcheur soutenu: Premium et Premium+ seulement
      if (supportedFisherman && (isPremium || isPremiumPlus)) {
        insertPromises.push(
          supabase.from('client_supported_fishermen').insert({
            user_id: user.id,
            fisherman_id: supportedFisherman,
          })
        );
      }

      await Promise.all(insertPromises);

      toast({
        title: 'Préférences enregistrées',
        description: 'Vos favoris ont été mis à jour',
      });
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

  const toggleSelection = (
    id: string,
    current: string[],
    setter: (val: string[]) => void,
    max: number
  ) => {
    if (current.includes(id)) {
      setter(current.filter(item => item !== id));
    } else if (current.length < max) {
      setter([...current, id]);
    } else {
      toast({
        title: 'Limite atteinte',
        description: `Maximum ${max} sélection(s)`,
        variant: 'destructive',
      });
    }
  };

  if (levelLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Mes préférences
        </CardTitle>
        <CardDescription>
          Configurez vos favoris pour recevoir des alertes ciblées
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-hidden">
        <Tabs defaultValue="base" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="base" className="text-xs sm:text-sm py-2">Base</TabsTrigger>
            <TabsTrigger value="salepoints" disabled={!isPremium && !isPremiumPlus} className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Points de vente</span>
              <span className="sm:hidden">Pts vente</span>
            </TabsTrigger>
            <TabsTrigger value="species" disabled={!isPremium && !isPremiumPlus} className="text-xs sm:text-sm py-2">
              Espèces
            </TabsTrigger>
            <TabsTrigger value="support" disabled={!isPremium && !isPremiumPlus} className="text-xs sm:text-sm py-2">
              Soutien
            </TabsTrigger>
          </TabsList>

          {/* Tab Base - Pêcheurs + Port + Push */}
          <TabsContent value="base" className="space-y-6">
            {/* Pêcheurs favoris */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Pêcheurs favoris ({favoriteFishermen.length}/{MAX_FISHERMEN})
                </Label>
                <AlertTypeIndicator level="follower" />
              </div>
              <p className="text-xs text-muted-foreground">
                Les arrivages de vos pêcheurs favoris apparaîtront en priorité
              </p>
              <div className="flex flex-wrap gap-2">
                {favoriteFishermen.map(id => {
                  const fisherman = allFishermen?.find(f => f.id === id);
                  return fisherman ? (
                    <div key={id} className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5">
                      <span className="text-sm">{fisherman.company_name || fisherman.boat_name}</span>
                      <button
                        onClick={() => setFavoriteFishermen(prev => prev.filter(f => f !== id))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {allFishermen?.filter(f => !favoriteFishermen.includes(f.id)).map(fisherman => (
                  <button
                    key={fisherman.id}
                    onClick={() => {
                      toggleSelection(fisherman.id, favoriteFishermen, setFavoriteFishermen, MAX_FISHERMEN);
                    }}
                    className="text-left text-sm p-2 rounded hover:bg-muted/50 transition-colors truncate min-w-0"
                  >
                    {fisherman.company_name || fisherman.boat_name}
                  </button>
                ))}
                {(!allFishermen || allFishermen.length === 0) && (
                  <div className="col-span-full flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Aucun pêcheur disponible
                  </div>
                )}
              </div>
            </div>

            {/* Port préféré */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Port préféré ({favoritePorts.length}/{MAX_PORTS})
                </Label>
                <AlertTypeIndicator level="follower" />
              </div>
              <p className="text-xs text-muted-foreground">
                Recevez des alertes pour les arrivages dans un rayon de 10km
              </p>
              {favoritePorts.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {favoritePorts.map(id => {
                    const port = allPorts?.find(p => p.id === id);
                    return port ? (
                      <div key={id} className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5">
                        <span className="text-sm">{port.name} ({port.city})</span>
                        <button
                          onClick={() => setFavoritePorts([])}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}
              <select
                value={favoritePorts[0] || ''}
                onChange={(e) => setFavoritePorts(e.target.value ? [e.target.value] : [])}
                className="w-full p-2 border rounded-lg bg-background"
              >
                <option value="">Sélectionner un port</option>
                {allPorts?.map(port => (
                  <option key={port.id} value={port.id}>
                    {port.name} ({port.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Push notifications */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Notifications Push
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevez des alertes instantanées sur votre appareil
              </p>
              <PushNotificationToggle />
            </div>
          </TabsContent>

          {/* Tab Points de vente - Premium only */}
          <TabsContent value="salepoints" className="space-y-6">
            {isPremium || isPremiumPlus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    Points de vente suivis ({favoriteSalePoints.length}/{MAX_SALE_POINTS})
                  </Label>
                  <AlertTypeIndicator level={isPremiumPlus ? 'premium_plus' : 'premium'} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPremiumPlus 
                    ? 'Recevez Push / Email / SMS quand un arrivage est publié sur ces points'
                    : 'Recevez Push / Email quand un arrivage est publié sur ces points'}
                </p>
                {favoriteSalePoints.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {favoriteSalePoints.map(id => {
                      const sp = allSalePoints?.find(s => s.id === id);
                      return sp ? (
                        <div key={id} className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5">
                          <span className="text-sm">{sp.label}</span>
                          <button
                            onClick={() => setFavoriteSalePoints(prev => prev.filter(s => s !== id))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                  {allSalePoints && allSalePoints.filter(sp => !favoriteSalePoints.includes(sp.id)).length > 0 ? (
                    allSalePoints.filter(sp => !favoriteSalePoints.includes(sp.id)).map(sp => (
                      <button
                        key={sp.id}
                        onClick={() => toggleSelection(sp.id, favoriteSalePoints, setFavoriteSalePoints, MAX_SALE_POINTS)}
                        className="text-left text-sm p-2 rounded hover:bg-muted/50 transition-colors min-w-0"
                      >
                        <span className="font-medium truncate block">{sp.label}</span>
                        <span className="text-xs text-muted-foreground truncate block">
                          {(sp as any).fishermen?.boat_name}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Aucun point de vente disponible pour le moment
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <LockedFeatureOverlay
                title="Points de vente favoris"
                description="Recevez des alertes sur vos points de vente favoris"
                requiredLevel="Premium"
              >
                <div className="space-y-3 p-4">
                  <Label>Points de vente suivis (0/2)</Label>
                  <div className="h-40 border rounded-lg" />
                </div>
              </LockedFeatureOverlay>
            )}
          </TabsContent>

          {/* Tab Espèces - Premium et Premium+ */}
          <TabsContent value="species" className="space-y-6">
            {isPremium || isPremiumPlus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Fish className="h-4 w-4 text-primary" />
                    Espèces favorites ({favoriteSpecies.length}/{MAX_SPECIES})
                  </Label>
                  <AlertTypeIndicator level={isPremiumPlus ? 'premium_plus' : 'premium'} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPremiumPlus 
                    ? 'Recevez Push / Email / SMS quand un arrivage contient ces espèces'
                    : 'Recevez Push / Email quand un arrivage contient ces espèces'}
                </p>
                {favoriteSpecies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {favoriteSpecies.map(id => {
                      const species = allSpecies?.find(s => s.id === id);
                      return species ? (
                        <div key={id} className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5">
                          <span className="text-sm">{species.name}</span>
                          <button
                            onClick={() => setFavoriteSpecies(prev => prev.filter(s => s !== id))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                  {allSpecies && allSpecies.filter(s => !favoriteSpecies.includes(s.id)).length > 0 ? (
                    allSpecies.filter(s => !favoriteSpecies.includes(s.id)).map(species => (
                      <button
                        key={species.id}
                        onClick={() => toggleSelection(species.id, favoriteSpecies, setFavoriteSpecies, MAX_SPECIES)}
                        className="text-left text-sm p-2 rounded hover:bg-muted/50 transition-colors truncate min-w-0"
                      >
                        {species.name}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
                      <AlertCircle className="h-4 w-4" />
                      Aucune espèce disponible
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <Crown className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Fonctionnalité Premium
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Passez à Premium pour recevoir des alertes sur vos espèces favorites
                    </p>
                  </div>
                </div>
                <LockedFeatureOverlay
                  title="Espèces favorites"
                  description="Recevez des alertes quand vos espèces préférées sont disponibles"
                  requiredLevel="Premium"
                >
                  <div className="space-y-3 p-4">
                    <Label>Espèces favorites (0/3)</Label>
                    <div className="h-40 border rounded-lg" />
                  </div>
                </LockedFeatureOverlay>
              </div>
            )}
          </TabsContent>

          {/* Tab Soutien - Premium et Premium+ */}
          <TabsContent value="support" className="space-y-6">
            {isPremium || isPremiumPlus ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <HandHeart className="h-4 w-4 text-red-500" />
                    Pêcheur que vous soutenez
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    En tant que membre Premium, vous contribuez au pool SMS. Choisissez un pêcheur à soutenir pour qu'il reçoive une part de vos contributions.
                  </p>
                </div>

                {supportedFisherman && (
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <HandHeart className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">
                            {allFishermen?.find(f => f.id === supportedFisherman)?.company_name || 
                             allFishermen?.find(f => f.id === supportedFisherman)?.boat_name}
                          </p>
                          <p className="text-xs text-muted-foreground">Pêcheur soutenu</p>
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
                  </div>
                )}

                {!supportedFisherman && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                    {allFishermen?.map(fisherman => (
                      <button
                        key={fisherman.id}
                        onClick={() => setSupportedFisherman(fisherman.id)}
                        className="text-left text-sm p-2 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors truncate min-w-0"
                      >
                        {fisherman.company_name || fisherman.boat_name}
                      </button>
                    ))}
                    {(!allFishermen || allFishermen.length === 0) && (
                      <div className="col-span-full flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
                        <AlertCircle className="h-4 w-4" />
                        Aucun pêcheur disponible
                      </div>
                    )}
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Comment ça marche ?</p>
                  <p>
                    Votre abonnement Premium contribue au pool SMS qui finance les notifications aux clients. 
                    En choisissant un pêcheur à soutenir, une partie de cette contribution lui est directement attribuée.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <Crown className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Fonctionnalité Premium
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Passez à Premium pour soutenir un pêcheur de votre choix
                    </p>
                  </div>
                </div>
                <LockedFeatureOverlay
                  title="Soutenir un pêcheur"
                  description="Contribuez directement au succès d'un pêcheur"
                  requiredLevel="Premium"
                >
                  <div className="space-y-3 p-4">
                    <Label>Pêcheur soutenu</Label>
                    <div className="h-40 border rounded-lg" />
                  </div>
                </LockedFeatureOverlay>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button onClick={savePreferences} disabled={saving} className="w-full mt-6">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer mes préférences'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
