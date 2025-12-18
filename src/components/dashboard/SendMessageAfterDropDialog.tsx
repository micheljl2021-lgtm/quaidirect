import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare, ArrowRight, X } from 'lucide-react';

interface SendMessageAfterDropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dropId: string;
  dropLocation: string;
  dropTime: string;
}

export function SendMessageAfterDropDialog({
  open,
  onOpenChange,
  dropId,
  dropLocation,
  dropTime,
}: SendMessageAfterDropDialogProps) {
  const navigate = useNavigate();

  const handleSendMessage = () => {
    // Navigate to dashboard with drop ID in state to pre-select it
    navigate('/dashboard/pecheur', { 
      state: { 
        scrollToMessaging: true, 
        selectedDropId: dropId 
      } 
    });
    onOpenChange(false);
  };

  const handleSkip = () => {
    navigate('/dashboard/pecheur');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Arrivage publié !
          </DialogTitle>
          <DialogDescription className="pt-2">
            Ton arrivage à <strong>{dropLocation}</strong> ({dropTime}) est maintenant en ligne.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Veux-tu prévenir tes clients par email ou SMS ?
          </p>
          
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-lg border bg-muted/50 text-center">
              <Mail className="h-6 w-6 mx-auto mb-1 text-primary" />
              <span className="text-xs">Email</span>
            </div>
            <div className="flex-1 p-3 rounded-lg border bg-muted/50 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-1 text-primary" />
              <span className="text-xs">SMS</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            Plus tard
          </Button>
          <Button onClick={handleSendMessage} className="w-full sm:w-auto">
            <ArrowRight className="h-4 w-4 mr-2" />
            Envoyer un message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
