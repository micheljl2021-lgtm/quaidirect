import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye } from 'lucide-react';
import { AdminRoleSwitcher } from './AdminRoleSwitcher';

interface TestModeBannerProps {
  roleLabel: string;
}

export function TestModeBanner({ roleLabel }: TestModeBannerProps) {
  return (
    <Alert className="mb-6 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 font-medium">
            Mode Test Admin : Vous visualisez le dashboard <strong>{roleLabel}</strong>
          </AlertDescription>
        </div>
        <AdminRoleSwitcher />
      </div>
    </Alert>
  );
}
