import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useSmsExport } from '@/hooks/useSmsExport';
import { SmsMessage } from '@/types/sms-analytics';

interface SmsExportButtonProps {
  messages: SmsMessage[];
  disabled?: boolean;
}

export function SmsExportButton({ messages, disabled }: SmsExportButtonProps) {
  const exportMutation = useSmsExport();

  const handleExportCSV = () => {
    if (messages.length === 0) {
      return;
    }
    exportMutation.mutate({ messages });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || messages.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV} disabled={exportMutation.isPending}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <FileText className="h-4 w-4 mr-2" />
          Export PDF (bientôt disponible)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
