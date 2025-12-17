import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface LockedFeatureOverlayProps {
  title?: string;
  description?: string;
  requiredLevel?: string;
  children: React.ReactNode;
}

export default function LockedFeatureOverlay({
  title = "Fonctionnalité Premium+",
  description = "Passez à Premium+ pour débloquer cette fonctionnalité",
  requiredLevel = "Premium+",
  children
}: LockedFeatureOverlayProps) {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Content with blur/opacity */}
      <div className="opacity-40 pointer-events-none select-none blur-[1px]">
        {children}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <Button onClick={() => navigate('/premium')} className="gap-2">
            Passer à {requiredLevel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
