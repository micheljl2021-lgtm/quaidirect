import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClientSubscriptionLevel } from '@/hooks/useClientSubscriptionLevel';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, MapPin, Bell, Fish, Crown, Palette, Mail, Loader2, X, AlertCircle } from 'lucide-react';
import PushNotificationToggle from '@/components/PushNotificationToggle';
import ColorPickerBadge from '@/components/ColorPickerBadge';
import LockedFeatureOverlay from '@/components/LockedFeatureOverlay';

interface ClientPreferencesPanelProps {
  compact?: boolean;
}

export default function ClientPreferencesPanel({ compact = false }: ClientPreferencesPanelProps) {
  const { user } = useAuth();
  const { level, isPremium, isPremiumPlus, isLoading: levelLoading } = useClientSubscriptionLevel();
  const { toast } = useToast();
  
  const [favoritePorts, setFavoritePorts] = useState<string[]>([]);
  const [favoriteSpecies, setFavoriteSpecies] = useState<string[]>([]);
  const [favoriteFishermen, setFavoriteFishermen] = useState<string[]>([]);
  const [favoriteSalePoints, setFavoriteSalePoints] = useState<string[]>([]);
  const [badgeColor, setBadgeColor] = useState('or');
  const [saving, setSaving] = useState(false);

  // Limits based on subscription level
  const MAX_FISHERMEN = 2;
  const MAX_PORTS = 1;
  const MAX_SALE_POINTS = isPremiumPlus ? 5 : 2;
  const MAX_SPECIES = 10;

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
      // Use public_fishermen view which is accessible to everyone
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
      const [portsRes, speciesRes, fishermenRes, salePointsRes, profileRes] = await Promise.all([
        supabase.from('follow_ports').select('port_id').eq('user_id', user.id),
        supabase.from('follow_species').select('species_id').eq('user_id', user.id),
        supabase.from('fishermen_followers').select('fisherman_id').eq('user_id', user.id),
        supabase.from('client_follow_sale_points').select('sale_point_id').eq('user_id', user.id),
        supabase.from('profiles').select('premium_badge_color').eq('id', user.id).single(),
      ]);

      if (portsRes.data) setFavoritePorts(portsRes.data.map(p => p.port_id));
      if (speciesRes.data) setFavoriteSpecies(speciesRes.data.map(s => s.species_id));
      if (fishermenRes.data) setFavoriteFishermen(fishermenRes.data.map(f => f.fisherman_id));
      if (salePointsRes.data) setFavoriteSalePoints(salePointsRes.data.map(sp => sp.sale_point_id));
      if (profileRes.data?.premium_badge_color) setBadgeColor(profileRes.data.premium_badge_color);
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
      ]);

      const insertPromises = [];

      if (favoritePorts.length > 0) {
        insertPromises.push(
          supabase.from('follow_ports').insert(
            favoritePorts.slice(0, MAX_PORTS).map(port_id => ({ user_id: user.id, port_id }))
          )
        );
      }

      if (favoriteSpecies.length > 0 && isPremiumPlus) {
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

      if (favoriteSalePoints.length > 0 && (isPremium || isPremiumPlus)) {
        insertPromises.push(
          supabase.from('client_follow_sale_points').insert(
            favoriteSalePoints.slice(0, MAX_SALE_POINTS).map(sale_point_id => ({ user_id: user.id, sale_point_id }))
          )
        );
      }

      // Update badge color
      if (isPremium || isPremiumPlus) {
        insertPromises.push(
          supabase.from('profiles').update({ premium_badge_color: badgeColor }).eq('id', user.id)
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

  // Auto-save badge color with debounce
  const saveBadgeColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveBadgeColor = useCallback(async (color: string) => {
    if (!user || (!isPremium && !isPremiumPlus)) return;
    
    try {
      await supabase.from('profiles').update({ premium_badge_color: color }).eq('id', user.id);
      toast({
        title: 'Couleur du badge enregistrée',
        description: 'Votre préférence a été sauvegardée',
      });
    } catch {
      // Silent fail for badge color
    }
  }, [user, isPremium, isPremiumPlus, toast]);

  const handleBadgeColorChange = (color: string) => {
    setBadgeColor(color);
    
    // Debounce auto-save
    if (saveBadgeColorTimeoutRef.current) {
      clearTimeout(saveBadgeColorTimeoutRef.current);
    }
    saveBadgeColorTimeoutRef.current = setTimeout(() => {
      saveBadgeColor(color);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveBadgeColorTimeoutRef.current) {
        clearTimeout(saveBadgeColorTimeoutRef.current);
      }
    };
  }, []);

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
            <TabsTrigger value="badge" disabled={!isPremium && !isPremiumPlus} className="text-xs sm:text-sm py-2">
              Badge
            </TabsTrigger>
            <TabsTrigger value="salepoints" disabled={!isPremium && !isPremiumPlus} className="text-xs sm:text-sm py-2">
              <span className="hidden sm:inline">Points de vente</span>
              <span className="sm:hidden">Pts vente</span>
            </TabsTrigger>
            <TabsTrigger value="species" disabled={!isPremiumPlus} className="text-xs sm:text-sm py-2">
              Espèces
            </TabsTrigger>
          </TabsList>

          {/* Tab Base - Pêcheurs + Port + Push */}
          <TabsContent value="base" className="space-y-6">
            {/* Pêcheurs favoris */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Pêcheurs favoris ({favoriteFishermen.length}/{MAX_FISHERMEN})
              </Label>
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
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Port préféré ({favoritePorts.length}/{MAX_PORTS})
              </Label>
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

          {/* Tab Badge - Premium only */}
          <TabsContent value="badge" className="space-y-6">
            {isPremium || isPremiumPlus ? (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  Couleur de votre badge Premium
                </Label>
                <p className="text-xs text-muted-foreground">
                  Personnalisez l'apparence de votre badge visible sur la plateforme
                </p>
                <ColorPickerBadge
                  selectedColor={badgeColor}
                  onColorChange={handleBadgeColorChange}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  La couleur est enregistrée automatiquement
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-muted-foreground">Aperçu :</span>
                  <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${
                    badgeColor === 'or' ? 'bg-yellow-500' :
                    badgeColor === 'argent' ? 'bg-gray-400' :
                    badgeColor === 'bronze' ? 'bg-amber-700' :
                    badgeColor === 'rose' ? 'bg-pink-500' :
                    badgeColor === 'bleu' ? 'bg-blue-500' :
                    'bg-green-500'
                  }`}>
                    <Crown className="h-3 w-3 inline mr-1" />
                    Premium
                  </div>
                </div>
              </div>
            ) : (
              <LockedFeatureOverlay
                title="Badge Premium"
                description="Personnalisez votre badge avec Premium"
                requiredLevel="Premium"
              >
                <div className="space-y-3 p-4">
                  <Label>Couleur de votre badge Premium</Label>
                  <ColorPickerBadge selectedColor="or" onColorChange={() => {}} disabled />
                </div>
              </LockedFeatureOverlay>
            )}
          </TabsContent>

          {/* Tab Points de vente - Premium only */}
          <TabsContent value="salepoints" className="space-y-6">
            {isPremium || isPremiumPlus ? (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Points de vente suivis ({favoriteSalePoints.length}/{MAX_SALE_POINTS})
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recevez un email quand un arrivage est publié sur ces points
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
                title="Email - Points de vente"
                description="Recevez des emails sur vos points de vente favoris"
                requiredLevel="Premium"
              >
                <div className="space-y-3 p-4">
                  <Label>Points de vente suivis (0/2)</Label>
                  <div className="h-40 border rounded-lg" />
                </div>
              </LockedFeatureOverlay>
            )}
          </TabsContent>

          {/* Tab Espèces - Premium+ only */}
          <TabsContent value="species" className="space-y-6">
            {isPremiumPlus ? (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Fish className="h-4 w-4 text-primary" />
                  Espèces favorites ({favoriteSpecies.length}/{MAX_SPECIES})
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recevez un email quand un arrivage contient ces espèces
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
                      Fonctionnalité Premium+
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Passez à Premium+ pour recevoir des alertes sur vos espèces favorites
                    </p>
                  </div>
                </div>
                <LockedFeatureOverlay
                  title="Email - Espèces favorites"
                  description="Recevez des emails quand vos espèces préférées sont disponibles"
                  requiredLevel="Premium+"
                >
                  <div className="space-y-3 p-4">
                    <Label>Espèces favorites (0/10)</Label>
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
