import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpeciesChips } from "./SpeciesChips";
import { SpeciesTable } from "./SpeciesTable";
import { TemplatesRapides } from "./TemplatesRapides";
import { ArrivageSpecies } from "@/pages/CreateArrivageWizard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Step2Props {
  initialSpecies: ArrivageSpecies[];
  onComplete: (species: ArrivageSpecies[]) => void;
  onBack: () => void;
}

interface Species {
  id: string;
  name: string;
  indicative_price: number | null;
}

export function Step2EspecesQuantites({ initialSpecies, onComplete, onBack }: Step2Props) {
  const { user } = useAuth();
  const [selectedSpecies, setSelectedSpecies] = useState<ArrivageSpecies[]>(initialSpecies);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [suggestedSpecies, setSuggestedSpecies] = useState<Species[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSpecies, setFilteredSpecies] = useState<Species[]>([]);

  useEffect(() => {
    const fetchSpecies = async () => {
      if (!user) return;

      // Fetch fisherman's preferred species
      const { data: fishermanSpecies } = await supabase
        .from("fishermen_species")
        .select("species:species_id(id, name, indicative_price)")
        .eq("fisherman_id", (await supabase
          .from("fishermen")
          .select("id")
          .eq("user_id", user.id)
          .single()
        ).data?.id || "");

      // Fetch all species
      const { data: allSpeciesData } = await supabase
        .from("species")
        .select("id, name, indicative_price")
        .order("name");

      if (allSpeciesData) {
        setAllSpecies(allSpeciesData);
      }

      if (fishermanSpecies) {
        const preferred = fishermanSpecies.map((fs: any) => fs.species).filter(Boolean);
        setSuggestedSpecies(preferred.length > 0 ? preferred : (allSpeciesData?.slice(0, 10) || []));
      } else {
        setSuggestedSpecies(allSpeciesData?.slice(0, 10) || []);
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
    // Check if already added
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
          {/* Templates Rapides */}
          <TemplatesRapides onTemplateSelect={handleTemplateSelect} />

          {/* Espèces suggérées */}
          <div>
            <label className="block text-sm font-medium mb-3">Espèces suggérées</label>
            <SpeciesChips species={suggestedSpecies} onSpeciesClick={handleSpeciesClick} />
          </div>

          {/* Manual Search */}
          <div>
            <label className="block text-sm font-medium mb-3">Ajouter une espèce</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
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

          {/* Species Table */}
          {selectedSpecies.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-3">
                Espèces sélectionnées ({selectedSpecies.length})
              </label>
              <SpeciesTable species={selectedSpecies} onUpdate={handleUpdateSpecies} />
            </div>
          )}

          {selectedSpecies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Clique sur une espèce suggérée ou recherche-la pour commencer
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sticky Actions */}
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
