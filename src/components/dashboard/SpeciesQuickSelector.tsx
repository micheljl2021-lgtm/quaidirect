import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Plus, X, Check, Fish, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

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

  // Filter species based on search
  const filteredSpecies = allSpecies.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mobile Drawer Content
  const MobileSpeciesSelector = () => (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="text-xl font-semibold flex items-center gap-2">
            <Fish className="h-5 w-5 text-primary" />
            Sélectionner les espèces
          </DrawerTitle>
          
          {/* Sticky search bar */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une espèce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Favorites/Presets section */}
          {presets.length > 0 && searchQuery === '' && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">⭐ Mes favoris</p>
              <div className="grid grid-cols-2 gap-2">
                {presets.slice(0, 6).map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    className="h-14 text-base justify-start gap-2 px-4"
                    onClick={() => {
                      handlePresetClick(preset);
                    }}
                  >
                    <span className="text-lg">{preset.icon || '🐟'}</span>
                    <span className="truncate">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* All species grid */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {searchQuery ? `Résultats (${filteredSpecies.length})` : 'Toutes les espèces'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {filteredSpecies.map((species) => {
                const isSelected = selectedIds.includes(species.id);
                return (
                  <Button
                    key={species.id}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "h-12 text-sm justify-start gap-2 px-3",
                      isSelected && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleSpeciesSelect(species)}
                  >
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
                      isSelected 
                        ? "border-primary-foreground bg-primary-foreground/20" 
                        : "border-muted-foreground/50"
                    )}>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                    </div>
                    <span className="truncate">{species.name}</span>
                  </Button>
                );
              })}
            </div>
            
            {filteredSpecies.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucune espèce trouvée
              </p>
            )}
          </div>
        </div>

        {/* Sticky footer with validation button */}
        <DrawerFooter className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} espèce{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
            </span>
            {selectedIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectionChange([])}
                className="text-destructive hover:text-destructive"
              >
                Tout effacer
              </Button>
            )}
          </div>
          <DrawerClose asChild>
            <Button size="lg" className="w-full h-14 text-lg font-semibold">
              <Check className="mr-2 h-5 w-5" />
              Valider ({selectedIds.length})
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );

  // Desktop Popover Content  
  const DesktopSpeciesSelector = () => (
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
  );

  return (
    <div className="space-y-3">
      {/* Presets (favorites) - Only show on desktop, mobile has them in drawer */}
      {!isMobile && presets.length > 0 && (
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
              className={cn(
                "gap-1.5 text-sm",
                isMobile ? "py-2 px-4 text-base" : "py-1.5 px-3"
              )}
            >
              <Fish className={cn("shrink-0", isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} aria-hidden="true" />
              {species.name}
              <button
                type="button"
                onClick={() => handleRemoveSpecies(species.id)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                aria-label={`Retirer ${species.name}`}
              >
                <X className={cn(isMobile ? "h-4 w-4" : "h-3 w-3")} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add species button */}
      <Button
        type="button"
        variant="outline"
        className={cn(
          "gap-2",
          isMobile ? "h-14 text-base w-full" : "h-9 text-sm"
        )}
        disabled={isLoading}
        onClick={() => isMobile && setOpen(true)}
      >
        <Plus className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} aria-hidden="true" />
        Ajouter une espèce
      </Button>

      {/* Render appropriate selector based on device */}
      {isMobile ? <MobileSpeciesSelector /> : <DesktopSpeciesSelector />}

      {/* Validation hint */}
      {selectedIds.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Sélectionnez au moins une espèce
        </p>
      )}
    </div>
  );
}
