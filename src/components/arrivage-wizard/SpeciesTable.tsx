import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrivageSpecies } from "@/pages/CreateArrivageWizard";
import { Trash2, Copy } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpeciesTableProps {
  species: ArrivageSpecies[];
  onUpdate: (species: ArrivageSpecies[]) => void;
}

export function SpeciesTable({ species, onUpdate }: SpeciesTableProps) {
  const handleUpdate = (id: string, field: keyof ArrivageSpecies, value: any) => {
    const updated = species.map((s) =>
      s.id === id ? { ...s, [field]: value } : s
    );
    onUpdate(updated);
  };

  const handleDelete = (id: string) => {
    const updated = species.filter((s) => s.id !== id);
    onUpdate(updated);
  };

  const handleDuplicate = (id: string) => {
    const toDuplicate = species.find((s) => s.id === id);
    if (toDuplicate) {
      const duplicated = { ...toDuplicate, id: crypto.randomUUID() };
      onUpdate([...species, duplicated]);
    }
  };

  return (
    <div className="space-y-3">
      {species.map((s) => (
        <div key={s.id} className="border rounded-lg p-4 space-y-3 bg-card">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-lg">{s.speciesName}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDuplicate(s.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(s.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Quantité
              </label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={s.quantity}
                onChange={(e) =>
                  handleUpdate(s.id, "quantity", parseFloat(e.target.value) || 0)
                }
                className="h-12"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Unité
              </label>
              <Select
                value={s.unit}
                onValueChange={(value: "kg" | "pieces") =>
                  handleUpdate(s.id, "unit", value)
                }
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="pieces">pièces</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Prix (€/{s.unit})
              </label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={s.price}
                onChange={(e) =>
                  handleUpdate(s.id, "price", parseFloat(e.target.value) || 0)
                }
                className="h-12"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Remarque (optionnel)
            </label>
            <Textarea
              placeholder="Ex: calibre, taille, mode de pêche..."
              value={s.remark || ""}
              onChange={(e) => handleUpdate(s.id, "remark", e.target.value)}
              rows={2}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
