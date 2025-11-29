import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, CheckCircle, XCircle, AlertCircle, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const categoryLabels = {
  profile_modification: "Modification du profil initial",
  technical: "Problème technique",
  commercial: "Question commerciale",
  other: "Autre demande"
};

const statusLabels = {
  pending: "En attente",
  in_progress: "En cours",
  resolved: "Résolue",
  rejected: "Refusée"
};

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  resolved: CheckCircle,
  rejected: XCircle
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800"
};

export function SupportRequestsTab() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [newStatus, setNewStatus] = useState("");

  // Fetch all support requests with fisherman details
  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-support-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_requests")
        .select(`
          *,
          fishermen:fisherman_id (
            id,
            boat_name,
            company_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, response }: { id: string; status?: string; response?: string }) => {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (response) updateData.admin_response = response;

      const { error } = await supabase
        .from("support_requests")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-requests"] });
      toast.success("Demande mise à jour avec succès");
      setSelectedRequest(null);
      setAdminResponse("");
      setNewStatus("");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    }
  });

  const handleOpenDialog = (request: any) => {
    setSelectedRequest(request);
    setAdminResponse(request.admin_response || "");
    setNewStatus(request.status);
  };

  const handleSubmitResponse = () => {
    if (!selectedRequest) return;
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status: newStatus,
      response: adminResponse.trim() || undefined
    });
  };

  const filteredRequests = requests?.filter((req: any) => {
    if (filterStatus !== "all" && req.status !== filterStatus) return false;
    if (filterCategory !== "all" && req.category !== filterCategory) return false;
    return true;
  });

  const pendingCount = requests?.filter((r: any) => r.status === "pending").length || 0;
  const inProgressCount = requests?.filter((r: any) => r.status === "in_progress").length || 0;

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Résolues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests?.filter((r: any) => r.status === "resolved").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Requests table */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de support ({filteredRequests?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pêcheur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!filteredRequests || filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucune demande
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request: any) => {
                  const StatusIcon = statusIcons[request.status as keyof typeof statusIcons];
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.fishermen?.boat_name || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.fishermen?.email || "N/A"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoryLabels[request.category as keyof typeof categoryLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.subject}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusLabels[request.status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(request)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Répondre
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Response dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gérer la demande</DialogTitle>
            <DialogDescription>
              Pêcheur : {selectedRequest?.fishermen?.boat_name} ({selectedRequest?.fishermen?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Catégorie :</p>
              <Badge variant="outline">
                {selectedRequest && categoryLabels[selectedRequest.category as keyof typeof categoryLabels]}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Sujet :</p>
              <p className="text-sm">{selectedRequest?.subject}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Message :</p>
              <p className="text-sm text-muted-foreground">{selectedRequest?.message}</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Nouveau statut</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Votre réponse</label>
              <Textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Répondez au pêcheur..."
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitResponse} disabled={updateRequestMutation.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
