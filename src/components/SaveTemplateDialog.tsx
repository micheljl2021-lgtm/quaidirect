import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SaveTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  arrivageData: any;
  fishermanId: string;
}

const ICON_OPTIONS = ["⭐", "🐟", "🦐", "🦞", "🐙", "🦑", "🦀", "🐠", "🎣", "⚓"];

export function SaveTemplateDialog({ open, onOpenChange, arrivageData, fishermanId }: SaveTemplateDialogProps) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("⭐");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Donne un nom à ton modèle");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        portId: arrivageData.portId,
        portName: arrivageData.portName,
        timeSlot: arrivageData.timeSlot,
        species: arrivageData.species,
      };

      const { error } = await supabase
        .from("drop_templates")
        .insert({
          fisherman_id: fishermanId,
          name: name.trim(),
          icon: selectedIcon,
          payload,
          usage_count: 0,
        });

      if (error) throw error;

      toast.success("Modèle enregistré !");
      onOpenChange(false);
      setName("");
      setSelectedIcon("⭐");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enregistrer comme modèle</DialogTitle>
          <DialogDescription>
            Ce modèle te permettra de créer rapidement des arrivages similaires.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nom du modèle</Label>
            <Input
              id="template-name"
              placeholder="Ex: Mix grillade, Poisson blanc..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>Icône</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <Button
                  key={icon}
                  type="button"
                  variant={selectedIcon === icon ? "default" : "outline"}
                  size="sm"
                  className="text-xl h-10 w-10 p-0"
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Ce qui sera sauvegardé :</strong>
              <br />• Port : {arrivageData.portName}
              <br />• Créneau : {arrivageData.timeSlot}
              <br />• {arrivageData.species?.length || 0} espèces avec quantités et prix
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
