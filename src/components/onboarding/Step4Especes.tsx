import { Fish, Plus, Search, ChevronDown, ChevronUp, Star } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getBasinFromDepartement, type FishingBasin } from "@/lib/ports";

interface Step4EspecesProps {
  formData: {
    selectedSpecies: string[];
    postalCode?: string;
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

export function Step4Especes({ formData, onChange }: Step4EspecesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customSpecies, setCustomSpecies] = useState("");
  const [showAllSpecies, setShowAllSpecies] = useState(false);

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
        .select('id, name, scientific_name, fishing_area')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get common species for the detected basin
  const commonSpeciesNames = basin ? COMMON_SPECIES_BY_BASIN[basin] : [];
  
  // Filter species that match the common names for this basin
  const commonSpecies = useMemo(() => {
    if (!commonSpeciesNames.length) return species.slice(0, 15); // fallback to first 15
    return species.filter(s => 
      commonSpeciesNames.some(name => 
        s.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(s.name.toLowerCase())
      )
    );
  }, [species, commonSpeciesNames]);

  // All other species (not in common list)
  const otherSpecies = useMemo(() => {
    const commonIds = new Set(commonSpecies.map(s => s.id));
    return species.filter(s => !commonIds.has(s.id));
  }, [species, commonSpecies]);

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

  const SpeciesItem = ({ s }: { s: typeof species[0] }) => (
    <div
      key={s.id}
      className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <Checkbox
        id={s.id}
        checked={formData.selectedSpecies?.includes(s.id)}
        onCheckedChange={(checked) => handleSpeciesToggle(s.id, checked as boolean)}
      />
      <label
        htmlFor={s.id}
        className="flex-1 text-sm cursor-pointer"
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

      {/* Basin indicator */}
      {basin && (
        <Alert className="bg-primary/5 border-primary/20">
          <div className="flex gap-2 items-center">
            <Star className="h-4 w-4 text-primary" />
            <AlertDescription>
              Espèces courantes en <strong>{BASIN_LABELS[basin]}</strong> affichées en priorité
            </AlertDescription>
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
            Aucune espèce courante trouvée
          </p>
        )}
      </div>

      {/* All Other Species - Collapsible */}
      <Collapsible open={showAllSpecies} onOpenChange={setShowAllSpecies}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Voir toutes les espèces ({otherSpecies.length})</span>
            {showAllSpecies ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
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