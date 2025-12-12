import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, Eye, Archive, Download, MessageSquare, Send, CheckCircle, Clock, Inbox } from "lucide-react";

interface Inquiry {
  id: string;
  email: string;
  message: string | null;
  type: string | null;
  status: string | null;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string | null;
}

const typeLabels: Record<string, string> = {
  'launch_notification': 'Lancement',
  'question': 'Question',
  'fisherman_interest': 'Pêcheur intéressé',
  'partnership': 'Partenariat',
  'other': 'Autre',
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'new': { label: 'Nouveau', color: 'bg-blue-500', icon: <Inbox className="h-3 w-3" /> },
  'read': { label: 'Lu', color: 'bg-yellow-500', icon: <Eye className="h-3 w-3" /> },
  'replied': { label: 'Répondu', color: 'bg-green-500', icon: <CheckCircle className="h-3 w-3" /> },
  'archived': { label: 'Archivé', color: 'bg-gray-500', icon: <Archive className="h-3 w-3" /> },
};

export default function PublicInquiriesTab() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["public-inquiries", filterType, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("launch_subscribers")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("type", filterType);
      }
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Inquiry[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("launch_subscribers")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-inquiries"] });
      toast.success("Statut mis à jour");
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ inquiry, response }: { inquiry: Inquiry; response: string }) => {
      // Send email via Edge Function
      const { error: emailError } = await supabase.functions.invoke("send-support-response", {
        body: {
          to: inquiry.email,
          subject: "Réponse de QuaiDirect",
          message: response,
        },
      });
      if (emailError) throw emailError;

      // Update database
      const { error: dbError } = await supabase
        .from("launch_subscribers")
        .update({
          status: "replied",
          admin_response: response,
          responded_at: new Date().toISOString(),
        })
        .eq("id", inquiry.id);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-inquiries"] });
      setReplyDialogOpen(false);
      setReplyMessage("");
      setSelectedInquiry(null);
      toast.success("Réponse envoyée avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'envoi: " + error.message);
    },
  });

  const handleMarkAsRead = (inquiry: Inquiry) => {
    if (inquiry.status === "new") {
      updateStatusMutation.mutate({ id: inquiry.id, status: "read" });
    }
  };

  const handleReply = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyDialogOpen(true);
  };

  const handleSendReply = () => {
    if (!selectedInquiry || !replyMessage.trim()) return;
    replyMutation.mutate({ inquiry: selectedInquiry, response: replyMessage });
  };

  const handleArchive = (inquiry: Inquiry) => {
    updateStatusMutation.mutate({ id: inquiry.id, status: "archived" });
  };

  const exportCSV = () => {
    if (!inquiries) return;
    
    const headers = ["Date", "Email", "Type", "Message", "Statut", "Réponse admin", "Date réponse"];
    const rows = inquiries.map(i => [
      i.created_at ? format(new Date(i.created_at), "dd/MM/yyyy HH:mm") : "",
      i.email,
      typeLabels[i.type || ""] || i.type,
      i.message || "",
      statusConfig[i.status || ""]?.label || i.status,
      i.admin_response || "",
      i.responded_at ? format(new Date(i.responded_at), "dd/MM/yyyy HH:mm") : "",
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `demandes_publiques_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const newCount = inquiries?.filter(i => i.status === "new").length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages publics
            {newCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {newCount} nouveau{newCount > 1 ? "x" : ""}
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="launch_notification">Lancement</SelectItem>
              <SelectItem value="question">Question</SelectItem>
              <SelectItem value="fisherman_interest">Pêcheur intéressé</SelectItem>
              <SelectItem value="partnership">Partenariat</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="new">Nouveau</SelectItem>
              <SelectItem value="read">Lu</SelectItem>
              <SelectItem value="replied">Répondu</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : !inquiries?.length ? (
          <p className="text-muted-foreground text-center py-8">Aucun message</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id} className={inquiry.status === "new" ? "bg-blue-50/50" : ""}>
                  <TableCell className="whitespace-nowrap">
                    {inquiry.created_at
                      ? format(new Date(inquiry.created_at), "dd/MM/yy HH:mm", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell className="font-medium">{inquiry.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabels[inquiry.type || ""] || inquiry.type || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={inquiry.message || ""}>
                    {inquiry.message || <span className="text-muted-foreground italic">Aucun message</span>}
                  </TableCell>
                  <TableCell>
                    {inquiry.status && statusConfig[inquiry.status] ? (
                      <Badge className={`${statusConfig[inquiry.status].color} text-white flex items-center gap-1 w-fit`}>
                        {statusConfig[inquiry.status].icon}
                        {statusConfig[inquiry.status].label}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{inquiry.status || "-"}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {inquiry.status === "new" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(inquiry)}
                          title="Marquer comme lu"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReply(inquiry)}
                        title="Répondre"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      {inquiry.status !== "archived" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(inquiry)}
                          title="Archiver"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Reply Dialog */}
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Répondre à {selectedInquiry?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedInquiry?.message && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Message original :</p>
                  <p className="text-sm">{selectedInquiry.message}</p>
                </div>
              )}
              <Textarea
                placeholder="Votre réponse..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={6}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSendReply}
                disabled={!replyMessage.trim() || replyMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {replyMutation.isPending ? "Envoi..." : "Envoyer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
