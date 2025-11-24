import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AmbassadorBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AmbassadorBadge = ({ className = "", size = 'md' }: AmbassadorBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`
              gap-1.5
              bg-gradient-to-r from-amber-500 to-orange-500 
              text-white 
              border-0 
              shadow-md
              hover:from-amber-600 hover:to-orange-600
              transition-all
              font-semibold
              ${sizeClasses[size]}
              ${className}
            `}
          >
            <Award className={`${iconSizes[size]} animate-pulse`} />
            Ambassadeur Partenaire
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-sm">
            Ambassadeur fondateur de QuaiDirect. L'un des 10 premiers marins pêcheurs à nous rejoindre.
            Payé une fois et gratuit pour les années suivantes (suivant les conditions d'évolutions de la plateforme).
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AmbassadorBadge;
