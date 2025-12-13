import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Send, History, Settings, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import type { SmsMessage, SmsTemplate, SmsQuota } from '@/types/sms';
import { validatePhoneNumber, formatPhoneNumber, prepareSmsMessage } from '@/lib/twilio';

interface PecheurSmsManagerProps {
  fishermanId: string;
}

interface Contact {
  id: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  phone_verified: boolean;
}

export function PecheurSmsManager({ fishermanId }: PecheurSmsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');

  // Fetch contacts
  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['fishermen-contacts', fishermanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishermen_contacts')
        .select('*')
        .eq('fisherman_id', fishermanId)
        .not('phone', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contact[];
    },
  });

  // Fetch SMS quota
  const { data: quota, isLoading: quotaLoading } = useQuery<SmsQuota>({
    queryKey: ['sms-quota'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-sms-quota');
      if (error) throw error;
      return data;
    },
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<SmsTemplate[]>({
    queryKey: ['sms-templates', fishermanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('fisherman_id', fishermanId)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch SMS history
  const { data: smsHistory = [], isLoading: historyLoading } = useQuery<SmsMessage[]>({
    queryKey: ['sms-history', fishermanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('fisherman_id', fishermanId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  // Send SMS invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-sms-invitation', {
        body: {
          contact_ids: selectedContacts,
          template_id: selectedTemplate || undefined,
          custom_message: customMessage || undefined,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'SMS envoyés !',
        description: `${data.sent} SMS envoyé(s) avec succès. ${data.failed > 0 ? `${data.failed} échec(s).` : ''}`,
      });
      setSelectedContacts([]);
      setCustomMessage('');
      queryClient.invalidateQueries({ queryKey: ['sms-quota'] });
      queryClient.invalidateQueries({ queryKey: ['sms-history', fishermanId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || "Erreur lors de l'envoi des SMS",
        variant: 'destructive',
      });
    },
  });

  // Handle template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setCustomMessage(template.body);
    }
  };

  // Handle preview
  const handlePreview = () => {
    const message = prepareSmsMessage(customMessage || templates.find(t => t.is_default && t.type === 'invitation')?.body || '');
    if (!message.valid) {
      toast({
        title: 'Message invalide',
        description: message.error,
        variant: 'destructive',
      });
      return;
    }
    
    // Replace sample variables for preview
    const preview = customMessage
      .replace(/{{signup_link}}/g, 'https://quaidirect.fr/auth?ref=...')
      .replace(/{{first_name}}/g, 'Client')
      .replace(/{{last_name}}/g, 'Exemple');
    
    setPreviewMessage(preview);
    setShowPreview(true);
  };

  // Handle send SMS
  const handleSendSms = () => {
    if (selectedContacts.length === 0) {
      toast({
        title: 'Aucun contact sélectionné',
        description: 'Veuillez sélectionner au moins un contact',
        variant: 'destructive',
      });
      return;
    }

    if (!quota || selectedContacts.length > quota.total_available) {
      toast({
        title: 'Quota insuffisant',
        description: `Vous avez besoin de ${selectedContacts.length} SMS mais seulement ${quota?.total_available || 0} disponibles`,
        variant: 'destructive',
      });
      return;
    }

    sendInvitationMutation.mutate();
  };

  const contactsWithValidPhone = contacts.filter(c => validatePhoneNumber(c.phone || ''));
  const selectedContactsCount = selectedContacts.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
            Gestion SMS
          </CardTitle>
          <CardDescription>
            Invitez vos contacts par SMS ou envoyez des notifications d'arrivage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="send" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="send">Envoyer SMS</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            {/* Send SMS Tab */}
            <TabsContent value="send" className="space-y-4">
              {/* Quota display */}
              {!quotaLoading && quota && (
                <Alert>
                  <AlertDescription>
                    <div className="flex justify-between items-center">
                      <span>SMS disponibles : <strong>{quota.total_available}</strong></span>
                      <span className="text-sm text-muted-foreground">
                        ({quota.free_remaining} gratuits + {quota.paid_balance} payants)
                      </span>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Template selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Template de message</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Choisir un template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.filter(t => t.type === 'invitation').map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} {template.is_default ? '(par défaut)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message personnalisé</Label>
                <Textarea
                  id="message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Bonjour ! J'ai du poisson frais ! Rejoins-moi sur QuaiDirect : {{signup_link}}"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Variables disponibles : {'{{signup_link}}, {{first_name}}, {{last_name}}'} 
                </p>
              </div>

              {/* Contacts selection */}
              <div className="space-y-2">
                <Label>Contacts à inviter ({selectedContactsCount} sélectionné{selectedContactsCount > 1 ? 's' : ''})</Label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {contactsLoading ? (
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  ) : contactsWithValidPhone.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun contact avec numéro de téléphone valide</p>
                  ) : (
                    contactsWithValidPhone.map(contact => (
                      <div key={contact.id} className="flex items-center gap-2">
                        <Checkbox
                          id={contact.id}
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedContacts([...selectedContacts, contact.id]);
                            } else {
                              setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                            }
                          }}
                        />
                        <label htmlFor={contact.id} className="text-sm cursor-pointer flex-1">
                          {contact.first_name} {contact.last_name} - {formatPhoneNumber(contact.phone || '')}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContacts(contactsWithValidPhone.map(c => c.id))}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContacts([])}
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handlePreview}
                  variant="outline"
                  disabled={!customMessage}
                >
                  Prévisualiser
                </Button>
                <Button
                  onClick={handleSendSms}
                  disabled={selectedContactsCount === 0 || sendInvitationMutation.isPending}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendInvitationMutation.isPending 
                    ? 'Envoi en cours...' 
                    : `Envoyer à ${selectedContactsCount} contact${selectedContactsCount > 1 ? 's' : ''}`
                  }
                </Button>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {historyLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : smsHistory.length === 0 ? (
                <Alert>
                  <History className="h-4 w-4" />
                  <AlertDescription>Aucun SMS envoyé pour le moment</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {smsHistory.map(sms => (
                    <Card key={sms.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {sms.status === 'sent' || sms.status === 'delivered' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : sms.status === 'failed' ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-sm font-medium">{sms.phone}</p>
                              <span className="text-xs text-muted-foreground">
                                {new Date(sms.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{sms.message}</p>
                            <div className="flex gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                sms.type === 'invitation' ? 'bg-blue-100 text-blue-800' :
                                sms.type === 'notification' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {sms.type}
                              </span>
                              {sms.error && (
                                <span className="text-xs text-red-600">
                                  Erreur : {sms.error}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Gérez vos templates de messages SMS. Les variables {'{{signup_link}}, {{drop_link}}'}, etc. seront automatiquement remplacées.
                </AlertDescription>
              </Alert>
              
              {templatesLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <div className="space-y-2">
                  {templates.map(template => (
                    <Card key={template.id}>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          {template.name}
                          {template.is_default && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              Par défaut
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.body}</p>
                        <div className="flex gap-1 mt-2">
                          {template.variables.map((v: string) => (
                            <span key={v} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prévisualisation du SMS</DialogTitle>
            <DialogDescription>
              Voici à quoi ressemblera votre message SMS
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{previewMessage}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            Longueur : {previewMessage.length} caractères
            {' • '}
            {Math.ceil(previewMessage.length / 160)} segment{Math.ceil(previewMessage.length / 160) > 1 ? 's' : ''}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
