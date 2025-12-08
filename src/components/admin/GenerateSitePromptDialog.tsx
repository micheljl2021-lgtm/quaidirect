import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GenerateSitePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: string;
  metadata?: {
    boatName: string;
    fishermanName: string;
    fishingType: string;
    port: string;
  };
  isLoading?: boolean;
}

export function GenerateSitePromptDialog({
  open,
  onOpenChange,
  prompt,
  metadata,
  isLoading = false
}: GenerateSitePromptDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast({
        title: "Prompt copié",
        description: "Le prompt est prêt à être collé dans Lovable",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le prompt",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Prompt Lovable généré</DialogTitle>
          {metadata && (
            <p className="text-sm text-muted-foreground">
              {metadata.boatName} - {metadata.fishermanName} ({metadata.fishingType}) - Port de {metadata.port}
            </p>
          )}
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <span className="ml-3">Génération du prompt en cours...</span>
          </div>
        ) : (
          <>
            <Textarea
              value={prompt}
              readOnly
              className="min-h-[400px] font-mono text-sm"
            />
            
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-muted-foreground">
                Copiez ce prompt et collez-le dans un nouveau projet Lovable
              </p>
              <Button onClick={handleCopy} disabled={copied}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                    Copier le prompt
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
