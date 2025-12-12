import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Globe, ExternalLink, Info, XCircle, AlertTriangle, UserPlus } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FishermanDetailSheet } from "./FishermanDetailSheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OrphanUser {
  user_id: string;
  email: string | null;
}

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

  // Detect orphan users: have fisherman role but no fishermen profile
  const { data: orphanUsers, refetch: refetchOrphans } = useQuery({
    queryKey: ['admin-orphan-fisherman-users'],
    queryFn: async () => {
      // Get all users with fisherman role
      const { data: fishermenRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'fisherman');
      
      if (rolesError) throw rolesError;
      if (!fishermenRoles?.length) return [];

      const userIds = fishermenRoles.map(r => r.user_id);

      // Get all fishermen profiles
      const { data: fishermenProfiles, error: profilesError } = await supabase
        .from('fishermen')
        .select('user_id');
      
      if (profilesError) throw profilesError;
      
      const profileUserIds = new Set(fishermenProfiles?.map(f => f.user_id) || []);
      
      // Find orphans (have role but no profile)
      const orphanUserIds = userIds.filter(uid => !profileUserIds.has(uid));
      
      if (!orphanUserIds.length) return [];

      // Get email from profiles table
      const { data: profiles, error: emailError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', orphanUserIds);
      
      if (emailError) throw emailError;

      return orphanUserIds.map(uid => ({
        user_id: uid,
        email: profiles?.find(p => p.id === uid)?.email || null
      })) as OrphanUser[];
    },
  });

  const handleVerify = async (fisherman: any) => {
    const toastId = toast.loading("Validation en cours...");
    
    const { error } = await supabase
      .from('fishermen')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', fisherman.id);

    if (error) {
      toast.error("Erreur lors de la vérification", { id: toastId });
      return;
    }

    // Send approval email
    try {
      await supabase.functions.invoke('send-fisherman-approved-email', {
        body: {
          userEmail: fisherman.email,
          boatName: fisherman.boat_name,
          plan: fisherman.onboarding_payment_status === 'paid' ? 'standard' : 'pending',
        }
      });
      toast.success("Pêcheur vérifié et email envoyé !", { id: toastId });
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      toast.success("Pêcheur vérifié (email non envoyé)", { id: toastId });
    }
    
    refetch();
  };

  const handleReject = async (fisherman: any) => {
    const confirmed = window.confirm(`Rejeter l'inscription de ${fisherman.boat_name} ? Cette action supprimera le profil pêcheur.`);
    if (!confirmed) return;

    const toastId = toast.loading("Rejet en cours...");
    
    const { error } = await supabase
      .from('fishermen')
      .delete()
      .eq('id', fisherman.id);

    if (error) {
      toast.error("Erreur lors du rejet", { id: toastId });
    } else {
      toast.success("Inscription rejetée", { id: toastId });
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

  const handleCreateOrphanProfile = async (orphan: OrphanUser) => {
    const toastId = toast.loading("Création du profil pêcheur...");
    
    const tempSuffix = orphan.user_id.substring(0, 12);
    const tempBoatReg = `TEMP-${Date.now()}-${tempSuffix}`;
    const tempSiret = `TEMP-SIRET-${Date.now()}-${tempSuffix}`;
    
    const { error } = await supabase
      .from('fishermen')
      .insert({
        user_id: orphan.user_id,
        boat_name: 'À compléter',
        boat_registration: tempBoatReg,
        siret: tempSiret,
        onboarding_payment_status: 'paid',
        onboarding_step: 1,
        email: orphan.email,
      });

    if (error) {
      console.error('Error creating orphan profile:', error);
      toast.error("Erreur lors de la création du profil", { id: toastId });
    } else {
      toast.success("Profil pêcheur créé ! L'utilisateur peut maintenant compléter son onboarding.", { id: toastId });
      refetch();
      refetchOrphans();
    }
  };

  const verifiedCount = fishermen?.filter(f => f.verified_at).length || 0;
  const pendingCount = fishermen?.filter(f => !f.verified_at).length || 0;
  const ambassadorCount = fishermen?.filter(f => f.is_ambassador).length || 0;
  const orphanCount = orphanUsers?.length || 0;

  return (
    <div className="space-y-6">
      {/* Orphan users alert */}
      {orphanCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Utilisateurs orphelins détectés ({orphanCount})</AlertTitle>
          <AlertDescription>
            <p className="mb-3">Ces utilisateurs ont le rôle pêcheur mais pas de profil fishermen. Cela peut arriver si le webhook Stripe a échoué après le paiement.</p>
            <div className="space-y-2">
              {orphanUsers?.map((orphan) => (
                <div key={orphan.user_id} className="flex items-center justify-between bg-background/50 p-2 rounded">
                  <span className="text-sm font-mono">
                    {orphan.email || orphan.user_id.substring(0, 8) + '...'}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleCreateOrphanProfile(orphan)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Créer le profil
                  </Button>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
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
                    <TableHead>Étape</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Vérifié</TableHead>
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
                        <Badge variant={fisherman.onboarding_step >= 6 ? 'default' : 'secondary'}>
                          {fisherman.onboarding_step || 1}/6
                        </Badge>
                      </TableCell>
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
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetails(fisherman)}
                            title="Voir les détails"
                          >
                            <Info className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          {fisherman.slug && (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              title="Voir la vitrine"
                            >
                              <a href={`/pecheurs/${fisherman.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              </a>
                            </Button>
                          )}
                          {!fisherman.verified_at && fisherman.onboarding_step >= 6 && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleVerify(fisherman)}
                                title="Valider l'inscription"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(fisherman)}
                                title="Rejeter l'inscription"
                              >
                                <XCircle className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </>
                          )}
                          {!fisherman.verified_at && fisherman.onboarding_step < 6 && (
                            <Badge variant="outline" className="text-xs">
                              Onboarding incomplet
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEnrichProfile(fisherman)}
                            title="Enrichir profil SEO"
                          >
                            <Globe className="h-4 w-4" aria-hidden="true" />
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
