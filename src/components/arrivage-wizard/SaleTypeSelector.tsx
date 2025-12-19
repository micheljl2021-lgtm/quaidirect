import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Scale } from "lucide-react";

export type SaleType = "simple" | "detailed";

interface SaleTypeSelectorProps {
  onSelect: (type: SaleType) => void;
}

export function SaleTypeSelector({ onSelect }: SaleTypeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Quel type de vente ?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full h-auto py-6 px-4 justify-start hover:border-primary hover:bg-primary/5"
          onClick={() => onSelect("simple")}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">Vente sur point de vente</div>
              <p className="text-sm text-muted-foreground mt-1">
                Vente en vrac, poisson de roche, mélange... Pas besoin d'indiquer le poids ni le prix par espèce.
              </p>
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full h-auto py-6 px-4 justify-start hover:border-primary hover:bg-primary/5"
          onClick={() => onSelect("detailed")}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left flex-1">
              <div className="font-semibold text-lg">Vente à la pièce / au kg</div>
              <p className="text-sm text-muted-foreground mt-1">
                Indique le prix au kilo ou à la pièce pour chaque espèce. Idéal pour les clients qui veulent commander.
              </p>
            </div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
