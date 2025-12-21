import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, X, Check, Fish } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    if (selectedIds.includes(species.id)) {
      onSelectionChange(selectedIds.filter(id => id !== species.id));
    } else {
      onSelectionChange([...selectedIds, species.id]);
    }
  };

  const handleRemoveSpecies = (speciesId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== speciesId));
  };

  return (
    <div className="space-y-3">
      {/* Presets (favorites) */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Mes favoris :</p>
          <div className="flex flex-wrap gap-2">
            {presets.slice(0, 6).map((preset) => (
              <Button
                key={preset.id}
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 h-9"
                onClick={() => handlePresetClick(preset)}
              >
                <span>{preset.icon || '🐟'}</span>
                <span>{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Selected species chips */}
      {selectedSpecies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSpecies.map((species) => (
            <Badge
              key={species.id}
              variant="secondary"
              className="gap-1.5 py-1.5 px-3 text-sm"
            >
              <Fish className="h-3.5 w-3.5" aria-hidden="true" />
              {species.name}
              <button
                type="button"
                onClick={() => handleRemoveSpecies(species.id)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                aria-label={`Retirer ${species.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add species button + combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter une espèce
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher une espèce..." />
            <CommandList>
              <CommandEmpty>Aucune espèce trouvée.</CommandEmpty>
              <CommandGroup>
                {allSpecies.map((species) => {
                  const isSelected = selectedIds.includes(species.id);
                  return (
                    <CommandItem
                      key={species.id}
                      value={species.name}
                      onSelect={() => handleSpeciesSelect(species)}
                      className="cursor-pointer"
                    >
                      <div className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <span>{species.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Validation hint */}
      {selectedIds.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sélectionnez au moins une espèce
        </p>
      )}
    </div>
  );
}
