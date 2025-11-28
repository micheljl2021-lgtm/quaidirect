import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrivageSpecies } from "@/pages/CreateArrivageWizard";

interface SavePresetDialogProps {
  species: ArrivageSpecies[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, icon: string) => void;
}

const ICONS = ["⭐", "🔥", "🐟", "🦐", "🦞", "🐙", "🦑", "🦀", "🐚", "⚓"];

export function SavePresetDialog({ species, open, onOpenChange, onSave }: SavePresetDialogProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("⭐");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), selectedIcon);
    setName("");
    setSelectedIcon("⭐");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sauvegarder ce favori</DialogTitle>
          <DialogDescription>
            Enregistre cette combinaison d'espèces pour la réutiliser rapidement
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="preset-name">Nom du favori</Label>
            <Input
              id="preset-name"
              placeholder="Ex: Mon mix habituel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="grid grid-cols-5 gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    text-2xl p-3 rounded-md border-2 transition-all
                    ${selectedIcon === icon 
                      ? "border-primary bg-primary/10 scale-110" 
                      : "border-border hover:border-primary/50"}
                  `}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Aperçu :</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedIcon}</span>
              <span className="font-medium">{name || "Nom du favori"}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {species.length} espèces : {species.map(s => s.speciesName).join(", ")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
