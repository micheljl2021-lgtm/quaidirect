import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { RegulatoryZonesSelector } from "@/components/RegulatoryZonesSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  MapPin, 
  Bell, 
  BellOff, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Save,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Navigate } from "react-router-dom";

interface SelectedZone {
  zone_id: string;
  is_primary: boolean;
  subscribed_to_updates: boolean;
}

interface RegulatoryChange {
  id: string;
  zone_id: string;
  change_type: string;
  old_reglementations: string | null;
  new_reglementations: string | null;
  detected_at: string;
  zone?: {
    zone_name: string;
    region: string;
  };
}

export default function PecheurZonesReglementaires() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedZones, setSelectedZones] = useState<SelectedZone[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Get fisherman profile
  const { data: fisherman, isLoading: fishermanLoading } = useQuery({
    queryKey: ['fisherman_profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('fishermen')
        .select('id, main_fishing_zone')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get current zones
  const { data: currentZones, isLoading: zonesLoading } = useQuery({
    queryKey: ['fisherman_regulatory_zones', fisherman?.id],
    queryFn: async () => {
      if (!fisherman?.id) return [];
      const { data, error } = await supabase
        .from('fisherman_regulatory_zones')
        .select(`
          id,
          zone_id,
          is_primary,
          subscribed_to_updates,
          regulatory_fishing_zones (
            id,
            zone_name,
            thematique,
            reglementations,
            region,
            source_url,
            last_updated_at
          )
        `)
        .eq('fisherman_id', fisherman.id);
      if (error) throw error;
      return data;
    },
    enabled: !!fisherman?.id,
  });

  // Get recent changes for subscribed zones
  const { data: recentChanges } = useQuery({
    queryKey: ['regulatory_zone_changes', fisherman?.id],
    queryFn: async () => {
      if (!fisherman?.id || !currentZones) return [];
      
      const subscribedZoneIds = currentZones
        .filter(z => z.subscribed_to_updates)
        .map(z => z.zone_id);
      
      if (subscribedZoneIds.length === 0) return [];

      const { data, error } = await supabase
        .from('regulatory_zone_changes')
        .select(`
          id,
          zone_id,
          change_type,
          old_reglementations,
          new_reglementations,
          detected_at
        `)
        .in('zone_id', subscribedZoneIds)
        .order('detected_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;

      // Enrich with zone names
      const enriched = await Promise.all((data || []).map(async (change) => {
        const zone = currentZones.find(z => z.zone_id === change.zone_id);
        return {
          ...change,
          zone: zone?.regulatory_fishing_zones ? {
            zone_name: (zone.regulatory_fishing_zones as any).zone_name,
            region: (zone.regulatory_fishing_zones as any).region,
          } : undefined,
        };
      }));

      return enriched as RegulatoryChange[];
    },
    enabled: !!fisherman?.id && !!currentZones,
  });

  // Initialize selectedZones when data loads
  useState(() => {
    if (currentZones && !hasChanges) {
      setSelectedZones(currentZones.map(z => ({
        zone_id: z.zone_id,
        is_primary: z.is_primary,
        subscribed_to_updates: z.subscribed_to_updates,
      })));
    }
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (zones: SelectedZone[]) => {
      if (!fisherman?.id) throw new Error('Fisherman not found');

      // Delete existing zones
      await supabase
        .from('fisherman_regulatory_zones')
        .delete()
        .eq('fisherman_id', fisherman.id);

      // Insert new zones
      if (zones.length > 0) {
        const { error } = await supabase
          .from('fisherman_regulatory_zones')
          .insert(zones.map(z => ({
            fisherman_id: fisherman.id,
            zone_id: z.zone_id,
            is_primary: z.is_primary,
            subscribed_to_updates: z.subscribed_to_updates,
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Zones réglementaires enregistrées');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['fisherman_regulatory_zones'] });
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    },
  });

  const handleZonesChange = (zones: SelectedZone[]) => {
    setSelectedZones(zones);
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(selectedZones);
  };

  if (authLoading || fishermanLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!fisherman) {
    return <Navigate to="/pecheur/onboarding" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Zones réglementaires</h1>
            <p className="text-muted-foreground">
              Définissez vos zones de pêche officielles et recevez les alertes de changements réglementaires
            </p>
          </div>

          {/* Save button */}
          {hasChanges && (
            <Alert className="bg-primary/10 border-primary">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Modifications non enregistrées</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>Vous avez des modifications en attente.</span>
                <Button 
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="ml-4"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="zones" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="zones">
                <MapPin className="h-4 w-4 mr-2" />
                Mes zones ({selectedZones.length})
              </TabsTrigger>
              <TabsTrigger value="changes">
                <Bell className="h-4 w-4 mr-2" />
                Changements récents
                {recentChanges && recentChanges.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {recentChanges.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="zones" className="space-y-6">
              {/* Current zones summary */}
              {currentZones && currentZones.length > 0 && !hasChanges && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Zones actuellement configurées</CardTitle>
                    <CardDescription>
                      {currentZones.length} zone(s) de pêche réglementaire(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentZones.map((zone) => {
                        const zoneData = zone.regulatory_fishing_zones as any;
                        return (
                          <div 
                            key={zone.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                              <div>
                                <p className="font-medium">{zoneData?.zone_name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {zoneData?.region}
                                  </Badge>
                                  {zone.is_primary && (
                                    <Badge variant="default" className="text-xs">
                                      Principale
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {zone.subscribed_to_updates ? (
                                <Badge variant="secondary" className="text-xs">
                                  <Bell className="h-3 w-3 mr-1" />
                                  Alertes actives
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  <BellOff className="h-3 w-3 mr-1" />
                                  Sans alertes
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Zone selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sélectionner vos zones</CardTitle>
                  <CardDescription>
                    Choisissez les zones réglementaires officielles où vous exercez votre activité
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RegulatoryZonesSelector
                    selectedZones={selectedZones}
                    onZonesChange={handleZonesChange}
                    maxHeight="500px"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="changes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Changements réglementaires récents
                  </CardTitle>
                  <CardDescription>
                    Modifications détectées dans vos zones avec alertes activées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!recentChanges || recentChanges.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun changement récent détecté</p>
                      <p className="text-sm mt-2">
                        Les changements réglementaires dans vos zones apparaîtront ici
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {recentChanges.map((change) => (
                          <div 
                            key={change.id}
                            className="p-4 border rounded-lg space-y-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  {change.change_type === 'new' ? (
                                    <Badge variant="default" className="bg-green-500">
                                      Nouvelle zone
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-amber-500 text-white">
                                      Modification
                                    </Badge>
                                  )}
                                  <span className="font-medium">
                                    {change.zone?.zone_name || 'Zone inconnue'}
                                  </span>
                                </div>
                                {change.zone?.region && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3 inline mr-1" />
                                    {change.zone.region}
                                  </p>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(change.detected_at).toLocaleDateString('fr-FR')}
                              </div>
                            </div>

                            {change.change_type === 'updated' && (
                              <div className="space-y-2 text-sm">
                                {change.old_reglementations && (
                                  <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded text-red-700 dark:text-red-300">
                                    <span className="font-medium">Ancien :</span> {change.old_reglementations}
                                  </div>
                                )}
                                {change.new_reglementations && (
                                  <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded text-green-700 dark:text-green-300">
                                    <span className="font-medium">Nouveau :</span> {change.new_reglementations}
                                  </div>
                                )}
                              </div>
                            )}

                            {change.change_type === 'new' && change.new_reglementations && (
                              <div className="bg-muted p-2 rounded text-sm">
                                {change.new_reglementations}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Alert>
                <Bell className="h-4 w-4" />
                <AlertTitle>Synchronisation automatique</AlertTitle>
                <AlertDescription>
                  Les données réglementaires sont synchronisées régulièrement depuis data.gouv.fr. 
                  Vous recevrez des notifications pour les zones où les alertes sont activées.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
