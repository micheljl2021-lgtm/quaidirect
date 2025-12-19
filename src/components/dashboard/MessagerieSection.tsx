import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, Send, AlertTriangle, MessageSquare, Check, User, Ship, Shield } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  message_type: string;
  related_drop_id: string | null;
  read_at: string | null;
  created_at: string;
}

interface MessagerieSectionProps {
  userId: string;
  userRole?: string;
  fishermanId?: string;
}

export function MessagerieSection({ userId, userRole, fishermanId }: MessagerieSectionProps) {
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newMessageRecipient, setNewMessageRecipient] = useState("");
  const [newMessageSubject, setNewMessageSubject] = useState("");
  const [newMessageBody, setNewMessageBody] = useState("");

  // Fetch received messages
  const { data: receivedMessages = [], isLoading: loadingReceived } = useQuery({
    queryKey: ["messages", "received", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!userId,
  });

  // Fetch sent messages
  const { data: sentMessages = [], isLoading: loadingSent } = useQuery({
    queryKey: ["messages", "sent", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("sender_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!userId,
  });

  // Fetch fishermen for new message (if user is fisherman)
  const { data: fishermen = [] } = useQuery({
    queryKey: ["fishermen-for-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishermen")
        .select("id, user_id, boat_name, company_name")
        .not("user_id", "eq", userId)
        .not("verified_at", "is", null);
      
      if (error) throw error;
      return data;
    },
    enabled: userRole === "fisherman" || userRole === "admin",
  });

  // Mark message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", messageId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  // Send reply
  const sendReplyMutation = useMutation({
    mutationFn: async ({ recipientId, subject, body }: { recipientId: string; subject: string; body: string }) => {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: userId,
          recipient_id: recipientId,
          subject,
          body,
          message_type: "general",
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message envoyé");
      setReplyContent("");
      setSelectedMessage(null);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du message");
    },
  });

  // Send new message
  const sendNewMessageMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: userId,
          recipient_id: newMessageRecipient,
          subject: newMessageSubject,
          body: newMessageBody,
          message_type: userRole === "fisherman" ? "fisherman_to_fisherman" : "general",
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message envoyé");
      setNewMessageOpen(false);
      setNewMessageRecipient("");
      setNewMessageSubject("");
      setNewMessageBody("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du message");
    },
  });

  // Setup realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", "received", userId] });
          toast.info("Nouveau message reçu");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read_at && message.recipient_id === userId) {
      markAsReadMutation.mutate(message.id);
    }
  };

  const unreadCount = receivedMessages.filter((m) => !m.read_at).length;

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "correction_request":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "fisherman_to_fisherman":
        return <Ship className="h-4 w-4 text-blue-500" />;
      case "support":
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMessageTypeBadge = (type: string) => {
    switch (type) {
      case "correction_request":
        return <Badge variant="destructive">Correction demandée</Badge>;
      case "fisherman_to_fisherman":
        return <Badge variant="secondary">Pêcheur</Badge>;
      case "support":
        return <Badge className="bg-green-500">Support</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle className="text-lg">Messagerie</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} non lu{unreadCount > 1 ? "s" : ""}</Badge>
          )}
        </div>
        {(userRole === "fisherman" || userRole === "admin") && (
          <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Send className="h-4 w-4 mr-2" />
                Nouveau message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Destinataire</label>
                  <Select value={newMessageRecipient} onValueChange={setNewMessageRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un pêcheur" />
                    </SelectTrigger>
                    <SelectContent>
                      {fishermen.map((f) => (
                        <SelectItem key={f.user_id} value={f.user_id}>
                          {f.boat_name} {f.company_name ? `(${f.company_name})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Sujet</label>
                  <Input
                    value={newMessageSubject}
                    onChange={(e) => setNewMessageSubject(e.target.value)}
                    placeholder="Objet du message"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={newMessageBody}
                    onChange={(e) => setNewMessageBody(e.target.value)}
                    placeholder="Votre message..."
                    rows={5}
                  />
                </div>
                <Button
                  onClick={() => sendNewMessageMutation.mutate()}
                  disabled={!newMessageRecipient || !newMessageBody || sendNewMessageMutation.isPending}
                  className="w-full"
                >
                  Envoyer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="received">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="relative">
              Reçus
              {unreadCount > 0 && (
                <span className="ml-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">Envoyés</TabsTrigger>
          </TabsList>
          
          <TabsContent value="received" className="mt-4">
            {loadingReceived ? (
              <p className="text-muted-foreground text-center py-4">Chargement...</p>
            ) : receivedMessages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun message reçu</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScrollArea className="h-[400px] border rounded-lg">
                  <div className="p-2 space-y-2">
                    {receivedMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? "bg-primary/10 border-primary"
                            : message.read_at
                            ? "bg-muted/50 hover:bg-muted"
                            : "bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500"
                        } border`}
                        onClick={() => handleSelectMessage(message)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {getMessageTypeIcon(message.message_type)}
                          <span className="font-medium text-sm truncate flex-1">
                            {message.subject || "Sans objet"}
                          </span>
                          {!message.read_at && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {message.body.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(message.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="border rounded-lg p-4">
                  {selectedMessage ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{selectedMessage.subject || "Sans objet"}</h3>
                        {getMessageTypeBadge(selectedMessage.message_type)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Reçu le {format(new Date(selectedMessage.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })}
                      </p>
                      <div className="bg-muted/50 p-3 rounded-lg whitespace-pre-wrap text-sm">
                        {selectedMessage.body}
                      </div>
                      
                      {selectedMessage.related_drop_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/pecheur/arrivage/${selectedMessage.related_drop_id}/modifier`}
                        >
                          Voir l'arrivage concerné
                        </Button>
                      )}
                      
                      <div className="border-t pt-4">
                        <label className="text-sm font-medium">Répondre</label>
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Votre réponse..."
                          className="mt-2"
                          rows={3}
                        />
                        <Button
                          className="mt-2"
                          size="sm"
                          onClick={() => sendReplyMutation.mutate({
                            recipientId: selectedMessage.sender_id,
                            subject: `Re: ${selectedMessage.subject || "Sans objet"}`,
                            body: replyContent,
                          })}
                          disabled={!replyContent || sendReplyMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Envoyer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Sélectionnez un message
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sent" className="mt-4">
            {loadingSent ? (
              <p className="text-muted-foreground text-center py-4">Chargement...</p>
            ) : sentMessages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun message envoyé</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {sentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="p-3 rounded-lg bg-muted/50 border"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getMessageTypeIcon(message.message_type)}
                        <span className="font-medium text-sm">
                          {message.subject || "Sans objet"}
                        </span>
                        {message.read_at && (
                          <Check className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {message.body.substring(0, 100)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Envoyé le {format(new Date(message.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
