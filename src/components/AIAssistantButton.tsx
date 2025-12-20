import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { useAuth } from '@/hooks/useAuth';

export const AIAssistantButton = () => {
  const [open, setOpen] = useState(false);
  const { user, userRole } = useAuth();

  // Only show for premium, fisherman, or admin users
  const canAccessAI = user && (userRole === 'premium' || userRole === 'fisherman' || userRole === 'admin');

  if (!canAccessAI) {
    return null;
  }

  const userType = userRole as 'fisherman' | 'premium' | 'admin';

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 rounded-full shadow-lg z-40 bg-gradient-ocean hover:opacity-90 h-12 w-12 sm:h-12 sm:w-12"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir l'assistant IA"
      >
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      <AIAssistantDrawer open={open} onOpenChange={setOpen} userType={userType} />
    </>
  );
};

export default AIAssistantButton;
