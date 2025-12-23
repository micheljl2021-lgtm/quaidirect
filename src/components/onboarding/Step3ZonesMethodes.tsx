import { Anchor, Loader2, MapPin, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getBasinFromDepartement, type FishingBasin } from "@/lib/ports";
import { getPortsByBasin } from "@/data/portsData";

interface Step3ZonesMethodesProps {
  formData: {
    mainFishingZone: string;
    zoneId?: string;
    fishingZones: string;
    fishingMethods: string[];
    fishingMethodOther?: string;
    selectedPorts?: string[];
    postalCode?: string;
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
            onFocus={(e) => e.currentTarget.select()}
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

const BASIN_LABELS: Record<FishingBasin, string> = {
  MEDITERRANEE: "Méditerranée",
  ATLANTIQUE: "Atlantique",
  MANCHE: "Manche",
};

// Mapping bassin → nom de région dans la base de données
const BASIN_TO_REGION: Record<FishingBasin, string> = {
  MEDITERRANEE: "Méditerranée",
  ATLANTIQUE: "Atlantique",
  MANCHE: "Manche",
};

export function Step3ZonesMethodes({ formData, onChange }: Step3ZonesMethodesProps) {
  // Determine basin from postal code
  const basin = useMemo(() => {
    if (!formData.postalCode || formData.postalCode.length < 2) return null;
    const dep = formData.postalCode.substring(0, 2);
    return getBasinFromDepartement(dep);
  }, [formData.postalCode]);

  // Récupérer les ports depuis le fichier statique (pas de requête Supabase)
  const ports = useMemo(() => {
    if (!basin) return [];
    return getPortsByBasin(basin);
  }, [basin]);

  // Charger les zones depuis la base de données - filtrées par région si bassin connu
  const { data: zones = [], isLoading: zonesLoading } = useQuery({
    queryKey: ['zones_peche_onboarding', basin],
    queryFn: async () => {
      let query = supabase
        .from('zones_peche')
        .select('id, name, region');
      
      // Filtrer par région si bassin détecté
      if (basin) {
        const regionName = BASIN_TO_REGION[basin];
        query = query.eq('region', regionName);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data || [];
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

  const handlePortToggle = (portName: string, checked: boolean) => {
    const currentPorts = formData.selectedPorts || [];
    if (checked) {
      if (currentPorts.length >= 3) {
        return; // Maximum 3 ports
      }
      onChange('selectedPorts', [...currentPorts, portName]);
    } else {
      onChange('selectedPorts', currentPorts.filter(p => p !== portName));
    }
  };

  const selectedPortsCount = formData.selectedPorts?.length || 0;

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

      {/* Main Fishing Zone */}
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

      {/* Ports Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Ports habituels de vente
          </Label>
          {basin && (
            <Badge variant={selectedPortsCount >= 3 ? "destructive" : "secondary"}>
              {selectedPortsCount}/3 sélectionnés
            </Badge>
          )}
        </div>
        
        {!basin ? (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Veuillez renseigner votre code postal à l'étape 1 pour voir les ports de votre région.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Ports de la zone : <span className="font-medium text-foreground">{BASIN_LABELS[basin]}</span>
            </p>

            {ports.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                Aucun port trouvé pour cette région.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                {ports.map((portName) => {
                  const isSelected = formData.selectedPorts?.includes(portName);
                  const isDisabled = !isSelected && selectedPortsCount >= 3;
                  // Générer un ID unique à partir du nom du port
                  const portId = portName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                  
                  return (
                    <div 
                      key={portId} 
                      className={`flex items-center space-x-2 p-2 border rounded-lg transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                      } ${isDisabled ? 'opacity-50' : ''}`}
                    >
                      <Checkbox
                        id={`port-${portId}`}
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => handlePortToggle(portName, checked as boolean)}
                      />
                      <label
                        htmlFor={`port-${portId}`}
                        className={`text-sm font-medium leading-none cursor-pointer flex-1 ${isDisabled ? 'cursor-not-allowed' : ''}`}
                      >
                        {portName}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
            
            {selectedPortsCount >= 3 && (
              <p className="text-xs text-destructive">
                Maximum 3 ports. Désélectionnez-en un pour en choisir un autre.
              </p>
            )}
          </>
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
          onFocus={(e) => e.currentTarget.select()}
        />
        <p className="text-xs text-muted-foreground">Décrivez plus précisément vos zones de pêche</p>
      </div>

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
