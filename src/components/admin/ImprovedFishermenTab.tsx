import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Globe, Eye, ExternalLink, Info } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FishermanDetailSheet } from "./FishermanDetailSheet";

export function ImprovedFishermenTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedFisherman, setSelectedFisherman] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: fishermen, isLoading, refetch } = useQuery({
    queryKey: ['admin-fishermen-improved', statusFilter, paymentFilter],
    queryFn: async () => {
      let query = supabase
        .from('fishermen')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter === 'verified') {
        query = query.not('verified_at', 'is', null);
      } else if (statusFilter === 'pending') {
        query = query.is('verified_at', null);
      } else if (statusFilter === 'ambassadors') {
        query = query.eq('is_ambassador', true);
      }

      if (paymentFilter === 'paid') {
        query = query.eq('onboarding_payment_status', 'paid');
      } else if (paymentFilter === 'pending') {
        query = query.eq('onboarding_payment_status', 'pending');
      } else if (paymentFilter === 'unpaid') {
        query = query.or('onboarding_payment_status.is.null,onboarding_payment_status.neq.paid');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleVerify = async (fishermanId: string) => {
    const { error } = await supabase
      .from('fishermen')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', fishermanId);

    if (error) {
      toast.error("Erreur lors de la vérification");
    } else {
      toast.success("Pêcheur vérifié avec succès");
      refetch();
    }
  };

  const handleToggleAmbassador = async (fishermanId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('fishermen')
      .update({ is_ambassador: !currentStatus })
      .eq('id', fishermanId);

    if (error) {
      toast.error("Erreur lors de la modification");
    } else {
      toast.success(`Statut ambassadeur ${!currentStatus ? 'activé' : 'désactivé'}`);
      refetch();
    }
  };

  const handleEnrichProfile = async (fisherman: any) => {
    try {
      toast.loading("Génération du contenu SEO en cours...");

      const { data, error } = await supabase.functions.invoke('generate-fisherman-seo-content', {
        body: { fishermanId: fisherman.id }
      });

      if (error) throw error;

      toast.success("Profil enrichi avec succès !");
      refetch();
      
      toast.info(`SEO Title: ${data.data.seo_title}`, { duration: 5000 });
    } catch (error) {
      console.error('Error enriching profile:', error);
      toast.error("Impossible d'enrichir le profil");
    }
  };

  const handleOpenDetails = (fisherman: any) => {
    setSelectedFisherman(fisherman);
    setSheetOpen(true);
  };

  const verifiedCount = fishermen?.filter(f => f.verified_at).length || 0;
  const pendingCount = fishermen?.filter(f => !f.verified_at).length || 0;
  const ambassadorCount = fishermen?.filter(f => f.is_ambassador).length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Pêcheurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fishermen?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vérifiés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ambassadeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{ambassadorCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les pêcheurs</CardTitle>
          <div className="flex flex-wrap gap-4 mt-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut vérification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="verified">Vérifiés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="ambassadors">Ambassadeurs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous paiements</SelectItem>
                <SelectItem value="paid">Payé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="unpaid">Non payé</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead>Nom du bateau</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>SIRET</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Vérifié</TableHead>
                    <TableHead>Ambassadeur</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fishermen?.map((fisherman) => (
                    <TableRow key={fisherman.id}>
                      <TableCell className="font-medium">{fisherman.boat_name}</TableCell>
                      <TableCell>{fisherman.company_name || '-'}</TableCell>
                      <TableCell className="text-sm">{fisherman.email || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{fisherman.siret}</TableCell>
                      <TableCell>
                        <Badge variant={
                          fisherman.onboarding_payment_status === 'paid' ? 'default' :
                          fisherman.onboarding_payment_status === 'pending' ? 'secondary' :
                          'outline'
                        }>
                          {fisherman.onboarding_payment_status === 'paid' ? 'Payé' :
                           fisherman.onboarding_payment_status === 'pending' ? 'En attente' :
                           'Non payé'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={fisherman.verified_at ? 'default' : 'secondary'}>
                          {fisherman.verified_at ? 'Oui' : 'Non'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={fisherman.is_ambassador ? 'default' : 'outline'}>
                          {fisherman.is_ambassador ? 'Oui' : 'Non'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetails(fisherman)}
                            title="Voir les détails"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          {fisherman.slug && (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              title="Voir la vitrine"
                            >
                              <a href={`/boutique/${fisherman.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {!fisherman.verified_at && (
                            <Button
                              size="sm"
                              onClick={() => handleVerify(fisherman.id)}
                              title="Vérifier"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant={fisherman.is_ambassador ? 'destructive' : 'secondary'}
                            onClick={() => handleToggleAmbassador(fisherman.id, fisherman.is_ambassador || false)}
                            title={fisherman.is_ambassador ? 'Retirer ambassadeur' : 'Nommer ambassadeur'}
                          >
                            {fisherman.is_ambassador ? '−' : '★'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEnrichProfile(fisherman)}
                            title="Enrichir profil SEO"
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FishermanDetailSheet
        fisherman={selectedFisherman}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
