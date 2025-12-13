import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmsSummaryCards } from './SmsSummaryCards';
import { SmsCharts } from './SmsCharts';
import { SmsHistoryTable } from './SmsHistoryTable';
import { SmsExportButton } from './SmsExportButton';
import { useSmsAnalytics } from '@/hooks/useSmsAnalytics';
import { useSmsHistory } from '@/hooks/useSmsHistory';
import { SmsHistoryFilters, TimeRange } from '@/types/sms-analytics';
import { BarChart3 } from 'lucide-react';

interface PecheurSmsAnalyticsProps {
  fishermanId: string;
}

export function PecheurSmsAnalytics({ fishermanId }: PecheurSmsAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [historyFilters, setHistoryFilters] = useState<SmsHistoryFilters>({
    page: 1,
    pageSize: 50,
  });

  const { data: analytics, isLoading: analyticsLoading } = useSmsAnalytics(fishermanId, timeRange);
  const { data: history, isLoading: historyLoading } = useSmsHistory(fishermanId, historyFilters);

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as TimeRange);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics SMS
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualisez et analysez vos envois de SMS
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
  );
}
