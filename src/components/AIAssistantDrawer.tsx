import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType: 'fisherman' | 'premium' | 'admin';
}

interface UserContext {
  type: 'fisherman' | 'premium' | 'admin';
  // Fisherman data
  boatName?: string;
  companyName?: string;
  fishingMethods?: string[];
  fishingZones?: string[];
  mainFishingZone?: string;
  yearsExperience?: string;
  preferredSpecies?: string[];
  salePoints?: { label: string; address: string }[];
  city?: string;
  // Premium/User data
  userName?: string;
  followedPorts?: string[];
  followedSpecies?: string[];
  followedFishermen?: string[];
  userCity?: string;
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
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle keyboard visibility with VisualViewport API
  useEffect(() => {
    if (!open) return;
    
    const handleViewportResize = () => {
      if (window.visualViewport) {
        const offsetHeight = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(offsetHeight > 50 ? offsetHeight : 0);
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportResize);
    window.visualViewport?.addEventListener('scroll', handleViewportResize);
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportResize);
    };
  }, [open]);

  // Scroll to bottom when messages change or keyboard opens
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, keyboardHeight, scrollToBottom]);

  // Fetch user context when drawer opens
  useEffect(() => {
    if (open && user && !userContext) {
      fetchUserContext();
    }
  }, [open, user]);

  const fetchUserContext = async () => {
    if (!user) return;
    setContextLoading(true);

    try {
      const context: UserContext = { type: userType };

      if (userType === 'fisherman') {
        // Fetch fisherman data
        const { data: fisherman } = await supabase
          .from('fishermen')
          .select(`
            boat_name,
            company_name,
            fishing_methods,
            fishing_zones,
            main_fishing_zone,
            years_experience,
            city
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (fisherman) {
          context.boatName = fisherman.boat_name;
          context.companyName = fisherman.company_name || undefined;
          context.fishingMethods = fisherman.fishing_methods || [];
          context.fishingZones = fisherman.fishing_zones || [];
          context.mainFishingZone = fisherman.main_fishing_zone || undefined;
          context.yearsExperience = fisherman.years_experience || undefined;
          context.city = fisherman.city || undefined;

          // Fetch preferred species
          const { data: fishermanRecord } = await supabase
            .from('fishermen')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (fishermanRecord) {
            const { data: speciesData } = await supabase
              .from('fishermen_species')
              .select('species:species_id(name)')
              .eq('fisherman_id', fishermanRecord.id);

            if (speciesData) {
              context.preferredSpecies = speciesData
                .map((s: any) => s.species?.name)
                .filter(Boolean);
            }

            // Fetch sale points
            const { data: salePoints } = await supabase
              .from('fisherman_sale_points')
              .select('label, address')
              .eq('fisherman_id', fishermanRecord.id);

            if (salePoints) {
              context.salePoints = salePoints;
            }
          }
        }
      } else {
        // Fetch profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, city')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          context.userName = profile.full_name || undefined;
          context.userCity = profile.city || undefined;
        }

        // Fetch followed ports
        const { data: followedPorts } = await supabase
          .from('follow_ports')
          .select('ports:port_id(name, city)')
          .eq('user_id', user.id);

        if (followedPorts) {
          context.followedPorts = followedPorts
            .map((p: any) => `${p.ports?.name} (${p.ports?.city})`)
            .filter(Boolean);
        }

        // Fetch followed species
        const { data: followedSpecies } = await supabase
          .from('follow_species')
          .select('species:species_id(name)')
          .eq('user_id', user.id);

        if (followedSpecies) {
          context.followedSpecies = followedSpecies
            .map((s: any) => s.species?.name)
            .filter(Boolean);
        }

        // Fetch followed fishermen
        const { data: followedFishermen } = await supabase
          .from('fishermen_followers')
          .select('fishermen:fisherman_id(boat_name)')
          .eq('user_id', user.id);

        if (followedFishermen) {
          context.followedFishermen = followedFishermen
            .map((f: any) => f.fishermen?.boat_name)
            .filter(Boolean);
        }
      }

      setUserContext(context);
    } catch (error) {
      console.error('Error fetching user context:', error);
      setUserContext({ type: userType });
    } finally {
      setContextLoading(false);
    }
  };

  // Auto-scroll handled by scrollToBottom callback above

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
            userContext: userContext,
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

  const getContextSummary = () => {
    if (!userContext) return null;
    
    if (userContext.type === 'fisherman' && userContext.boatName) {
      return (
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-2">
          <span className="font-medium">{userContext.boatName}</span>
          {userContext.mainFishingZone && <span> • {userContext.mainFishingZone}</span>}
          {userContext.preferredSpecies && userContext.preferredSpecies.length > 0 && (
            <span> • {userContext.preferredSpecies.slice(0, 3).join(', ')}</span>
          )}
        </div>
      );
    }
    
    if (userContext.type === 'premium' || userContext.type === 'admin') {
      const info: string[] = [];
      if (userContext.userName) info.push(userContext.userName);
      if (userContext.userCity) info.push(userContext.userCity);
      if (userContext.followedSpecies && userContext.followedSpecies.length > 0) {
        info.push(`🐟 ${userContext.followedSpecies.slice(0, 2).join(', ')}`);
      }
      
      if (info.length > 0) {
        return (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-2">
            {info.join(' • ')}
          </div>
        );
      }
    }
    
    return null;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent 
        className="flex flex-col"
        style={{ 
          maxHeight: `calc(85dvh - ${keyboardHeight}px)`,
          paddingBottom: keyboardHeight > 0 ? 0 : undefined,
        }}
      >
        <DrawerHeader className="border-b pb-3 flex-shrink-0">
          <DrawerTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {userType === 'fisherman' ? 'IA du Marin' : 'Assistant QuaiDirect'}
          </DrawerTitle>
          {!contextLoading && getContextSummary()}
        </DrawerHeader>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Messages area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 keyboard-stable"
          >
            <div className="space-y-4 py-4">
              {contextLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Chargement de ton profil...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center space-y-4 py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    {userType === 'fisherman'
                      ? `Salut ${userContext?.boatName || 'Capitaine'} ! Pose-moi tes questions sur la météo, la pêche, tes arrivages...`
                      : `Bonjour${userContext?.userName ? ` ${userContext.userName}` : ''} ! Comment puis-je vous aider ?`}
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
                        'rounded-lg px-3 py-2 max-w-[80%] text-sm whitespace-pre-wrap',
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
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="border-t p-3 sm:p-4 flex gap-2 items-end bg-background flex-shrink-0 safe-bottom"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={scrollToBottom}
              placeholder="Écris ta question..."
              className="min-h-[44px] max-h-[100px] resize-none text-sm"
              rows={1}
              disabled={isLoading || contextLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading || contextLoading}
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
