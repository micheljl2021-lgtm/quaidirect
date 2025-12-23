import { Anchor, AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getBasinFromDepartement, type FishingBasin } from "@/lib/ports";
import { getPortsByBasin } from "@/data/portsData";

interface Step3ZonesMethodesProps {
  formData: {
    mainFishingZone: string;
    fishingZones: string;
    fishingMethods: string[];
    fishingMethodOther?: string;
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

export function Step3ZonesMethodes({ formData, onChange }: Step3ZonesMethodesProps) {
  // Determine basin from postal code
  const basin = useMemo(() => {
    if (!formData.postalCode || formData.postalCode.length < 2) return null;
    const dep = formData.postalCode.substring(0, 2);
    return getBasinFromDepartement(dep);
  }, [formData.postalCode]);

  // Récupérer les ports depuis le fichier statique
  const ports = useMemo(() => {
    if (!basin) return [];
    return getPortsByBasin(basin);
  }, [basin]);

  const handleMethodToggle = (methodId: string, checked: boolean) => {
    const currentMethods = formData.fishingMethods || [];
    const newMethods = checked
      ? [...currentMethods, methodId]
      : currentMethods.filter(m => m !== methodId);
    onChange('fishingMethods', newMethods);
  };

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

      {/* Zone principale de pêche - Sélection d'un port */}
      <div className="space-y-2">
        <Label htmlFor="mainFishingZone">Zone principale de pêche *</Label>
        
        {!basin ? (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Veuillez renseigner votre code postal à l'étape 1 pour voir les ports de votre région.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              Ports de la zone : <span className="font-medium text-foreground">{BASIN_LABELS[basin]}</span>
            </p>
            <Select
              value={formData.mainFishingZone || ''}
              onValueChange={(value) => onChange('mainFishingZone', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Sélectionnez votre port principal" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50 max-h-64">
                {ports.map((portName) => (
                  <SelectItem key={portName} value={portName}>
                    {portName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
