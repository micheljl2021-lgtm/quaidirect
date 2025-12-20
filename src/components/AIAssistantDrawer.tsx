import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: 'fisherman' | 'premium' | 'admin';
}

const QUICK_PROMPTS = {
  fisherman: [
    { label: '🌊 Météo', prompt: 'Donne-moi un résumé météo pour sortir en mer aujourd\'hui' },
    { label: '📦 Arrivage', prompt: 'Aide-moi à créer une description pour mon arrivage' },
    { label: '💰 Prix', prompt: 'Conseils pour fixer mes prix de vente à quai' },
  ],
  premium: [
    { label: '🐟 Espèces', prompt: 'Quelles espèces sont de saison en ce moment ?' },
    { label: '🍳 Recette', prompt: 'Suggère-moi une recette simple pour du poisson frais' },
    { label: '📍 Ports', prompt: 'Quels sont les meilleurs ports pour acheter du poisson frais ?' },
  ],
  admin: [
    { label: '📊 Stats', prompt: 'Résume l\'activité de la plateforme' },
    { label: '🔧 Support', prompt: 'Comment gérer une demande de support pêcheur ?' },
    { label: '📝 Template', prompt: 'Génère un template d\'email pour les pêcheurs' },
  ],
};

export const AIAssistantDrawer = ({ open, onOpenChange, userType }: AIAssistantDrawerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marine-ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Limite atteinte. Patientez 1 minute.');
        }
        throw new Error('Erreur du serveur');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Pas de réponse');

      const decoder = new TextDecoder();

      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated[updated.length - 1]?.role === 'assistant') {
                    updated[updated.length - 1].content = assistantContent;
                  }
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [
        ...prev.filter(m => m.content !== ''),
        { role: 'assistant', content: `❌ ${error.message || 'Erreur de connexion'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const quickPrompts = QUICK_PROMPTS[userType] || QUICK_PROMPTS.premium;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] sm:max-h-[80vh]">
        <DrawerHeader className="border-b pb-3">
          <DrawerTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {userType === 'fisherman' ? 'IA du Marin' : 'Assistant QuaiDirect'}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col h-[calc(85vh-120px)] sm:h-[calc(80vh-140px)]">
          {/* Messages area */}
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.length === 0 ? (
                <div className="text-center space-y-4 py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {userType === 'fisherman'
                      ? 'Pose-moi tes questions sur la météo, la pêche, tes arrivages...'
                      : 'Comment puis-je vous aider ?'}
                  </p>
                  
                  {/* Quick prompts */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {quickPrompts.map((qp, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => sendMessage(qp.prompt)}
                        disabled={isLoading}
                      >
                        {qp.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex gap-3 items-start',
                      msg.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {msg.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 max-w-[80%] text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {msg.content || (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="border-t p-3 sm:p-4 flex gap-2 items-end bg-background"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écris ta question..."
              className="min-h-[44px] max-h-[120px] resize-none text-sm"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 h-11 w-11"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AIAssistantDrawer;
