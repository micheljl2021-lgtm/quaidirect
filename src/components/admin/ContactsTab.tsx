import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const ContactsTab = () => {
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['admin-fishermen-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishermen_contacts')
        .select(`
          *,
          fishermen!inner(boat_name, company_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin-fishermen-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fishermen_messages')
        .select(`
          *,
          fishermen!inner(boat_name, company_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const totalContacts = contacts?.length || 0;
  const totalMessages = messages?.length || 0;
  const totalRecipients = messages?.reduce((acc, msg) => acc + (msg.recipient_count || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts Totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">
              Contacts importés par les pêcheurs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Envoyés</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              Campagnes d'emailing lancées
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Envoyés</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecipients}</div>
            <p className="text-xs text-muted-foreground">
              Total d'emails distribués
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tous les Contacts</CardTitle>
              <CardDescription>
                Liste complète des contacts importés par les pêcheurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contactsLoading ? (
                <p className="text-center text-muted-foreground py-8">Chargement...</p>
              ) : contacts && contacts.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pêcheur</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Groupe</TableHead>
                        <TableHead>Importé le</TableHead>
                        <TableHead>Dernier contact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact: any) => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium">
                            {contact.fishermen?.boat_name || contact.fishermen?.company_name}
                          </TableCell>
                          <TableCell>
                            {contact.first_name} {contact.last_name}
                          </TableCell>
                          <TableCell>
                            {contact.email ? (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {contact.email}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.phone ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {contact.phone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.contact_group ? (
                              <Badge variant="outline">{contact.contact_group}</Badge>
                            ) : (
                              <Badge variant="secondary">Général</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(contact.imported_at || contact.created_at), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {contact.last_contacted_at ? (
                              format(new Date(contact.last_contacted_at), 'dd/MM/yyyy', { locale: fr })
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucun contact importé pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Messages</CardTitle>
              <CardDescription>
                Tous les messages envoyés par les pêcheurs à leurs contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <p className="text-center text-muted-foreground py-8">Chargement...</p>
              ) : messages && messages.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pêcheur</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Sujet</TableHead>
                        <TableHead>Groupe cible</TableHead>
                        <TableHead>Destinataires</TableHead>
                        <TableHead>Date d'envoi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((message: any) => (
                        <TableRow key={message.id}>
                          <TableCell className="font-medium">
                            {message.fishermen?.boat_name || message.fishermen?.company_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              message.message_type === 'invitation_initiale' ? 'default' :
                              message.message_type === 'new_drop' ? 'secondary' :
                              'outline'
                            }>
                              {message.message_type === 'invitation_initiale' ? 'Invitation' :
                               message.message_type === 'new_drop' ? 'Nouveau drop' :
                               'Personnalisé'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {message.subject || '-'}
                          </TableCell>
                          <TableCell>
                            {message.sent_to_group ? (
                              <Badge variant="outline">{message.sent_to_group}</Badge>
                            ) : (
                              <Badge variant="secondary">Tous</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              {message.recipient_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(message.sent_at || message.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucun message envoyé pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};