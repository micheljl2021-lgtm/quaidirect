import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Species {
  id: string;
  name: string;
  indicative_price: number | null;
}

interface SpeciesChipsProps {
  species: Species[];
  onSpeciesClick: (species: Species) => void;
}

export function SpeciesChips({ species, onSpeciesClick }: SpeciesChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {species.map((s) => (
        <Button
          key={s.id}
          type="button"
          variant="outline"
          size="lg"
          className="h-12 px-4"
          onClick={() => onSpeciesClick(s)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {s.name}
          {s.indicative_price && (
            <span className="ml-2 text-xs text-muted-foreground">
              ~{s.indicative_price}€
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
