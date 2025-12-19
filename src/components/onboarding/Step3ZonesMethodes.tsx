import { Anchor, Loader2, Scale } from "lucide-react";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RegulatoryZonesSelector } from "@/components/RegulatoryZonesSelector";

interface SelectedRegulatoryZone {
  zone_id: string;
  is_primary: boolean;
  subscribed_to_updates: boolean;
}

interface Step3ZonesMethodesProps {
  formData: {
    mainFishingZone: string;
    zoneId?: string;
    fishingZones: string;
    fishingMethods: string[];
    fishingMethodOther?: string;
    regulatoryZones?: SelectedRegulatoryZone[];
  };
  onChange: (field: string, value: any) => void;
}

interface FishingMethodsSelectorProps {
  formData: Step3ZonesMethodesProps['formData'];
  onChange: (field: string, value: any) => void;
  handleMethodToggle: (methodId: string, checked: boolean) => void;
}

const FishingMethodsSelector = ({ formData, onChange, handleMethodToggle }: FishingMethodsSelectorProps) => {
  const showOtherInput = formData.fishingMethods?.includes('autre');
  
  return (
    <div className="space-y-3">
      <Label>Méthodes de pêche *</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FISHING_METHODS.map((method) => (
          <div key={method.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
            <Checkbox
              id={method.id}
              checked={formData.fishingMethods?.includes(method.id)}
              onCheckedChange={(checked) => handleMethodToggle(method.id, checked as boolean)}
            />
            <label
              htmlFor={method.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
            >
              {method.label}
            </label>
          </div>
        ))}
      </div>
      {showOtherInput && (
        <div className="mt-2">
          <Input
            placeholder="Précisez votre méthode de pêche..."
            value={formData.fishingMethodOther || ''}
            onChange={(e) => onChange('fishingMethodOther', e.target.value)}
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">Sélectionnez toutes les méthodes que vous utilisez</p>
    </div>
  );
};

const FISHING_METHODS = [
  { id: "chalut", label: "Chalut" },
  { id: "senne", label: "Senne" },
  { id: "drague", label: "Drague" },
  { id: "filet_maillant", label: "Filet maillant" },
  { id: "tremail", label: "Trémail" },
  { id: "filet", label: "Filets (autres)" },
  { id: "nasse", label: "Nasse" },
  { id: "casier", label: "Casier" },
  { id: "palangre", label: "Palangre" },
  { id: "ligne", label: "Ligne / Canne" },
  { id: "traine", label: "Traîne" },
  { id: "peche_pied", label: "Pêche à pied" },
  { id: "plongee", label: "Plongée" },
  { id: "autre", label: "Autre (préciser)" },
];

export function Step3ZonesMethodes({ formData, onChange }: Step3ZonesMethodesProps) {
  const [activeTab, setActiveTab] = useState<string>("general");

  // Charger les zones depuis la base de données
  const { data: zones = [], isLoading: zonesLoading } = useQuery({
    queryKey: ['zones_peche_onboarding'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zones_peche')
        .select('id, name, region')
        .order('region, name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Check if regulatory zones are available
  const { data: regulatoryZonesCount } = useQuery({
    queryKey: ['regulatory_zones_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('regulatory_fishing_zones')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Grouper les zones par région
  const zonesByRegion = zones.reduce((acc, zone) => {
    if (!acc[zone.region]) {
      acc[zone.region] = [];
    }
    acc[zone.region].push(zone);
    return acc;
  }, {} as Record<string, typeof zones>);

  const handleZoneChange = (zoneId: string) => {
    const selectedZone = zones.find(z => z.id === zoneId);
    onChange('zoneId', zoneId);
    onChange('mainFishingZone', selectedZone?.name || '');
  };

  const handleMethodToggle = (methodId: string, checked: boolean) => {
    const currentMethods = formData.fishingMethods || [];
    const newMethods = checked
      ? [...currentMethods, methodId]
      : currentMethods.filter(m => m !== methodId);
    onChange('fishingMethods', newMethods);
  };

  const handleRegulatoryZonesChange = (zones: SelectedRegulatoryZone[]) => {
    onChange('regulatoryZones', zones);
  };

  // Detect region from selected general zone
  const selectedZone = zones.find(z => z.id === formData.zoneId);
  const detectedRegion = selectedZone?.region;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Anchor className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold">Zones & méthodes de pêche</h2>
        <p className="text-muted-foreground">Où et comment vous pêchez</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Zone générale</TabsTrigger>
          <TabsTrigger value="regulatory" className="relative">
            <Scale className="h-4 w-4 mr-1" />
            Zones réglementaires
            {regulatoryZonesCount && regulatoryZonesCount > 0 && (
              <span className="ml-1 text-xs text-primary">(officiel)</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-4">
          {/* Main Fishing Zone - Dynamique depuis la base */}
          <div className="space-y-2">
            <Label htmlFor="mainFishingZone">Zone principale de pêche *</Label>
            {zonesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des zones...
              </div>
            ) : (
              <Select
                value={formData.zoneId || ''}
                onValueChange={handleZoneChange}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Sélectionnez votre zone principale" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {Object.entries(zonesByRegion).map(([region, regionZones]) => (
                    <SelectGroup key={region}>
                      <SelectLabel className="font-semibold text-primary">{region}</SelectLabel>
                      {regionZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Detailed Zones */}
          <div className="space-y-2">
            <Label htmlFor="fishingZones">Zones détaillées (optionnel)</Label>
            <Textarea
              id="fishingZones"
              value={formData.fishingZones}
              onChange={(e) => onChange('fishingZones', e.target.value)}
              placeholder="Ex: Au large de Porquerolles, côté sud de Giens..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Décrivez plus précisément vos zones de pêche</p>
          </div>
        </TabsContent>

        <TabsContent value="regulatory" className="space-y-4 mt-4">
          {regulatoryZonesCount === 0 ? (
            <Alert>
              <Scale className="h-4 w-4" />
              <AlertDescription>
                Les zones réglementaires officielles ne sont pas encore disponibles. 
                Elles seront synchronisées prochainement depuis data.gouv.fr.
                En attendant, utilisez l'onglet "Zone générale".
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert className="bg-blue-50 border-blue-200">
                <Scale className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Zones officielles data.gouv.fr</strong><br />
                  Sélectionnez vos zones de pêche réglementaires. Vous serez notifié des changements d'arrêtés.
                </AlertDescription>
              </Alert>

              <RegulatoryZonesSelector
                region={detectedRegion}
                selectedZones={formData.regulatoryZones || []}
                onZonesChange={handleRegulatoryZonesChange}
                maxHeight="300px"
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Fishing Methods */}
      <FishingMethodsSelector formData={formData} onChange={onChange} handleMethodToggle={handleMethodToggle} />

      {/* Alert Box */}
      <Alert className="bg-blue-50 border-blue-200">
        <div className="flex gap-2">
          <span className="text-xl">🔹</span>
          <div>
            <h4 className="font-semibold mb-1">Pêche responsable</h4>
            <AlertDescription>
              Ces informations permettent aux clients de comprendre votre métier et vos pratiques de pêche durable.
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}
