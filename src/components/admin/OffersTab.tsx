import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { format } from "date-fns";

export function OffersTab() {
  const [search, setSearch] = useState("");

  const { data: offers, isLoading } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select(`
          *,
          species:species_id (name),
          drops:drop_id (
            eta_at,
            ports:port_id (name),
            fishermen:fisherman_id (boat_name, company_name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredOffers = offers?.filter(offer => {
    const searchLower = search.toLowerCase();
    return (
      offer.title?.toLowerCase().includes(searchLower) ||
      offer.species?.name?.toLowerCase().includes(searchLower) ||
      offer.drops?.fishermen?.boat_name?.toLowerCase().includes(searchLower)
    );
  });

  const activeOffers = filteredOffers?.filter(o => o.available_units > 0).length || 0;
  const soldOutOffers = filteredOffers?.filter(o => o.available_units === 0).length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Offres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOffers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeOffers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Épuisées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{soldOutOffers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les offres</CardTitle>
          <div className="mt-4">
            <Input
              placeholder="Rechercher offre, espèce ou pêcheur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date création</TableHead>
                  <TableHead>Pêcheur</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Espèce</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Disponibilité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers?.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>{format(new Date(offer.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>{offer.drops?.fishermen?.boat_name}</TableCell>
                    <TableCell>{offer.drops?.ports?.name}</TableCell>
                    <TableCell className="font-medium">{offer.title}</TableCell>
                    <TableCell>{offer.species?.name}</TableCell>
                    <TableCell>{offer.unit_price.toFixed(2)}€</TableCell>
                    <TableCell>
                      {offer.available_units} / {offer.total_units}
                    </TableCell>
                    <TableCell>
                      <Badge variant={offer.available_units > 0 ? 'default' : 'secondary'}>
                        {offer.available_units > 0 ? 'En stock' : 'Épuisé'}
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