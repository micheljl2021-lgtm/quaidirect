import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, CheckCircle, XCircle, Euro } from 'lucide-react';
import { SmsAnalytics } from '@/types/sms-analytics';
import { formatCost, formatSuccessRate } from '@/lib/sms-analytics';

interface SmsSummaryCardsProps {
  analytics: SmsAnalytics | undefined;
  loading?: boolean;
}

export function SmsSummaryCards({ analytics, loading }: SmsSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const totalMessages = analytics.totalSent + analytics.totalFailed + analytics.totalPending + analytics.totalDelivered;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total SMS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total SMS</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalMessages}</div>
          <p className="text-xs text-muted-foreground">
            {analytics.totalSent + analytics.totalDelivered} envoyés avec succès
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taux de succès</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatSuccessRate(analytics.successRate)}
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics.totalSent + analytics.totalDelivered} / {totalMessages} messages
          </p>
        </CardContent>
      </Card>

      {/* Failed SMS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
          <XCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {analytics.totalFailed}
          </div>
          <p className="text-xs text-muted-foreground">
            {analytics.totalPending} en attente
          </p>
        </CardContent>
      </Card>

      {/* Total Cost */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Coût total</CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCost(analytics.totalCost * 100)}
          </div>
          <p className="text-xs text-muted-foreground">
            Moyenne: {totalMessages > 0 ? formatCost((analytics.totalCost * 100) / totalMessages) : '0.00€'} / SMS
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
