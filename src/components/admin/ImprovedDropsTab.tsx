import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { ImageIcon } from "lucide-react";

export function ImprovedDropsTab() {
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "landed" | "completed" | "cancelled">("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { data: drops, isLoading } = useQuery({
    queryKey: ['admin-drops-improved', statusFilter, page],
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

      const { data, error, count } = await query;
      if (error) throw error;
      return { data, count };
    },
  });

  const statusCounts = {
    scheduled: drops?.data?.filter(d => d.status === 'scheduled').length || 0,
    landed: drops?.data?.filter(d => d.status === 'landed').length || 0,
    completed: drops?.data?.filter(d => d.status === 'completed').length || 0,
    cancelled: drops?.data?.filter(d => d.status === 'cancelled').length || 0,
  };

  const totalPages = Math.ceil((drops?.count || 0) / pageSize);

  // Fonction pour obtenir le lieu d'un drop (sale_point prioritaire sur port)
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

  // Fonction pour obtenir la première photo
  const getFirstPhoto = (drop: any): string | null => {
    if (drop.drop_photos && drop.drop_photos.length > 0) {
      const sorted = [...drop.drop_photos].sort((a, b) => a.display_order - b.display_order);
      return sorted[0]?.photo_url || null;
    }
    return null;
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
          <div className="flex gap-4 mt-4 items-center">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-[180px]">
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
            <div className="flex gap-2 items-center">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {drops?.data?.map((drop) => {
                  const photoUrl = getFirstPhoto(drop);
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
