import { Fish, Plus, Search, ChevronDown, ChevronUp, Star, Filter } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getBasinFromDepartement, type FishingBasin } from "@/lib/ports";

interface Step4EspecesProps {
  formData: {
    selectedSpecies: string[];
    postalCode?: string;
    fishingMethods?: string[];
    mainFishingZone?: string;
  };
  onChange: (field: string, value: any) => void;
}

// Common species by basin for quick selection
const COMMON_SPECIES_BY_BASIN: Record<FishingBasin, string[]> = {
  MEDITERRANEE: [
    "Daurade royale", "Loup de mer", "Rouget", "Pageot", "Sar", "Sole", 
    "Merlu", "Poulpe", "Seiche", "Calamar", "Rascasse", "Saint-Pierre"
  ],
  ATLANTIQUE: [
    "Bar", "Sole", "Turbot", "Lieu jaune", "Merlu", "Maquereau", 
    "Sardine", "Homard", "Langoustine", "Crevette", "Huître", "Moule"
  ],
  MANCHE: [
    "Bar", "Sole", "Turbot", "Cabillaud", "Merlan", "Lieu jaune", 
    "Maquereau", "Hareng", "Coquille Saint-Jacques", "Homard", "Tourteau", "Araignée"
  ],
};

const BASIN_LABELS: Record<FishingBasin, string> = {
  MEDITERRANEE: "Méditerranée",
  ATLANTIQUE: "Atlantique",
  MANCHE: "Manche",
};

// Mapping between fishing methods (from Step3) and fishing_gear values in database
const FISHING_METHOD_TO_GEAR: Record<string, string[]> = {
  chalut: ['chalut'],
  filet: ['filet', 'filet_maillant'],
  filet_maillant: ['filet', 'filet_maillant'],
  tremail: ['filet', 'tremail'],
  casier: ['casier'],
  nasse: ['casier', 'nasse'],
  palangre: ['palangre'],
  ligne: ['ligne', 'canne'],
  hamecon: ['ligne', 'canne'],
  traine: ['traine'],
  senne: ['senne'],
  drague: ['drague'],
  peche_pied: ['peche_pied'],
  plongee: ['plongee'],
  autre: [], // Show all species
};

const FISHING_METHOD_LABELS: Record<string, string> = {
  chalut: 'Chalut',
  filet: 'Filet',
  filet_maillant: 'Filet maillant',
  tremail: 'Trémail',
  casier: 'Casier',
  nasse: 'Nasse',
  palangre: 'Palangre',
  ligne: 'Ligne/Canne',
  hamecon: 'Hameçon',
  traine: 'Traîne',
  senne: 'Senne',
  drague: 'Drague',
  peche_pied: 'Pêche à pied',
  plongee: 'Plongée',
  autre: 'Autre',
};

