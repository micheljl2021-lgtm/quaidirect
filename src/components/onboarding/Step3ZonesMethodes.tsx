import { Anchor } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Step3ZonesMethodesProps {
  formData: {
    mainFishingZone: string;
    fishingZones: string;
    fishingMethods: string[];
  };
  onChange: (field: string, value: any) => void;
}

const ZONES_PRINCIPALES = [
  "Hyères",
  "Giens",
  "Porquerolles",
  "Port-Cros",
  "Le Lavandou",
  "Saint-Tropez",
  "Cavalaire",
  "Toulon",
  "La Seyne-sur-Mer"
];

const FISHING_METHODS = [
  { id: "filet", label: "Filets" },
  { id: "palangre", label: "Palangre" },
  { id: "casier", label: "Casier" },
  { id: "ligne", label: "Ligne" },
  { id: "autre", label: "Autre" },
];

export function Step3ZonesMethodes({ formData, onChange }: Step3ZonesMethodesProps) {
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
          <Anchor className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Zones & méthodes de pêche</h2>
        <p className="text-muted-foreground">Où et comment vous pêchez</p>
      </div>

      {/* Main Fishing Zone */}
      <div className="space-y-2">
        <Label htmlFor="mainFishingZone">Zone principale de pêche*</Label>
        <Select
          value={formData.mainFishingZone}
          onValueChange={(value) => onChange('mainFishingZone', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre zone principale" />
          </SelectTrigger>
          <SelectContent>
            {ZONES_PRINCIPALES.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Fishing Methods */}
      <div className="space-y-3">
        <Label>Méthodes de pêche*</Label>
        <div className="space-y-3">
          {FISHING_METHODS.map((method) => (
            <div key={method.id} className="flex items-center space-x-2">
              <Checkbox
                id={method.id}
                checked={formData.fishingMethods?.includes(method.id)}
                onCheckedChange={(checked) => handleMethodToggle(method.id, checked as boolean)}
              />
              <label
                htmlFor={method.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {method.label}
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Sélectionnez toutes les méthodes que vous utilisez</p>
      </div>

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