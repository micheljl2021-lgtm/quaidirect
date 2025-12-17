import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const BADGE_COLORS = [
  { id: 'or', label: 'Or', color: 'bg-yellow-500', ring: 'ring-yellow-500' },
  { id: 'argent', label: 'Argent', color: 'bg-gray-400', ring: 'ring-gray-400' },
  { id: 'bronze', label: 'Bronze', color: 'bg-amber-700', ring: 'ring-amber-700' },
  { id: 'rose', label: 'Rose', color: 'bg-pink-500', ring: 'ring-pink-500' },
  { id: 'bleu', label: 'Bleu', color: 'bg-blue-500', ring: 'ring-blue-500' },
  { id: 'vert', label: 'Vert', color: 'bg-green-500', ring: 'ring-green-500' },
];

interface ColorPickerBadgeProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

export default function ColorPickerBadge({ 
  selectedColor, 
  onColorChange, 
  disabled = false 
}: ColorPickerBadgeProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {BADGE_COLORS.map((badge) => (
          <button
            key={badge.id}
            type="button"
            disabled={disabled}
            onClick={() => onColorChange(badge.id)}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              badge.color,
              selectedColor === badge.id && `ring-2 ring-offset-2 ${badge.ring}`,
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            title={badge.label}
          >
            {selectedColor === badge.id && (
              <Check className="h-5 w-5 text-white drop-shadow" />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Couleur sélectionnée : {BADGE_COLORS.find(b => b.id === selectedColor)?.label || 'Or'}
      </p>
    </div>
  );
}

export { BADGE_COLORS };
