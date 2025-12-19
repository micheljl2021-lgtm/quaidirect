import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrivageSpecies } from "@/pages/CreateArrivageWizard";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TemplatesRapidesProps {
  onTemplateSelect: (species: ArrivageSpecies[]) => void;
}

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
  const [loadingPresets, setLoadingPresets] = useState(true);

  useEffect(() => {
    const fetchCustomPresets = async () => {
      if (!user) {
        setLoadingPresets(false);
        return;
      }

      try {
        const { data: fishermanData } = await supabase
          .from("fishermen")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!fishermanData) {
          setLoadingPresets(false);
          return;
        }

        const { data: presets } = await supabase
          .from("fishermen_species_presets")
          .select("*")
          .eq("fisherman_id", fishermanData.id)
          .order("usage_count", { ascending: false })
          .limit(6);

        if (presets) {
          setCustomPresets(presets as SavedPreset[]);
        }
      } catch (error) {
        console.error("Error fetching presets:", error);
      } finally {
        setLoadingPresets(false);
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
          
        toast.success("Favori chargé !");
      } else {
        // Old format without UUIDs - need to fetch from database
        const speciesNames = preset.species_data.map((s: any) => s.speciesName);
        const speciesMap = await fetchSpeciesUUIDs(speciesNames);
        
        const formattedSpecies: ArrivageSpecies[] = [];
        const notFoundSpecies: string[] = [];

        for (const s of preset.species_data) {
          const speciesInfo = speciesMap.get(s.speciesName);
          
          if (speciesInfo) {
            formattedSpecies.push({
              id: crypto.randomUUID(),
              speciesId: speciesInfo.id,
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

        if (notFoundSpecies.length > 0) {
          toast.warning(`${notFoundSpecies.length} espèce(s) non trouvée(s): ${notFoundSpecies.join(", ")}`);
        }

        if (formattedSpecies.length === 0) {
          toast.error("Aucune espèce valide trouvée dans ce favori");
          return;
        }

        onTemplateSelect(formattedSpecies);

        // Increment usage count
        await supabase
          .from("fishermen_species_presets")
          .update({ usage_count: preset.usage_count + 1 })
          .eq("id", preset.id);

        toast.success("Favori chargé !");
      }
    } catch (error) {
      console.error("Error loading custom preset:", error);
      toast.error("Erreur lors du chargement du favori");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything if no presets
  if (loadingPresets) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Chargement de tes favoris...</span>
        </div>
      </div>
    );
  }

  if (customPresets.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-5 w-5 text-primary fill-primary" aria-hidden="true" />
        <h3 className="font-semibold">Mes favoris</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Tes combinaisons d'espèces sauvegardées
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
              {preset.species_data.length} espèces • {preset.usage_count} utilisations
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
