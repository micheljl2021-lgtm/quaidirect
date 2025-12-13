import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function FishermanSubscriptionsTab() {
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin-fisherman-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .ilike('plan', 'fisherman_%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Récupérer les emails des pêcheurs
      const enrichedData = await Promise.all(
        data.map(async (payment) => {
          const { data: fisherman } = await supabase
            .from('fishermen')
            .select('boat_name, company_name, email, user_id')
            .eq('user_id', payment.user_id)
            .single();

          return {
            ...payment,
            fisherman
          };
        })
      );

      return enrichedData;
    },
  });

  const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
  const trialCount = subscriptions?.filter(s => s.trial_end && new Date(s.trial_end) > new Date()).length || 0;
  const canceledCount = subscriptions?.filter(s => s.status === 'canceled').length || 0;

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'fisherman_basic':
        return 'Basic (150€/an)';
      case 'fisherman_standard':
        return 'Standard (150€/an)';
      case 'fisherman_pro':
        return 'Pro (299€/an)';
      case 'fisherman_elite':
        return 'Elite (199€/mois)';
      default:
        return plan;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'trialing':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Abonnements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">En essai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{trialCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Annulés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{canceledCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abonnements Pêcheurs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bateau</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Essai jusqu'au</TableHead>
                  <TableHead>Période en cours</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Stripe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions?.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">
                      {sub.fisherman?.boat_name || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sub.fisherman?.email || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPlanLabel(sub.plan)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(sub.status)}>
                        {sub.status === 'active' ? 'Actif' : sub.status === 'canceled' ? 'Annulé' : sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.trial_end ? (
                        <span className="text-sm">
                          {format(new Date(sub.trial_end), 'dd/MM/yyyy')}
                          {new Date(sub.trial_end) > new Date() && (
                            <Badge variant="secondary" className="ml-2">En cours</Badge>
                          )}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sub.current_period_start && sub.current_period_end ? (
                        `${format(new Date(sub.current_period_start), 'dd/MM/yy')} → ${format(new Date(sub.current_period_end), 'dd/MM/yy')}`
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(sub.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {sub.stripe_subscription_id ? (
                        <a
                          href={`https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {sub.stripe_subscription_id.substring(0, 15)}...
                        </a>
                      ) : (
                        '-'
                      )}
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
