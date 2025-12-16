import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';

interface InstallButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export const InstallButton = ({ className, variant = 'default' }: InstallButtonProps) => {
  const { isInstallable, isInstalled } = usePWAInstall();
  const navigate = useNavigate();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <Button 
      onClick={() => navigate('/telecharger')}
      className={className}
      variant={variant}
    >
      <Download className="h-4 w-4 mr-2" />
      Installer l'app
    </Button>
  );
};
