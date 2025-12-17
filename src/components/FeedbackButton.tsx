import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from './FeedbackModal';

export const FeedbackButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
        onClick={() => setOpen(true)}
        aria-label="Signaler un bug ou une idée"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FeedbackButton;
