import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ContactSelector } from '@/components/ContactSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, MessageSquare, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface MessagingSectionProps {
  fishermanId: string;
}

type Channel = 'email' | 'sms' | 'both';

const MessagingSection = ({ fishermanId }: MessagingSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageType, setMessageType] = useState<'invitation_initiale' | 'new_drop' | 'custom'>('invitation_initiale');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [channel, setChannel] = useState<Channel>('email');

  // Fetch SMS quota
  const { data: smsQuota, isLoading: quotaLoading } = useQuery({
    queryKey: ['sms-quota'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-sms-quota');
      if (error) throw error;
      return data as {
        free_remaining: number;
        paid_balance: number;
        total_available: number;
        free_quota: number;
        free_used: number;
      };
    },
  });

  // Count contacts with phone vs email
  const contactsWithEmail = selectedContacts.filter(c => c.email).length;
  const contactsWithPhone = selectedContacts.filter(c => c.phone).length;

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { message_type: string; body: string; sent_to_group: string; contact_ids?: string[]; channel: Channel }) => {
      const { data: result, error } = await supabase.functions.invoke('send-fisherman-message', {
        body: data
      });
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      const channelLabel = channel === 'both' ? 'emails et SMS' : channel === 'sms' ? 'SMS' : 'emails';
      toast({
        title: 'Succès',
        description: `${data.email_count || 0} email(s) et ${data.sms_count || 0} SMS envoyé(s)`,
      });
      setCustomMessage('');
      queryClient.invalidateQueries({ queryKey: ['fishermen-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['sms-quota'] });
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

    // Check SMS quota if sending SMS
    if ((channel === 'sms' || channel === 'both') && smsQuota) {
      if (contactsWithPhone > smsQuota.total_available) {
        toast({
          title: 'Quota SMS insuffisant',
          description: `${contactsWithPhone} SMS requis, ${smsQuota.total_available} disponibles. Achetez un pack SMS ou réduisez la sélection.`,
          variant: 'destructive',
        });
        return;
      }
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
      contact_ids: contactIds,
      channel,
    });
  };

  // Calculate if SMS quota is low
  const isQuotaLow = smsQuota && smsQuota.total_available < 10;
  const isQuotaInsufficient = smsQuota && (channel === 'sms' || channel === 'both') && contactsWithPhone > smsQuota.total_available;

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
        {/* Canal de communication */}
        <div className="space-y-2">
          <Label>Canal d'envoi</Label>
          <RadioGroup value={channel} onValueChange={(v: Channel) => setChannel(v)} className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="channel-email" />
              <Label htmlFor="channel-email" className="font-normal cursor-pointer flex items-center gap-1">
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email uniquement
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sms" id="channel-sms" />
              <Label htmlFor="channel-sms" className="font-normal cursor-pointer flex items-center gap-1">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                SMS uniquement
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="channel-both" />
              <Label htmlFor="channel-both" className="font-normal cursor-pointer">
                Email + SMS
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* SMS Quota Display */}
        {(channel === 'sms' || channel === 'both') && smsQuota && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quota SMS disponible</span>
              <span className="font-medium">{smsQuota.total_available} SMS</span>
            </div>
            <Progress value={(smsQuota.free_used / smsQuota.free_quota) * 100} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{smsQuota.free_remaining} gratuits + {smsQuota.paid_balance} achetés</span>
              <a href="/pecheur/preferences" className="text-primary hover:underline">Acheter des SMS</a>
            </div>
          </div>
        )}

        {/* Quota Warning */}
        {isQuotaInsufficient && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Quota insuffisant : {contactsWithPhone} SMS requis, {smsQuota?.total_available} disponibles.
            </AlertDescription>
          </Alert>
        )}

        {isQuotaLow && !isQuotaInsufficient && (channel === 'sms' || channel === 'both') && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Quota SMS faible ({smsQuota?.total_available} restants). Pensez à acheter un pack.
            </AlertDescription>
          </Alert>
        )}

        {/* Type de message */}
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
            {(channel === 'email' || channel === 'both') && ` • ${contactsWithEmail} avec email`}
            {(channel === 'sms' || channel === 'both') && ` • ${contactsWithPhone} avec téléphone`}
          </p>
        </div>

        <ContactSelector
          fishermanId={fishermanId}
          selectedGroup={selectedGroup}
          onSelectedContactsChange={setSelectedContacts}
        />

        <Button 
          onClick={handleSendMessage} 
          disabled={sendMessageMutation.isPending || selectedContacts.length === 0 || isQuotaInsufficient}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" aria-hidden="true" />
          {sendMessageMutation.isPending 
            ? 'Envoi en cours...' 
            : channel === 'email' 
              ? `Envoyer ${contactsWithEmail} email(s)`
              : channel === 'sms'
                ? `Envoyer ${contactsWithPhone} SMS`
                : `Envoyer ${contactsWithEmail} email(s) + ${contactsWithPhone} SMS`
          }
        </Button>
      </CardContent>
    </Card>
  );
};

export default MessagingSection;
