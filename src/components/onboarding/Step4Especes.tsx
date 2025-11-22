import { Fish, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface Step4EspecesProps {
  formData: {
    selectedSpecies: string[];
  };
  onChange: (field: string, value: any) => void;
}

export function Step4Especes({ formData, onChange }: Step4EspecesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [customSpecies, setCustomSpecies] = useState("");

  const { data: species = [] } = useQuery({
    queryKey: ['species'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('species')
        .select('id, name, scientific_name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const filteredSpecies = species.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.scientific_name && s.scientific_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Fish className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Espèces pêchées</h2>
        <p className="text-muted-foreground">Sélectionnez les poissons et crustacés que vous pêchez</p>
      </div>

      {/* Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tapez le nom d'un poisson..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Alert Box */}
      <Alert className="bg-orange-50 border-orange-200">
        <div className="flex gap-2">
          <span className="text-xl">⚠️</span>
          <AlertDescription>
            Sélectionnez toutes les espèces que vous pêchez régulièrement. Les clients pourront voir votre diversité de production.
          </AlertDescription>
        </div>
      </Alert>

      {/* Species Grid */}
      <div className="space-y-3">
        <Label>Espèces disponibles</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
          {filteredSpecies.map((s) => (
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
          ))}
        </div>
      </div>

      {/* Add Custom Species */}
      <div className="space-y-2">
        <Label htmlFor="customSpecies">Autre espèce non listée</Label>
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
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Selected Count */}
      {formData.selectedSpecies?.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {formData.selectedSpecies.length} espèce{formData.selectedSpecies.length > 1 ? 's' : ''} sélectionnée{formData.selectedSpecies.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}