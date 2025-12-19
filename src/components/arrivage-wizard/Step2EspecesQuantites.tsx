import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpeciesChips } from "./SpeciesChips";
import { SpeciesTable } from "./SpeciesTable";
import { TemplatesRapides } from "./TemplatesRapides";
import { SavePresetDialog } from "./SavePresetDialog";
import { ArrivageSpecies } from "@/pages/CreateArrivageWizard";
import { Input } from "@/components/ui/input";
import { Search, Star, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SaleType } from "./SaleTypeSelector";

interface Step2Props {
  initialSpecies: ArrivageSpecies[];
  onComplete: (species: ArrivageSpecies[]) => void;
  onBack: () => void;
  saleType: SaleType;
}

interface Species {
  id: string;
  name: string;
  indicative_price: number | null;
}

export function Step2EspecesQuantites({ initialSpecies, onComplete, onBack, saleType }: Step2Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSpecies, setSelectedSpecies] = useState<ArrivageSpecies[]>(initialSpecies);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [suggestedSpecies, setSuggestedSpecies] = useState<Species[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSpecies, setFilteredSpecies] = useState<Species[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSpecies = async () => {
      if (!user) return;

      const { data: fishermanData } = await supabase
        .from("fishermen")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!fishermanData) return;

      const { data: speciesData } = await supabase
        .from("species")
        .select("id, name, indicative_price")
        .order("name");

      if (speciesData) {
        setAllSpecies(speciesData);
        setFilteredSpecies(speciesData);
      }

      // Fetch preferred species from fishermen_species table (priority over history)
      const { data: fishermenSpecies } = await supabase
        .from("fishermen_species")
        .select("species_id, is_primary, species:species_id(id, name, indicative_price)")
        .eq("fisherman_id", fishermanData.id)
        .order("is_primary", { ascending: false });

      if (fishermenSpecies && fishermenSpecies.length > 0) {
        const preferred = fishermenSpecies
          .filter((fs: any) => fs.species)
          .map((fs: any) => ({
            id: fs.species.id,
            name: fs.species.name,
            indicative_price: fs.species.indicative_price,
            is_primary: fs.is_primary
          }));
        
        if (preferred.length > 0) {
          setSuggestedSpecies(preferred.slice(0, 8));
          return; // Use preferred species instead of history
        }
      }

      // Fallback: use history-based suggestions
      const { data: dropsData } = await supabase
        .from("drops")
        .select("id")
        .eq("fisherman_id", fishermanData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (dropsData && dropsData.length > 0) {
        const dropIds = dropsData.map(d => d.id);
        
        const { data: historyData } = await supabase
          .from("offers")
          .select("species_id, species(id, name, indicative_price)")
          .in("drop_id", dropIds);

        if (historyData) {
          const speciesCount: Record<string, { species: any; count: number }> = {};
          
          historyData.forEach((offer: any) => {
            if (offer.species) {
              const id = offer.species.id;
              if (!speciesCount[id]) {
                speciesCount[id] = { species: offer.species, count: 0 };
              }
              speciesCount[id].count++;
            }
          });

          const suggested = Object.values(speciesCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 6)
            .map(item => item.species);

          if (suggested.length > 0) {
            setSuggestedSpecies(suggested);
          } else {
            setSuggestedSpecies(speciesData?.slice(0, 6) || []);
          }
        }
      } else {
        setSuggestedSpecies(speciesData?.slice(0, 6) || []);
      }
    };

    fetchSpecies();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allSpecies.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSpecies(filtered);
    } else {
      setFilteredSpecies([]);
    }
  }, [searchQuery, allSpecies]);

  const handleSpeciesClick = (species: Species) => {
    const exists = selectedSpecies.find((s) => s.speciesId === species.id);
    if (exists) return;

    const newSpecies: ArrivageSpecies = {
      id: crypto.randomUUID(),
      speciesId: species.id,
      speciesName: species.name,
      quantity: 1,
      unit: "kg",
      price: species.indicative_price || 15,
      remark: "",
    };

    setSelectedSpecies([...selectedSpecies, newSpecies]);
    setSearchQuery("");
  };

  const handleTemplateSelect = (template: ArrivageSpecies[]) => {
    setSelectedSpecies(template);
  };

  const handleUpdateSpecies = (updatedSpecies: ArrivageSpecies[]) => {
    setSelectedSpecies(updatedSpecies);
  };

  const handleSavePreset = async (name: string, icon: string) => {
    if (!user) return;

    const { data: fishermanData } = await supabase
      .from("fishermen")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!fishermanData) return;

    // IMPORTANT: Include speciesId for proper UUID handling when loading presets
    const speciesData = selectedSpecies.map((s) => ({
      speciesId: s.speciesId, // Critical: include UUID for future loading
      speciesName: s.speciesName,
      quantity: s.quantity,
      unit: s.unit,
      price: s.price,
    }));

    const { error } = await supabase
      .from("fishermen_species_presets")
      .insert({
        fisherman_id: fishermanData.id,
        name,
        icon,
        species_data: speciesData,
      });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le favori",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Favori sauvegardé",
        description: `"${name}" est maintenant disponible dans tes templates`,
      });
    }
  };

  const handleContinue = () => {
    if (selectedSpecies.length === 0) return;
    onComplete(selectedSpecies);
  };

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Qu'est-ce que tu débarques ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <TemplatesRapides onTemplateSelect={handleTemplateSelect} />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <label className="block text-sm font-medium">Mes espèces habituelles</label>
            </div>
            <SpeciesChips species={suggestedSpecies} onSpeciesClick={handleSpeciesClick} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Ajouter une espèce</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Tape le nom de l'espèce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            {filteredSpecies.length > 0 && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {filteredSpecies.map((species) => (
                  <button
                    key={species.id}
                    type="button"
                    onClick={() => handleSpeciesClick(species)}
                    className="w-full text-left px-4 py-2 hover:bg-accent transition-colors"
                  >
                    {species.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedSpecies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium">
                  Espèces sélectionnées ({selectedSpecies.length})
                </label>
                {saleType === "detailed" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSaveDialogOpen(true)}
                  >
                    <Star className="h-4 w-4 mr-2" aria-hidden="true" />
                    Sauvegarder ce favori
                  </Button>
                )}
              </div>
              
              {saleType === "detailed" ? (
                <SpeciesTable species={selectedSpecies} onUpdate={handleUpdateSpecies} />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSpecies.map((species) => (
                    <Badge
                      key={species.id}
                      variant="default"
                      className="cursor-pointer py-2 px-3 text-sm"
                      onClick={() => {
                        setSelectedSpecies(selectedSpecies.filter((s) => s.id !== species.id));
                      }}
                    >
                      {species.speciesName}
                      <X className="h-3 w-3 ml-2" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSpecies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Clique sur une espèce suggérée ou recherche-la pour commencer
            </div>
          )}
        </CardContent>
      </Card>

      <SavePresetDialog
        species={selectedSpecies}
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSavePreset}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-lg z-50">
        <div className="container max-w-4xl mx-auto flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 h-14"
            onClick={onBack}
          >
            Retour à l'étape 1
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1 h-14 text-lg"
            onClick={handleContinue}
            disabled={selectedSpecies.length === 0}
          >
            Continuer (Récapitulatif)
          </Button>
        </div>
      </div>
    </div>
  );
}
