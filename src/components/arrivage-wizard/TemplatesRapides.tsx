import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrivageSpecies } from "@/pages/CreateArrivageWizard";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TemplatesRapidesProps {
  onTemplateSelect: (species: ArrivageSpecies[]) => void;
}

const TEMPLATES = [
  {
    id: "grillade",
    name: "Mix Grillade",
    icon: "🔥",
    species: [
      { speciesName: "Dorade royale", quantity: 5, unit: "kg" as const, price: 18 },
      { speciesName: "Loup (Bar)", quantity: 4, unit: "kg" as const, price: 22 },
      { speciesName: "Maquereau", quantity: 8, unit: "kg" as const, price: 8 },
    ],
  },
  {
    id: "blanc",
    name: "Poisson Blanc",
    icon: "🐟",
    species: [
      { speciesName: "Merlan", quantity: 6, unit: "kg" as const, price: 10 },
      { speciesName: "Merlu", quantity: 5, unit: "kg" as const, price: 14 },
      { speciesName: "Sole", quantity: 3, unit: "kg" as const, price: 28 },
    ],
  },
  {
    id: "familles",
    name: "Familles",
    icon: "👨‍👩‍👧‍👦",
    species: [
      { speciesName: "Sardine", quantity: 10, unit: "kg" as const, price: 6 },
      { speciesName: "Maquereau", quantity: 8, unit: "kg" as const, price: 8 },
      { speciesName: "Merlan", quantity: 5, unit: "kg" as const, price: 10 },
    ],
  },
];

interface SavedPreset {
  id: string;
  name: string;
  icon: string;
  species_data: any[];
  usage_count: number;
}

export function TemplatesRapides({ onTemplateSelect }: TemplatesRapidesProps) {
  const { user } = useAuth();
  const [customPresets, setCustomPresets] = useState<SavedPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCustomPresets = async () => {
      if (!user) return;

      const { data: fishermanData } = await supabase
        .from("fishermen")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!fishermanData) return;

      const { data: presets } = await supabase
        .from("fishermen_species_presets")
        .select("*")
        .eq("fisherman_id", fishermanData.id)
        .order("usage_count", { ascending: false })
        .limit(3);

      if (presets) {
        setCustomPresets(presets as SavedPreset[]);
      }
    };

    fetchCustomPresets();
  }, [user]);

  // Fetch real species UUIDs from database by name
  const fetchSpeciesUUIDs = async (speciesNames: string[]): Promise<Map<string, { id: string; price: number }>> => {
    const { data: speciesData, error } = await supabase
      .from('species')
      .select('id, name, indicative_price')
      .in('name', speciesNames);

    if (error) {
      console.error("Error fetching species UUIDs:", error);
      return new Map();
    }

    const speciesMap = new Map<string, { id: string; price: number }>();
    speciesData?.forEach((species) => {
      speciesMap.set(species.name, { 
        id: species.id, 
        price: species.indicative_price || 0 
      });
    });

    return speciesMap;
  };

  const handleTemplateClick = async (
    templateSpecies: typeof TEMPLATES[0]["species"], 
    presetId?: string,
    presetSpeciesData?: any[]
  ) => {
    setIsLoading(true);
    
    try {
      // Get species names to fetch
      const speciesNames = templateSpecies.map((s) => s.speciesName);
      
      // Fetch real UUIDs from database
      const speciesMap = await fetchSpeciesUUIDs(speciesNames);
      
      // Map template species to ArrivageSpecies with real UUIDs
      const formattedSpecies: ArrivageSpecies[] = [];
      const notFoundSpecies: string[] = [];

      for (const s of templateSpecies) {
        const speciesInfo = speciesMap.get(s.speciesName);
        
        if (speciesInfo) {
          formattedSpecies.push({
            id: crypto.randomUUID(),
            speciesId: speciesInfo.id, // Real UUID from database
            speciesName: s.speciesName,
            quantity: s.quantity,
            unit: s.unit,
            price: s.price || speciesInfo.price,
            remark: "",
          });
        } else {
          notFoundSpecies.push(s.speciesName);
        }
      }

      // Warn if some species were not found
      if (notFoundSpecies.length > 0) {
        toast.warning(`${notFoundSpecies.length} espèce(s) non trouvée(s): ${notFoundSpecies.join(", ")}`);
      }

      if (formattedSpecies.length === 0) {
        toast.error("Aucune espèce valide trouvée dans ce modèle");
        return;
      }

      onTemplateSelect(formattedSpecies);

      // Increment usage count if it's a custom preset
      if (presetId && user) {
        const { data: fishermanData } = await supabase
          .from("fishermen")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (fishermanData) {
          const currentPreset = customPresets.find(p => p.id === presetId);
          if (currentPreset) {
            await supabase
              .from("fishermen_species_presets")
              .update({ usage_count: currentPreset.usage_count + 1 })
              .eq("id", presetId);
          }
        }
      }

      toast.success("Modèle chargé !");
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Erreur lors du chargement du modèle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPresetClick = async (preset: SavedPreset) => {
    setIsLoading(true);
    
    try {
      // Check if preset has speciesId (newer format) or only speciesName (older format)
      const hasValidUUIDs = preset.species_data.every((s: any) => s.speciesId && s.speciesId !== '');
      
      if (hasValidUUIDs) {
        // Preset already has valid UUIDs - use directly
        const formattedSpecies: ArrivageSpecies[] = preset.species_data.map((s: any) => ({
          id: crypto.randomUUID(),
          speciesId: s.speciesId,
          speciesName: s.speciesName,
          quantity: s.quantity,
          unit: s.unit,
          price: s.price,
          remark: "",
        }));
        
        onTemplateSelect(formattedSpecies);
        
        // Increment usage count
        await supabase
          .from("fishermen_species_presets")
          .update({ usage_count: preset.usage_count + 1 })
          .eq("id", preset.id);
          
        toast.success("Modèle chargé !");
      } else {
        // Old format without UUIDs - need to fetch from database
        const templateSpecies = preset.species_data.map((s: any) => ({
          speciesName: s.speciesName,
          quantity: s.quantity,
          unit: s.unit,
          price: s.price,
        }));
        await handleTemplateClick(templateSpecies, preset.id, preset.species_data);
      }
    } catch (error) {
      console.error("Error loading custom preset:", error);
      toast.error("Erreur lors du chargement du modèle");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
        <h3 className="font-semibold">Templates rapides</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Gagne du temps avec un modèle pré-rempli
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Custom Presets */}
        {customPresets.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="default"
            size="lg"
            className="h-auto py-4 flex-col items-start hover:scale-105 transition-transform"
            onClick={() => handleCustomPresetClick(preset)}
            disabled={isLoading}
          >
            <div className="text-2xl mb-1">{preset.icon}</div>
            <div className="font-semibold">{preset.name}</div>
            <div className="text-xs opacity-70 mt-1">
              {preset.species_data.length} espèces • {preset.usage_count} fois
            </div>
          </Button>
        ))}
        
        {/* Default Templates */}
        {TEMPLATES.map((template) => (
          <Button
            key={template.id}
            type="button"
            variant="outline"
            size="lg"
            className="h-auto py-4 flex-col items-start bg-background hover:bg-accent"
            onClick={() => handleTemplateClick(template.species)}
            disabled={isLoading}
          >
            <div className="text-2xl mb-1">{template.icon}</div>
            <div className="font-semibold">{template.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {template.species.length} espèces
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
