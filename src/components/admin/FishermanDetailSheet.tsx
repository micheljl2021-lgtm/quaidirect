import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ExternalLink, Ship, MapPin, Fish, Users, Calendar, Loader2 } from "lucide-react";

interface FishermanDetailSheetProps {
  fisherman: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FishermanDetailSheet({ fisherman, open, onOpenChange }: FishermanDetailSheetProps) {
  // Fetch sale points
  const { data: salePoints } = useQuery({
    queryKey: ['fisherman-sale-points', fisherman?.id],
    queryFn: async () => {
      if (!fisherman?.id) return [];
      const { data, error } = await supabase
        .from('fisherman_sale_points')
        .select('*')
        .eq('fisherman_id', fisherman.id);
      if (error) throw error;
      return data;
    },
    enabled: open && !!fisherman?.id,
  });

  // Fetch last 10 drops
  const { data: drops } = useQuery({
    queryKey: ['fisherman-drops', fisherman?.id],
    queryFn: async () => {
      if (!fisherman?.id) return [];
      const { data, error } = await supabase
        .from('drops')
        .select('id, status, eta_at, sale_start_time, created_at')
        .eq('fisherman_id', fisherman.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: open && !!fisherman?.id,
  });

  // Fetch contacts count
  const { data: contactsCount } = useQuery({
    queryKey: ['fisherman-contacts-count', fisherman?.id],
    queryFn: async () => {
      if (!fisherman?.id) return 0;
      const { count, error } = await supabase
        .from('fishermen_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('fisherman_id', fisherman.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: open && !!fisherman?.id,
  });

  // Fetch species
  const { data: species } = useQuery({
    queryKey: ['fisherman-species', fisherman?.id],
    queryFn: async () => {
      if (!fisherman?.id) return [];
      const { data, error } = await supabase
        .from('fishermen_species')
        .select('species:species_id (name)')
        .eq('fisherman_id', fisherman.id);
      if (error) throw error;
      return data?.map(s => s.species?.name).filter(Boolean) || [];
    },
    enabled: open && !!fisherman?.id,
  });

  if (!fisherman) return null;

  const fishingMethodsLabels: Record<string, string> = {
    ligneur: 'Ligne',
    fileyeur: 'Filet',
    caseyeur: 'Casier',
    palangrier: 'Palangre',
    chalutier: 'Chalut',
    dragueur: 'Drague',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            {fisherman.boat_name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Infos bateau */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Informations bateau</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nom du bateau</span>
                <span className="font-medium">{fisherman.boat_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Immatriculation</span>
                <span className="font-mono">{fisherman.boat_registration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SIRET</span>
                <span className="font-mono text-xs">{fisherman.siret}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entreprise</span>
                <span>{fisherman.company_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-xs">{fisherman.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Téléphone</span>
                <span>{fisherman.phone || '-'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Méthodes et zones */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Fish className="h-4 w-4" />
                Pêche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Méthodes de pêche</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {fisherman.fishing_methods?.length > 0 ? (
                    fisherman.fishing_methods.map((method: string) => (
                      <Badge key={method} variant="secondary">
                        {fishingMethodsLabels[method] || method}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Zones de pêche</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {fisherman.fishing_zones?.length > 0 ? (
                    fisherman.fishing_zones.map((zone: string) => (
                      <Badge key={zone} variant="outline">{zone}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Espèces</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {species && species.length > 0 ? (
                    species.map((name: string) => (
                      <Badge key={name} variant="outline">{name}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points de vente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Points de vente ({salePoints?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salePoints && salePoints.length > 0 ? (
                <div className="space-y-2">
                  {salePoints.map((sp) => (
                    <div key={sp.id} className="p-2 bg-muted rounded-md">
                      <div className="font-medium text-sm">{sp.label}</div>
                      <div className="text-xs text-muted-foreground">{sp.address}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Aucun point de vente</span>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contactsCount ?? '-'}</div>
              <div className="text-xs text-muted-foreground">contacts enregistrés</div>
            </CardContent>
          </Card>

          {/* Historique arrivages */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Derniers arrivages ({drops?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {drops && drops.length > 0 ? (
                <div className="space-y-2">
                  {drops.map((drop) => (
                    <div key={drop.id} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                      <span>{format(new Date(drop.eta_at), 'dd/MM/yyyy HH:mm')}</span>
                      <Badge variant={
                        drop.status === 'completed' ? 'default' :
                        drop.status === 'cancelled' ? 'destructive' :
                        'secondary'
                      }>
                        {drop.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Aucun arrivage</span>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Bouton vitrine */}
          {fisherman.slug && (
            <Button asChild className="w-full">
              <a href={`/boutique/${fisherman.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir la vitrine publique
              </a>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
