import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";

export function SalesTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: sales, isLoading } = useQuery({
    queryKey: ['admin-sales', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('sales')
        .select(`
          *,
          fishermen:fisherman_id (boat_name, company_name),
          offers:offer_id (
            title,
            species:species_id (name)
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

  const filteredSales = sales?.filter(sale => {
    const searchLower = search.toLowerCase();
    return (
      sale.fishermen?.boat_name?.toLowerCase().includes(searchLower) ||
      sale.fishermen?.company_name?.toLowerCase().includes(searchLower) ||
      sale.offers?.title?.toLowerCase().includes(searchLower)
    );
  });

  const totalRevenue = filteredSales?.reduce((sum, sale) => sum + (sale.total_price || 0), 0) || 0;
  const completedSales = filteredSales?.filter(s => s.status === 'completed').length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ventes Complétées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revenu Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toFixed(2)}€</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les ventes</CardTitle>
          <div className="flex gap-4 mt-4">
            <Input
              placeholder="Rechercher pêcheur ou offre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Pêcheur</TableHead>
                  <TableHead>Offre</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Prix unitaire</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    <TableCell>{sale.fishermen?.boat_name || sale.fishermen?.company_name}</TableCell>
                    <TableCell>
                      {sale.offers?.title}
                      <span className="text-xs text-muted-foreground block">
                        {sale.offers?.species?.name}
                      </span>
                    </TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{sale.unit_price.toFixed(2)}€</TableCell>
                    <TableCell className="font-bold">{sale.total_price.toFixed(2)}€</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sale.paid_method || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        sale.status === 'completed' ? 'default' :
                        sale.status === 'refunded' ? 'destructive' :
                        'secondary'
                      }>
                        {sale.status}
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