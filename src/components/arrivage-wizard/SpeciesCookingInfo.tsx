import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface SpeciesCookingInfoProps {
  species: {
    name: string;
    cooking_plancha?: boolean | null;
    cooking_friture?: boolean | null;
    cooking_grill?: boolean | null;
    cooking_sushi_tartare?: boolean | null;
    cooking_vapeur?: boolean | null;
    cooking_four?: boolean | null;
    cooking_poele?: boolean | null;
    cooking_soupe?: boolean | null;
    cooking_bouillabaisse?: boolean | null;
    flavor?: string | null;
    bones_level?: string | null;
    budget?: string | null;
    cooking_tips?: string | null;
  };
  compact?: boolean;
}

const COOKING_ICONS: Record<string, { icon: string; label: string }> = {
  cooking_plancha: { icon: "🔥", label: "Plancha" },
  cooking_grill: { icon: "🍖", label: "Grillade" },
  cooking_poele: { icon: "🍳", label: "Poêle" },
  cooking_four: { icon: "🥘", label: "Four" },
  cooking_vapeur: { icon: "💨", label: "Vapeur" },
  cooking_friture: { icon: "🍟", label: "Friture" },
  cooking_soupe: { icon: "🥣", label: "Soupe" },
  cooking_bouillabaisse: { icon: "🐟", label: "Bouillabaisse" },
  cooking_sushi_tartare: { icon: "🍣", label: "Cru/Tartare" },
};

export function SpeciesCookingInfo({ species, compact = false }: SpeciesCookingInfoProps) {
  const cookingMethods = Object.entries(COOKING_ICONS)
    .filter(([key]) => species[key as keyof typeof species] === true)
    .map(([_, value]) => value);

  if (cookingMethods.length === 0 && !species.flavor && !species.bones_level) {
    return null;
  }

  const tooltipContent = (
    <div className="space-y-2 max-w-xs">
      {species.flavor && (
        <div className="text-xs">
          <span className="font-semibold">Saveur:</span> {species.flavor}
        </div>
      )}
      {species.bones_level && (
        <div className="text-xs">
          <span className="font-semibold">Arêtes:</span> {species.bones_level}
        </div>
      )}
      {species.budget && (
        <div className="text-xs">
          <span className="font-semibold">Budget:</span> {species.budget}
        </div>
      )}
      {cookingMethods.length > 0 && (
        <div className="text-xs">
          <span className="font-semibold">Cuisson:</span>{" "}
          {cookingMethods.map(m => m.label).join(", ")}
        </div>
      )}
      {species.cooking_tips && (
        <div className="text-xs mt-2 italic text-muted-foreground">
          💡 {species.cooking_tips}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs cursor-help">
              {cookingMethods.slice(0, 3).map(m => m.icon).join("")}
              {cookingMethods.length > 3 && "+"}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="p-3">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-wrap gap-1">
            {cookingMethods.slice(0, 4).map((method, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                {method.icon}
              </Badge>
            ))}
            {cookingMethods.length > 4 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{cookingMethods.length - 4}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function getCookingMethodsArray(species: SpeciesCookingInfoProps["species"]): string[] {
  return Object.entries(COOKING_ICONS)
    .filter(([key]) => species[key as keyof typeof species] === true)
    .map(([_, value]) => value.label);
}
