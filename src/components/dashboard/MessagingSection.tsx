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
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Send, MessageSquare, AlertTriangle, Ship, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessagingSectionProps {
  fishermanId: string;
  preSelectedDropId?: string;
}

type Channel = 'email' | 'sms' | 'both';

const MessagingSection = ({ fishermanId, preSelectedDropId }: MessagingSectionProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageType, setMessageType] = useState<'invitation_initiale' | 'new_drop' | 'custom'>('invitation_initiale');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [channel, setChannel] = useState<Channel>('email');
  const [selectedDropId, setSelectedDropId] = useState<string>(preSelectedDropId || '');
  const [excludeAutoNotified, setExcludeAutoNotified] = useState(true);

  // Fetch all active drops for this fisherman
  const { data: availableDrops, refetch: refetchDrops } = useQuery({
    queryKey: ['fisherman-drops', fishermanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drops')
        .select(`
          id,
          sale_start_time,
          created_at,
          fisherman_sale_points (label, address),
          ports (name, city),
          drop_species (species:species_id (name))
        `)
        .eq('fisherman_id', fishermanId)
        .in('status', ['scheduled', 'landed'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!fishermanId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Auto-select preSelectedDropId and switch to new_drop type
  useEffect(() => {
    if (preSelectedDropId && availableDrops?.some(d => d.id === preSelectedDropId)) {
      setSelectedDropId(preSelectedDropId);
      setMessageType('new_drop');
    }
  }, [preSelectedDropId, availableDrops]);

  // Get selected drop details
  const selectedDrop = availableDrops?.find(d => d.id === selectedDropId);

  // Fetch SMS quota
  const { data: smsQuota, error: quotaError } = useQuery({
    queryKey: ['sms-quota'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-sms-quota');
      if (error) {
        // Handle Twilio not configured (503)
        if (error.message?.includes('not configured') || error.message?.includes('503')) {
          return null;
        }
        throw error;
      }
      return data as {
        free_remaining: number;
        paid_balance: number;
        total_available: number;
        monthly_quota: number;
        free_used: number;
      };
    },
    retry: false,
  });

  // Check if Twilio/SMS is not configured
  const isSmsNotConfigured = quotaError?.message?.includes('not configured') || quotaError?.message?.includes('503');

  // Count contacts with phone vs email
  const contactsWithEmail = selectedContacts.filter(c => c.email).length;
  const contactsWithPhone = selectedContacts.filter(c => c.phone).length;

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { 
      message_type: string; 
      body: string; 
      sent_to_group: string; 
      contact_ids?: string[]; 
      channel: Channel;
      drop_id?: string;
      drop_details?: { time?: string; location?: string; species?: string };
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ['drop-notifications-sent'] });
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

    // Build drop_details for new_drop messages
    let dropDetails = undefined;
    if (messageType === 'new_drop' && selectedDrop) {
      const location = selectedDrop.fisherman_sale_points?.label 
        || selectedDrop.ports?.name 
        || 'Point de vente';
      
      const speciesNames = selectedDrop.drop_species
        ?.map((ds: any) => ds.species?.name)
        .filter(Boolean)
        .join(', ') || '';
      
      const time = selectedDrop.sale_start_time 
        ? format(new Date(selectedDrop.sale_start_time), "EEEE d MMMM 'à' HH:mm", { locale: fr })
        : '';
      
      dropDetails = {
        time,
        location,
        species: speciesNames,
      };
    }

    sendMessageMutation.mutate({
      message_type: messageType,
      body: messageBody,
      sent_to_group: selectedGroup,
      contact_ids: contactIds,
      channel,
      drop_id: messageType === 'new_drop' && selectedDrop ? selectedDrop.id : undefined,
      drop_details: dropDetails,
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
        {/* Comment envoyer ? */}
        <div className="space-y-2">
          <Label>Comment envoyer ?</Label>
          <RadioGroup value={channel} onValueChange={(v: Channel) => setChannel(v)} className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="email" id="channel-email" />
              <Label htmlFor="channel-email" className="font-normal cursor-pointer flex items-center gap-1">
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email (gratuit et illimité)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sms" id="channel-sms" />
              <Label htmlFor="channel-sms" className="font-normal cursor-pointer flex items-center gap-1">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                SMS (utilise votre quota)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="channel-both" />
              <Label htmlFor="channel-both" className="font-normal cursor-pointer">
                Les deux (Email + SMS)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* SMS Not Configured Warning */}
        {(channel === 'sms' || channel === 'both') && isSmsNotConfigured && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              L'envoi de SMS n'est pas encore configuré. Seuls les emails peuvent être envoyés pour l'instant.
            </AlertDescription>
          </Alert>
        )}

        {/* SMS Quota Display */}
        {(channel === 'sms' || channel === 'both') && smsQuota && !isSmsNotConfigured && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quota SMS disponible</span>
              <span className="font-medium">{smsQuota.total_available} SMS</span>
            </div>
            <Progress value={smsQuota.monthly_quota > 0 ? (smsQuota.free_used / smsQuota.monthly_quota) * 100 : 0} className="h-1.5" />
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

        {/* Drop selector for new_drop type */}
        {messageType === 'new_drop' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ship className="h-4 w-4" />
                Sélectionner l'arrivage à annoncer
              </Label>
              <Select value={selectedDropId} onValueChange={setSelectedDropId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un arrivage..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDrops?.map((drop) => {
                    const location = drop.fisherman_sale_points?.label || drop.ports?.name || 'Point de vente';
                    const dateStr = drop.sale_start_time 
                      ? format(new Date(drop.sale_start_time), "EEE d MMM 'à' HH:mm", { locale: fr })
                      : format(new Date(drop.created_at), "EEE d MMM", { locale: fr });
                    return (
                      <SelectItem key={drop.id} value={drop.id}>
                        {location} - {dateStr}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {!selectedDropId && availableDrops && availableDrops.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Sélectionnez l'arrivage que vous souhaitez annoncer à vos clients
                </p>
              )}
              {availableDrops && availableDrops.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Aucun arrivage actif. Créez d'abord un arrivage avant de l'annoncer.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Exclude auto-notified checkbox */}
            {selectedDropId && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                <Checkbox
                  id="exclude-auto-notified"
                  checked={excludeAutoNotified}
                  onCheckedChange={(checked) => setExcludeAutoNotified(checked === true)}
                />
                <Label 
                  htmlFor="exclude-auto-notified" 
                  className="font-normal cursor-pointer flex items-center gap-2 text-sm"
                >
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  Exclure les contacts déjà notifiés automatiquement
                </Label>
              </div>
            )}
          </div>
        )}

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
          selectedDropId={messageType === 'new_drop' ? selectedDropId : undefined}
          excludeAutoNotified={excludeAutoNotified}
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
