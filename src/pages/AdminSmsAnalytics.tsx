import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import PageLoader from '@/components/PageLoader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmsSummaryCards } from '@/components/sms-analytics/SmsSummaryCards';
import { SmsCharts } from '@/components/sms-analytics/SmsCharts';
import { SmsHistoryTable } from '@/components/sms-analytics/SmsHistoryTable';
import { SmsExportButton } from '@/components/sms-analytics/SmsExportButton';
import { useAdminSmsAnalytics } from '@/hooks/useSmsAnalytics';
import { useAdminSmsHistory } from '@/hooks/useSmsHistory';
import { SmsHistoryFilters, TimeRange } from '@/types/sms-analytics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const AdminSmsAnalyticsPage = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [historyFilters, setHistoryFilters] = useState<SmsHistoryFilters>({
    page: 1,
    pageSize: 50,
  });

  const { data: analytics, isLoading: analyticsLoading } = useAdminSmsAnalytics(timeRange);
  const { data: history, isLoading: historyLoading } = useAdminSmsHistory(historyFilters);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, userRole, authLoading, navigate]);

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRange);
  };

  if (authLoading) {
    return <PageLoader />;
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Accès non autorisé. Vous devez être administrateur pour accéder à cette page.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <BarChart3 className="h-8 w-8" />
                Analytics SMS - Administration
              </h1>
              <p className="text-muted-foreground mt-1">
                Vue globale des envois de SMS de tous les pêcheurs
              </p>
            </div>
            <SmsExportButton messages={history?.messages || []} disabled={historyLoading} />
          </div>

          {/* Time Range Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Période</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={timeRange} onValueChange={handleTimeRangeChange}>
                <TabsList>
                  <TabsTrigger value="24h">24 heures</TabsTrigger>
                  <TabsTrigger value="7d">7 jours</TabsTrigger>
                  <TabsTrigger value="30d">30 jours</TabsTrigger>
                  <TabsTrigger value="all">Tout</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <SmsSummaryCards analytics={analytics} loading={analyticsLoading} />

          {/* Charts */}
          <SmsCharts analytics={analytics} loading={analyticsLoading} />

          {/* Top Fishermen */}
          {analytics && analytics.topFishermen && analytics.topFishermen.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Pêcheurs par volume SMS</CardTitle>
                <CardDescription>Les pêcheurs les plus actifs sur la période</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topFishermen} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="boat_name" 
                      width={150}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Nombre de SMS" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* History Table */}
          <SmsHistoryTable
            history={history}
            loading={historyLoading}
            onFilterChange={setHistoryFilters}
            filters={historyFilters}
          />

          {/* Last Updated */}
          {analytics && (
            <p className="text-xs text-muted-foreground text-center">
              Dernière mise à jour : {new Date(analytics.lastUpdated).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSmsAnalyticsPage;
