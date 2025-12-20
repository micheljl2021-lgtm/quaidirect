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
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90 h-10 w-10 sm:h-10 sm:w-10"
        onClick={() => setOpen(true)}
        aria-label="Signaler un bug ou une idée"
      >
        <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FeedbackButton;
