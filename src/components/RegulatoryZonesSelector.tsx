import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, MapPin, FileText, Bell, BellOff, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface RegulatoryZone {
  id: string;
  external_id: string;
  thematique: string;
  zone_name: string;
  reglementations: string | null;
  region: string;
  departement: string | null;
  source_url: string | null;
  last_updated_at: string | null;
}

interface SelectedZone {
  zone_id: string;
  is_primary: boolean;
  subscribed_to_updates: boolean;
}

interface RegulatoryZonesSelectorProps {
  region?: string;
  selectedZones: SelectedZone[];
  onZonesChange: (zones: SelectedZone[]) => void;
  maxHeight?: string;
}

export function RegulatoryZonesSelector({ 
  region, 
  selectedZones, 
  onZonesChange,
  maxHeight = "400px"
}: RegulatoryZonesSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedThematique, setSelectedThematique] = useState<string>("all");
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  // Fetch zones from database (cached from data.gouv.fr)
  const { data, isLoading, error } = useQuery({
    queryKey: ['regulatory_zones', region, selectedThematique, search],
    queryFn: async () => {
      let query = supabase
        .from('regulatory_fishing_zones')
        .select('id, external_id, thematique, zone_name, reglementations, region, departement, source_url, last_updated_at')
        .order('zone_name');

      if (region && region !== 'all') {
        query = query.eq('region', region);
      }
      
      if (selectedThematique && selectedThematique !== 'all') {
        query = query.eq('thematique', selectedThematique);
      }
      
      if (search) {
        query = query.ilike('zone_name', `%${search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as RegulatoryZone[];
    },
  });

  // Fetch unique thematiques for filter
  const { data: thematiques } = useQuery({
    queryKey: ['regulatory_zones_thematiques'],
    queryFn: async () => {
      const { data } = await supabase
        .from('regulatory_fishing_zones')
        .select('thematique')
        .not('thematique', 'is', null);
      return [...new Set((data || []).map(t => t.thematique))].filter(Boolean).sort();
    },
  });

  const toggleZone = (zoneId: string, checked: boolean) => {
    if (checked) {
      onZonesChange([...selectedZones, { 
        zone_id: zoneId, 
        is_primary: selectedZones.length === 0, 
        subscribed_to_updates: true 
      }]);
    } else {
      onZonesChange(selectedZones.filter(z => z.zone_id !== zoneId));
    }
  };

  const togglePrimary = (zoneId: string) => {
    onZonesChange(selectedZones.map(z => ({
      ...z,
      is_primary: z.zone_id === zoneId
    })));
  };

  const toggleNotifications = (zoneId: string) => {
    onZonesChange(selectedZones.map(z => 
      z.zone_id === zoneId 
        ? { ...z, subscribed_to_updates: !z.subscribed_to_updates }
        : z
    ));
  };

  const toggleExpanded = (zoneId: string) => {
    const newExpanded = new Set(expandedZones);
    if (newExpanded.has(zoneId)) {
      newExpanded.delete(zoneId);
    } else {
      newExpanded.add(zoneId);
    }
    setExpandedZones(newExpanded);
  };

  const isZoneSelected = (zoneId: string) => 
    selectedZones.some(z => z.zone_id === zoneId);

  const getSelectedZone = (zoneId: string) => 
    selectedZones.find(z => z.zone_id === zoneId);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement des zones réglementaires. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedThematique} onValueChange={setSelectedThematique}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Thématique" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les thématiques</SelectItem>
            {(thematiques || []).map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selected count */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {selectedZones.length} zone(s) sélectionnée(s)
        </span>
        {selectedZones.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onZonesChange([])}
          >
            Tout désélectionner
          </Button>
        )}
      </div>

      {/* Zones list */}
      <ScrollArea className="h-[400px] border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Chargement des zones...</span>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {search ? 'Aucune zone trouvée pour cette recherche' : 'Aucune zone réglementaire disponible'}
          </div>
        ) : (
          <div className="divide-y">
            {data.map((zone) => {
              const isSelected = isZoneSelected(zone.id);
              const selectedZone = getSelectedZone(zone.id);
              const isExpanded = expandedZones.has(zone.id);

              return (
                <Collapsible 
                  key={zone.id}
                  open={isExpanded}
                  onOpenChange={() => toggleExpanded(zone.id)}
                >
                  <div className={`p-3 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={zone.id}
                        checked={isSelected}
                        onCheckedChange={(checked) => toggleZone(zone.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label 
                            htmlFor={zone.id}
                            className="font-medium cursor-pointer text-sm"
                          >
                            {zone.zone_name}
                          </label>
                          {selectedZone?.is_primary && (
                            <Badge variant="default" className="text-xs">
                              Zone principale
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {zone.region}
                          </Badge>
                          {zone.thematique && (
                            <Badge variant="secondary" className="text-xs">
                              {zone.thematique}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>

                    {/* Selected zone options */}
                    {isSelected && (
                      <div className="mt-2 ml-7 flex items-center gap-2 flex-wrap">
                        {!selectedZone?.is_primary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePrimary(zone.id)}
                            className="h-7 text-xs"
                          >
                            Définir comme principale
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleNotifications(zone.id)}
                          className="h-7 text-xs"
                        >
                          {selectedZone?.subscribed_to_updates ? (
                            <>
                              <Bell className="h-3 w-3 mr-1" />
                              Notifications activées
                            </>
                          ) : (
                            <>
                              <BellOff className="h-3 w-3 mr-1" />
                              Notifications désactivées
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <CollapsibleContent>
                    <div className="px-3 pb-3 ml-7 space-y-2">
                      {zone.reglementations && (
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <FileText className="h-3 w-3" />
                            <span className="font-medium">Réglementations :</span>
                          </div>
                          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            {zone.reglementations}
                          </p>
                        </div>
                      )}
                      {zone.source_url && (
                        <a 
                          href={zone.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir la source officielle
                        </a>
                      )}
                      {zone.last_updated_at && (
                        <p className="text-xs text-muted-foreground">
                          Dernière mise à jour : {new Date(zone.last_updated_at).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Info */}
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertDescription className="text-xs">
          En sélectionnant des zones avec les notifications activées, vous serez averti des changements réglementaires (nouveaux arrêtés, modifications).
        </AlertDescription>
      </Alert>
    </div>
  );
}
