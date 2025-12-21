import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Fish, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Species {
  id: string;
  name: string;
}

interface SpeciesQuickSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  presets?: Array<{
    id: string;
    name: string;
    icon: string | null;
    species_data: any;
  }>;
}

export function SpeciesQuickSelector({ 
  selectedIds, 
  onSelectionChange,
  presets = [],
}: SpeciesQuickSelectorProps) {
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSpecies = async () => {
      const { data } = await supabase
        .from('species')
        .select('id, name')
        .order('name');
      
      if (data) {
        setAllSpecies(data);
      }
      setIsLoading(false);
    };
    fetchSpecies();
  }, []);

  // Sync selected species names when IDs change
  useEffect(() => {
    const selected = allSpecies.filter(s => selectedIds.includes(s.id));
    setSelectedSpecies(selected);
  }, [selectedIds, allSpecies]);

  const handlePresetClick = (preset: any) => {
    if (!preset.species_data || !Array.isArray(preset.species_data)) return;
    
    const presetSpeciesIds = preset.species_data
      .map((s: any) => s.speciesId)
      .filter(Boolean);
    
    // Add preset species to selection (avoid duplicates)
    const newIds = [...new Set([...selectedIds, ...presetSpeciesIds])];
    onSelectionChange(newIds);
  };

  const handleSpeciesSelect = (species: Species) => {
    if (selectedIds.includes(species.id)) return;
    onSelectionChange([...selectedIds, species.id]);
    setSearchQuery('');
  };

  const handleRemoveSpecies = (speciesId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== speciesId));
  };

  // Filter species based on search (only show when there's a query)
  const filteredSpecies = searchQuery.trim()
    ? allSpecies.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedIds.includes(s.id)
      )
    : [];

  // Available species for dropdown (not already selected)
  const availableSpecies = allSpecies.filter(s => !selectedIds.includes(s.id));

  return (
    <div className="space-y-4">
      {/* Favorites/Presets section */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <p className="text-sm font-medium">Mes favoris</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.slice(0, 6).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium"
              >
                <span>{preset.icon || '🐟'}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected species chips */}
      {selectedSpecies.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Espèces sélectionnées ({selectedSpecies.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSpecies.map((species) => (
              <Badge
                key={species.id}
                variant="secondary"
                className="gap-1.5 py-2 px-4 text-base"
              >
                <Fish className="h-4 w-4 shrink-0" aria-hidden="true" />
                {species.name}
                <button
                  type="button"
                  onClick={() => handleRemoveSpecies(species.id)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  aria-label={`Retirer ${species.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Species selection - Same style as Step2EspecesQuantites */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Ajouter une espèce</p>
        
        {/* Dropdown Select */}
        <Select
          value=""
          onValueChange={(value) => {
            const species = allSpecies.find(s => s.id === value);
            if (species) {
              handleSpeciesSelect(species);
            }
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="h-12 text-base bg-background">
            <SelectValue placeholder="Sélectionner une espèce..." />
          </SelectTrigger>
          <SelectContent className="max-h-64 bg-popover z-50">
            {availableSpecies.map((species) => (
              <SelectItem key={species.id} value={species.id}>
                {species.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search bar */}
        <div className="relative">
          <Search 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" 
            aria-hidden="true" 
          />
          <Input
            type="text"
            placeholder="Ou rechercher par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filtered results list */}
        {filteredSpecies.length > 0 && (
          <div className="border rounded-md max-h-48 overflow-y-auto bg-background">
            {filteredSpecies.map((species) => (
              <button
                key={species.id}
                type="button"
                onClick={() => handleSpeciesSelect(species)}
                className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-2 border-b last:border-b-0"
              >
                <Fish className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{species.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {searchQuery.trim() && filteredSpecies.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Aucune espèce trouvée pour "{searchQuery}"
          </p>
        )}
      </div>

      {/* Validation hint */}
      {selectedIds.length === 0 && !searchQuery && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Sélectionnez une espèce dans le menu ou recherchez-la
        </p>
      )}
    </div>
  );
}
