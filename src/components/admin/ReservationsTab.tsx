import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";

export function ReservationsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['admin-reservations', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('reservations')
        .select(`
          *,
          offers:offer_id (
            title,
            species:species_id (name),
            drops:drop_id (
              eta_at,
              ports:port_id (name),
              fishermen:fisherman_id (boat_name)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const activeCount = reservations?.filter(r => r.status === 'pending').length || 0;
  const confirmedCount = reservations?.filter(r => r.status === 'confirmed').length || 0;
  const cancelledCount = reservations?.filter(r => r.status === 'cancelled').length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Confirmées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Annulées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les réservations</CardTitle>
          <div className="mt-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date réservation</TableHead>
                  <TableHead>Pêcheur</TableHead>
                  <TableHead>Offre</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Expire le</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations?.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>{format(new Date(reservation.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{reservation.offers?.drops?.fishermen?.boat_name}</TableCell>
                    <TableCell>
                      {reservation.offers?.title}
                      <span className="text-xs text-muted-foreground block">
                        {reservation.offers?.species?.name}
                      </span>
                    </TableCell>
                    <TableCell>{reservation.offers?.drops?.ports?.name}</TableCell>
                    <TableCell>{format(new Date(reservation.offers?.drops?.eta_at), 'dd/MM HH:mm')}</TableCell>
                    <TableCell>{reservation.quantity}</TableCell>
                    <TableCell>{format(new Date(reservation.expires_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <Badge variant={
                        reservation.status === 'confirmed' ? 'default' :
                        reservation.status === 'cancelled' ? 'destructive' :
                        reservation.status === 'completed' ? 'default' :
                        'secondary'
                      }>
                        {reservation.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}