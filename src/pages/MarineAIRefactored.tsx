import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Loader2, MessageSquare, Waves, Wrench, TrendingUp, Shield, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QUICK_PROMPTS, type AICategory } from '@/lib/marinAI';

type Message = { role: 'user' | 'assistant'; content: string };

const CATEGORIES = [
  { value: 'clientele' as AICategory, label: 'Clientèle & messages', icon: MessageSquare, color: 'text-blue-600' },
  { value: 'peche' as AICategory, label: 'Pêche & météo', icon: Waves, color: 'text-cyan-600' },
  { value: 'bateau' as AICategory, label: 'Bateau & maintenance', icon: Wrench, color: 'text-orange-600' },
  { value: 'business' as AICategory, label: 'Business & organisation', icon: TrendingUp, color: 'text-green-600' },
];

export default function MarineAIRefactored() {
  const { user, isVerifiedFisherman } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<AICategory>('clientele');
  const [messages, setMessages] = useState<Record<AICategory, Message[]>>({
    clientele: [],
    peche: [],
    bateau: [],
    business: [],
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !isVerifiedFisherman) {
      navigate('/pecheur/dashboard');
    }
  }, [user, isVerifiedFisherman, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeCategory]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: messageText };
    setMessages(prev => ({
      ...prev,
      [activeCategory]: [...prev[activeCategory], userMsg],
    }));
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marine-ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            messages: [...messages[activeCategory], userMsg],
            category: activeCategory,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const categoryMessages = prev[activeCategory];
                const last = categoryMessages[categoryMessages.length - 1];
                if (last?.role === 'assistant') {
                  return {
                    ...prev,
                    [activeCategory]: categoryMessages.map((m, i) => 
                      i === categoryMessages.length - 1 ? { ...m, content: assistantContent } : m
                    ),
                  };
                }
                return {
                  ...prev,
                  [activeCategory]: [...categoryMessages, { role: 'assistant', content: assistantContent }],
                };
              });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de contacter l\'IA',
        variant: 'destructive',
      });
      setMessages(prev => ({
        ...prev,
        [activeCategory]: prev[activeCategory].slice(0, -1),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const currentMessages = messages[activeCategory];
  const currentQuickPrompts = QUICK_PROMPTS[activeCategory];
  const currentCategoryInfo = CATEGORIES.find(c => c.value === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8 max-w-6xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard/pecheur')} 
          className="mb-6 gap-2"
          aria-label="Retour au dashboard pêcheur"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Retour au dashboard
        </Button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
              <Bot className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">IA du Marin</h1>
            <Badge className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              Assistant IA
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Ton copilote pour gérer ta pêche, ton bateau, tes clients et ton temps
          </p>
        </div>

        {/* Tabs for categories */}
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as AICategory)}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            {CATEGORIES.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
                <cat.icon className={`h-4 w-4 ${cat.color}`} />
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map(cat => (
            <TabsContent key={cat.value} value={cat.value} className="space-y-6">
              {/* Quick Actions */}
              {currentMessages.length === 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions rapides</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {currentQuickPrompts.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-2 text-left justify-start items-start"
                        onClick={() => sendMessage(action.prompt)}
                        disabled={isLoading}
                      >
                        <span className="text-2xl">{action.icon}</span>
                        <span className="text-sm font-medium">{action.label}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">{action.prompt}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              <Card className="min-h-[400px] max-h-[600px] flex flex-col">
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      {currentCategoryInfo && <currentCategoryInfo.icon className={`h-16 w-16 mb-4 ${currentCategoryInfo.color}`} />}
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {cat.label}
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        {cat.value === 'clientele' && "Aide à la rédaction de messages pour tes clients, posts réseaux sociaux et réponses aux questions fréquentes."}
                        {cat.value === 'peche' && "Conseils sur la météo marine, les meilleurs créneaux de pêche et le choix des zones."}
                        {cat.value === 'bateau' && "Checklists de préparation, planification de maintenance et aide au carnet de bord."}
                        {cat.value === 'business' && "Organisation du temps, estimation des revenus et préparation de récaps administratifs."}
                      </p>
                    </div>
                  ) : (
                    currentMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Input */}
        <div className="flex gap-3 mt-6">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Pose ta question... (Entrée pour envoyer, Shift+Entrée pour nouvelle ligne)"
            className="resize-none"
            rows={3}
            disabled={isLoading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            size="lg"
            className="gap-2"
            aria-label="Envoyer le message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Info Banner */}
        <Card className="mt-6 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-purple-800 dark:text-purple-200">
                <p className="font-medium mb-1">Assistant IA sécurisé</p>
                <p>
                  Tes conversations sont privées et sécurisées. L'IA est spécialisée dans 
                  l'aide aux marins-pêcheurs artisanaux français.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
