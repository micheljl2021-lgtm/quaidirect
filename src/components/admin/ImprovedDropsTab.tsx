import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { format } from "date-fns";
import { ImageIcon, CheckCircle, Pencil, Trash2, Archive, AlertTriangle, Eye } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ImprovedDropsTab() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "landed" | "completed" | "cancelled" | "needs_correction">("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [salePointFilter, setSalePointFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // State for dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<any>(null);
  const [correctionMessage, setCorrectionMessage] = useState("");

  // Fetch sale points for filter
  const { data: salePoints } = useQuery({
    queryKey: ['admin-sale-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fisherman_sale_points')
        .select('id, label, address');
      if (error) throw error;
      return data;
    },
  });

  const { data: drops, isLoading, refetch } = useQuery({
    queryKey: ['admin-drops-improved', statusFilter, dateFilter, salePointFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('drops')
        .select(`
          *,
          fishermen:fisherman_id (id, boat_name, company_name, user_id),
          ports:port_id (name, city),
          sale_point:sale_point_id (label, address),
          drop_photos (photo_url, display_order)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (dateFilter) {
        const startOfDay = `${dateFilter}T00:00:00`;
        const endOfDay = `${dateFilter}T23:59:59`;
        query = query.gte('eta_at', startOfDay).lte('eta_at', endOfDay);
      }

      if (salePointFilter !== 'all') {
        query = query.eq('sale_point_id', salePointFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    },
  });

  const handleMarkCompleted = async (dropId: string) => {
    const { error } = await supabase
      .from('drops')
      .update({ status: 'completed' })
      .eq('id', dropId);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Arrivage marqué comme terminé");
      refetch();
    }
  };

  const handleArchive = async (dropId: string) => {
    const { error } = await supabase
      .from('drops')
      .update({ status: 'completed' })
      .eq('id', dropId);

    if (error) {
      toast.error("Erreur lors de l'archivage");
    } else {
      toast.success("Arrivage archivé");
      refetch();
    }
  };

  const handleDelete = async () => {
    if (!selectedDrop) return;
    
    // Delete related data first
    await supabase.from('drop_photos').delete().eq('drop_id', selectedDrop.id);
    await supabase.from('drop_species').delete().eq('drop_id', selectedDrop.id);
    await supabase.from('offers').delete().eq('drop_id', selectedDrop.id);
    
    const { error } = await supabase
      .from('drops')
      .delete()
      .eq('id', selectedDrop.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Arrivage supprimé");
      refetch();
    }
    setDeleteDialogOpen(false);
    setSelectedDrop(null);
  };

  const handleRequestCorrection = async () => {
    if (!selectedDrop || !correctionMessage.trim()) {
      toast.error("Veuillez entrer un message de correction");
      return;
    }

    const { error } = await supabase
      .from('drops')
      .update({ 
        status: 'needs_correction',
        correction_message: correctionMessage,
        correction_requested_at: new Date().toISOString()
      })
      .eq('id', selectedDrop.id);

    if (error) {
      toast.error("Erreur lors de la demande de correction");
    } else {
      // Create notification for fisherman
      if (selectedDrop.fishermen?.user_id) {
        await supabase.from('notifications').insert({
          user_id: selectedDrop.fishermen.user_id,
          type: 'correction_required',
          title: 'Correction requise sur un arrivage',
          message: correctionMessage,
          data: { drop_id: selectedDrop.id }
        });
      }
      toast.success("Demande de correction envoyée au pêcheur");
      refetch();
    }
    setCorrectionDialogOpen(false);
    setCorrectionMessage("");
    setSelectedDrop(null);
  };

  const handleEdit = (dropId: string) => {
    navigate(`/pecheur/modifier-arrivage/${dropId}`);
  };

  const handleViewDetail = (dropId: string) => {
    navigate(`/arrivage/${dropId}`);
  };

  const statusCounts = {
    scheduled: drops?.data?.filter(d => d.status === 'scheduled').length || 0,
    landed: drops?.data?.filter(d => d.status === 'landed').length || 0,
    completed: drops?.data?.filter(d => d.status === 'completed').length || 0,
    cancelled: drops?.data?.filter(d => d.status === 'cancelled').length || 0,
    needs_correction: drops?.data?.filter(d => d.status === 'needs_correction').length || 0,
  };

  const totalPages = Math.ceil((drops?.count || 0) / pageSize);

  const getDropLocation = (drop: any): string => {
    if (drop.sale_point?.label) {
      return drop.sale_point.label;
    }
    if (drop.sale_point?.address) {
      return drop.sale_point.address;
    }
    if (drop.ports?.name) {
      return drop.ports.name;
    }
    return '—';
  };

  const getFirstPhoto = (drop: any): string | null => {
    if (drop.drop_photos && drop.drop_photos.length > 0) {
      const sorted = [...drop.drop_photos].sort((a, b) => a.display_order - b.display_order);
      return sorted[0]?.photo_url || null;
    }
    return null;
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilter("");
    setSalePointFilter("all");
    setPage(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Programmé</Badge>;
      case 'landed':
        return <Badge variant="default">Arrivé</Badge>;
      case 'completed':
        return <Badge className="bg-green-600">Complété</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      case 'needs_correction':
        return <Badge className="bg-orange-500">À corriger</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Programmés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.scheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Arrivés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.landed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Complétés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Annulés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.cancelled}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="text-sm text-orange-600">À corriger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusCounts.needs_correction}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les arrivages</CardTitle>
          <div className="flex flex-wrap gap-4 mt-4 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Statut</label>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as typeof statusFilter); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="scheduled">Programmé</SelectItem>
                  <SelectItem value="landed">Arrivé</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                  <SelectItem value="needs_correction">À corriger</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date ETA</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(0); }}
                className="w-[160px]"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Point de vente</label>
              <Select value={salePointFilter} onValueChange={(value) => { setSalePointFilter(value); setPage(0); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les points" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les points</SelectItem>
                  {salePoints?.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.label || sp.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Réinitialiser
            </Button>
            <div className="flex gap-2 items-center ml-auto">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm">
                Page {page + 1} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Photo</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead>Pêcheur</TableHead>
                    <TableHead>Lieu</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Vente</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drops?.data?.map((drop) => {
                    const photoUrl = getFirstPhoto(drop);
                    const canModify = drop.status !== 'completed' && drop.status !== 'cancelled';
                    return (
                      <TableRow key={drop.id} className={drop.status === 'needs_correction' ? 'bg-orange-50 dark:bg-orange-950/20' : ''}>
                        <TableCell>
                          {photoUrl ? (
                            <img 
                              src={photoUrl} 
                              alt="Photo arrivage" 
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{format(new Date(drop.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>
                          {drop.fishermen?.boat_name || drop.fishermen?.company_name || '—'}
                        </TableCell>
                        <TableCell>{getDropLocation(drop)}</TableCell>
                        <TableCell>{format(new Date(drop.eta_at), 'dd/MM HH:mm')}</TableCell>
                        <TableCell>{format(new Date(drop.sale_start_time), 'dd/MM HH:mm')}</TableCell>
                        <TableCell>
                          <Badge variant={drop.is_premium ? 'default' : 'secondary'}>
                            {drop.is_premium ? 'Oui' : 'Non'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(drop.status)}
                          {drop.correction_message && (
                            <p className="text-xs text-orange-600 mt-1 max-w-[150px] truncate" title={drop.correction_message}>
                              {drop.correction_message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetail(drop.id)}
                              title="Voir détail"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(drop.id)}
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            {canModify && (
                              <>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleMarkCompleted(drop.id)}
                                  title="Marquer terminé"
                                >
                                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-orange-600 hover:bg-orange-50"
                                  onClick={() => {
                                    setSelectedDrop(drop);
                                    setCorrectionDialogOpen(true);
                                  }}
                                  title="Demander correction"
                                >
                                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleArchive(drop.id)}
                              title="Archiver"
                            >
                              <Archive className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedDrop(drop);
                                setDeleteDialogOpen(true);
                              }}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet arrivage ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'arrivage et toutes ses données associées (photos, offres) seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Correction request dialog */}
      <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une correction</DialogTitle>
            <DialogDescription>
              Un message sera envoyé au pêcheur pour lui demander de modifier son arrivage.
              L'arrivage sera retiré de la liste publique jusqu'à correction.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Message au pêcheur</label>
            <Textarea
              value={correctionMessage}
              onChange={(e) => setCorrectionMessage(e.target.value)}
              placeholder="Ex: Merci de corriger le prix qui semble incorrect, ou d'ajouter une photo de votre pêche..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRequestCorrection} className="bg-orange-600 hover:bg-orange-700">
              Envoyer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
