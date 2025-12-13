import { useMutation } from '@tanstack/react-query';
import { SmsMessage } from '@/types/sms-analytics';
import { exportToCSV } from '@/lib/sms-analytics';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to export SMS data to CSV
 */
export function useSmsExport() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ messages, filename }: { messages: SmsMessage[]; filename?: string }) => {
      try {
        const csv = exportToCSV(messages);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `sms-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return { success: true };
      } catch (error) {
        console.error('Error exporting SMS data:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: 'Export réussi',
        description: 'Les données SMS ont été exportées en CSV',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'export',
        description: error.message || 'Impossible d\'exporter les données',
        variant: 'destructive',
      });
    },
  });
}
