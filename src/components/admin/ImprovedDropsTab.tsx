import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";
import { ImageIcon, CheckCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function ImprovedDropsTab() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "landed" | "completed" | "cancelled">("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [salePointFilter, setSalePointFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

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
          fishermen:fisherman_id (boat_name, company_name),
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

  const handleEdit = (dropId: string) => {
    navigate(`/pecheur/modifier-arrivage/${dropId}`);
  };

  const statusCounts = {
    scheduled: drops?.data?.filter(d => d.status === 'scheduled').length || 0,
    landed: drops?.data?.filter(d => d.status === 'landed').length || 0,
    completed: drops?.data?.filter(d => d.status === 'completed').length || 0,
    cancelled: drops?.data?.filter(d => d.status === 'cancelled').length || 0,
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    const canMarkCompleted = drop.status === 'scheduled' || drop.status === 'landed';
                    return (
                      <TableRow key={drop.id}>
                        <TableCell>
                          {photoUrl ? (
                            <img 
                              src={photoUrl} 
                              alt="Photo arrivage" 
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
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
                          <Badge variant={
                            drop.status === 'completed' ? 'default' :
                            drop.status === 'cancelled' ? 'destructive' :
                            'secondary'
                          }>
                            {drop.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(drop.id)}
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {canMarkCompleted && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleMarkCompleted(drop.id)}
                                title="Marquer terminé"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
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
    </div>
  );
}
