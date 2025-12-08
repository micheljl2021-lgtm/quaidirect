import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContactSelector } from '@/components/ContactSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send } from 'lucide-react';

interface MessagingSectionProps {
  fishermanId: string;
}

const MessagingSection = ({ fishermanId }: MessagingSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageType, setMessageType] = useState<'invitation_initiale' | 'new_drop' | 'custom'>('invitation_initiale');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message_type: string; body: string; sent_to_group: string; contact_ids?: string[] }) => {
      const { data: result, error } = await supabase.functions.invoke('send-fisherman-message', {
        body: data
      });
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: 'Succès',
        description: `Message envoyé à ${data.recipient_count} contact(s)`,
      });
      setCustomMessage('');
      queryClient.invalidateQueries({ queryKey: ['fishermen-contacts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || "Erreur lors de l'envoi",
        variant: 'destructive',
      });
    }
  });

  const handleSendMessage = () => {
    if (messageType === 'custom' && !customMessage.trim()) {
      toast({
        title: 'Erreur',
        description: "Veuillez saisir un message",
        variant: 'destructive',
      });
      return;
    }

    if (selectedContacts.length === 0) {
      toast({
        title: 'Erreur',
        description: "Veuillez sélectionner au moins un contact",
        variant: 'destructive',
      });
      return;
    }

    const messageBody = messageType === 'custom' 
      ? customMessage 
      : messageType === 'invitation_initiale'
      ? "Bonjour, je suis maintenant sur QuaiDirect ! Retrouvez tous mes arrivages et points de vente sur ma page."
      : "Nouveau drop disponible ! Consultez les détails sur ma page QuaiDirect.";

    const contactIds = selectedContacts.map(c => c.id);

    sendMessageMutation.mutate({
      message_type: messageType,
      body: messageBody,
      sent_to_group: selectedGroup,
      contact_ids: contactIds
    });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" aria-hidden="true" />
          Envoyer un message groupé
        </CardTitle>
        <CardDescription>
          Contactez vos clients pour les inviter ou les informer de vos arrivages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Type de message</Label>
          <RadioGroup value={messageType} onValueChange={(v: any) => setMessageType(v)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="invitation_initiale" id="invitation_initiale" />
              <Label htmlFor="invitation_initiale" className="font-normal cursor-pointer">
                Message d'invitation - "Je rejoins QuaiDirect"
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new_drop" id="new_drop" />
              <Label htmlFor="new_drop" className="font-normal cursor-pointer">
                Annonce d'arrivage - "Nouveau drop disponible"
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="font-normal cursor-pointer">
                Message personnalisé
              </Label>
            </div>
          </RadioGroup>
        </div>

        {messageType === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="message">Votre message</Label>
            <Textarea
              id="message"
              placeholder="Rédigez votre message ici..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="group">Groupe de contacts</Label>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger id="group">
              <SelectValue placeholder="Sélectionner un groupe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous mes contacts</SelectItem>
              <SelectItem value="general">Groupe général</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {selectedContacts.length} contact(s) sélectionné(s)
          </p>
        </div>

        <ContactSelector
          fishermanId={fishermanId}
          selectedGroup={selectedGroup}
          onSelectedContactsChange={setSelectedContacts}
        />

        <Button 
          onClick={handleSendMessage} 
          disabled={sendMessageMutation.isPending || selectedContacts.length === 0}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" aria-hidden="true" />
          {sendMessageMutation.isPending ? 'Envoi en cours...' : `Envoyer à ${selectedContacts.length} contact(s)`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default MessagingSection;