export function Step4Especes({ formData, onChange }: Step4EspecesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customSpecies, setCustomSpecies] = useState("");
  const [showAllSpecies, setShowAllSpecies] = useState(false);
  const collapsibleContentRef = useRef<HTMLDivElement>(null);

  // Determine basin from postal code
  const basin = useMemo(() => {
    if (!formData.postalCode || formData.postalCode.length < 2) return null;
    const dep = formData.postalCode.substring(0, 2);
    return getBasinFromDepartement(dep);
  }, [formData.postalCode]);

  const { data: species = [] } = useQuery({
    queryKey: ['species'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('species')
        .select('id, name, scientific_name, fishing_area, fishing_gear')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get the fishing area key from basin
  const getFishingAreaFromBasin = (b: FishingBasin | null): string | null => {
    if (!b) return null;
    const map: Record<FishingBasin, string> = {
      MEDITERRANEE: 'mediterranee',
      ATLANTIQUE: 'atlantique',
      MANCHE: 'manche',
    };
    return map[b];
  };

  const fishingArea = getFishingAreaFromBasin(basin);

  // Get all gear keywords from selected fishing methods
  const selectedGearKeywords = useMemo(() => {
    const methods = formData.fishingMethods || [];
    if (methods.length === 0) return [];
    
    const keywords = new Set<string>();
    methods.forEach(method => {
      const gears = FISHING_METHOD_TO_GEAR[method] || [];
      gears.forEach(g => keywords.add(g));
    });
    return Array.from(keywords);
  }, [formData.fishingMethods]);

  // Check if a species matches the selected fishing methods
  const matchesFishingMethod = (speciesGear: string | null): boolean => {
    if (selectedGearKeywords.length === 0) return true; // No filter if no methods selected
    if (!speciesGear) return true; // Show species without gear info
    
    const gearList = speciesGear.toLowerCase().split(',').map(g => g.trim());
    return selectedGearKeywords.some(keyword => 
      gearList.some(g => g.includes(keyword) || keyword.includes(g))
    );
  };

  // Filter species by fishing area - show species for current area + 'all'
  const filteredByArea = useMemo(() => {
    if (!fishingArea) return species;
    return species.filter(s => 
      !s.fishing_area || s.fishing_area === 'all' || s.fishing_area === fishingArea
    );
  }, [species, fishingArea]);

  // Filter by fishing method
  const filteredByMethod = useMemo(() => {
    return filteredByArea.filter(s => matchesFishingMethod(s.fishing_gear));
  }, [filteredByArea, selectedGearKeywords]);

  // Get common species for the detected basin
  const commonSpeciesNames = basin ? COMMON_SPECIES_BY_BASIN[basin] : [];
  
  // Filter species that match the common names for this basin
  const commonSpecies = useMemo(() => {
    if (!commonSpeciesNames.length) return filteredByMethod.slice(0, 15);
    return filteredByMethod.filter(s => 
      commonSpeciesNames.some(name => 
        s.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(s.name.toLowerCase())
      )
    );
  }, [filteredByMethod, commonSpeciesNames]);

  // All other species (not in common list)
  const otherSpecies = useMemo(() => {
    const commonIds = new Set(commonSpecies.map(s => s.id));
    return filteredByMethod.filter(s => !commonIds.has(s.id));
  }, [filteredByMethod, commonSpecies]);

  // Filter by search query
  const filteredCommon = useMemo(() => {
    if (!searchQuery) return commonSpecies;
    const query = searchQuery.toLowerCase();
    return commonSpecies.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.scientific_name && s.scientific_name.toLowerCase().includes(query))
    );
  }, [commonSpecies, searchQuery]);

  const filteredOther = useMemo(() => {
    if (!searchQuery) return otherSpecies;
    const query = searchQuery.toLowerCase();
    return otherSpecies.filter(s =>
      s.name.toLowerCase().includes(query) ||
      (s.scientific_name && s.scientific_name.toLowerCase().includes(query))
    );
  }, [otherSpecies, searchQuery]);

  const handleSpeciesToggle = (speciesId: string, checked: boolean) => {
    const currentSpecies = formData.selectedSpecies || [];
    const newSpecies = checked
      ? [...currentSpecies, speciesId]
      : currentSpecies.filter(s => s !== speciesId);
    onChange('selectedSpecies', newSpecies);
    // Keep the collapsible open - don't close it after selection
  };

  const handleAddCustomSpecies = async () => {
    if (!customSpecies.trim()) {
      toast.error("Veuillez entrer un nom d'espèce");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('species')
        .insert({ name: customSpecies.trim() })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onChange('selectedSpecies', [...(formData.selectedSpecies || []), data.id]);
        toast.success(`${customSpecies} ajouté avec succès !`);
        setCustomSpecies("");
      }
    } catch (error) {
      console.error('Erreur ajout espèce:', error);
      toast.error("Impossible d'ajouter l'espèce");
    }
  };

  // Get labels for active filters
  const activeMethodLabels = (formData.fishingMethods || [])
    .map(m => FISHING_METHOD_LABELS[m] || m)
    .filter(Boolean);

  const SpeciesItem = ({ s }: { s: typeof species[0] }) => (
    <div
      key={s.id}
      className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
      onClick={(e) => {
        // Prevent the click from bubbling up and closing the collapsible
        e.stopPropagation();
      }}
    >
      <Checkbox
        id={s.id}
        checked={formData.selectedSpecies?.includes(s.id)}
        onCheckedChange={(checked) => handleSpeciesToggle(s.id, checked as boolean)}
      />
      <label
        htmlFor={s.id}
        className="flex-1 text-sm cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-medium">{s.name}</div>
        {s.scientific_name && (
          <div className="text-xs text-muted-foreground italic">{s.scientific_name}</div>
        )}
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Fish className="w-8 h-8 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-bold">Espèces pêchées</h2>
        <p className="text-muted-foreground">Sélectionnez les poissons et crustacés que vous pêchez</p>
      </div>

      {/* Filter indicators */}
      {(basin || activeMethodLabels.length > 0) && (
        <Alert className="bg-primary/5 border-primary/20">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <Filter className="h-4 w-4 text-primary" />
              <AlertDescription className="font-medium">
                Espèces filtrées automatiquement
              </AlertDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {basin && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Zone : {BASIN_LABELS[basin]}
                </Badge>
              )}
              {activeMethodLabels.map(label => (
                <Badge key={label} variant="secondary" className="bg-green-100 text-green-800">
                  {label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredByMethod.length} espèces correspondent à vos critères
            </p>
          </div>
        </Alert>
      )}

      {/* Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            placeholder="Rechercher une espèce..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Common Species Section */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          Espèces courantes {basin && `(${BASIN_LABELS[basin]})`}
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
          {filteredCommon.map((s) => (
            <SpeciesItem key={s.id} s={s} />
          ))}
        </div>
        {filteredCommon.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune espèce courante trouvée pour vos critères
          </p>
        )}
      </div>

      {/* All Other Species - Collapsible - Controlled to prevent auto-close */}
      <Collapsible 
        open={showAllSpecies} 
        onOpenChange={(open) => {
          // Only allow the button click to toggle, not other events
          setShowAllSpecies(open);
        }}
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            type="button"
          >
            <span>Voir toutes les espèces ({otherSpecies.length})</span>
            {showAllSpecies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4" ref={collapsibleContentRef}>
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1"
            onClick={(e) => e.stopPropagation()}
          >
            {filteredOther.map((s) => (
              <SpeciesItem key={s.id} s={s} />
            ))}
          </div>
          {filteredOther.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune autre espèce trouvée
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Add Custom Species */}
      <div className="space-y-2">
        <Label htmlFor="customSpecies">Espèce non répertoriée ?</Label>
        <div className="flex gap-2">
          <Input
            id="customSpecies"
            value={customSpecies}
            onChange={(e) => setCustomSpecies(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            placeholder="Ex: Étoile, Violon..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSpecies();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCustomSpecies}
          >
            <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
            Ajouter
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Si votre espèce n'est pas dans la liste, ajoutez-la ici
        </p>
      </div>

      {/* Selected Count */}
      {formData.selectedSpecies?.length > 0 && (
        <div className="text-sm text-muted-foreground text-center p-2 bg-primary/5 rounded-lg">
          ✓ {formData.selectedSpecies.length} espèce{formData.selectedSpecies.length > 1 ? 's' : ''} sélectionnée{formData.selectedSpecies.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
