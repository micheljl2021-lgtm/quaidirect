import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function PremiumSubscriptionsTab() {
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['admin-premium-subscriptions'],
    queryFn: async () => {
      // Fetch payments with profiles join to get user email securely
      // This uses RLS policies - admin can view all profiles
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          profiles!inner(email)
        `)
        .in('plan', ['premium_monthly', 'premium_annual', 'premium_plus_monthly', 'premium_plus_annual', 'premium'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include user_email
      return data.map((payment: any) => ({
        ...payment,
        user_email: payment.profiles?.email || null
      }));
    },
  });

  const activeCount = subscriptions?.filter(s => s.status === 'active').length || 0;
  const cancelledCount = subscriptions?.filter(s => s.status === 'canceled').length || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <CardTitle className="text-sm">Annulés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tous les abonnements Premium</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Stripe Customer</TableHead>
                <TableHead>Stripe Subscription</TableHead>
                <TableHead>Début période</TableHead>
                <TableHead>Fin période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {subscriptions?.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="text-sm">{sub.user_email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {sub.plan === 'premium_monthly' ? 'Mensuel (2,50€)' : 'Annuel (25€)'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{sub.stripe_customer_id?.slice(0, 12)}...</TableCell>
                    <TableCell className="font-mono text-xs">{sub.stripe_subscription_id?.slice(0, 12)}...</TableCell>
                    <TableCell>
                      {sub.current_period_start ? format(new Date(sub.current_period_start), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {sub.current_period_end ? format(new Date(sub.current_period_end), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(sub.created_at), 'dd/MM/yyyy')}</TableCell>
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
