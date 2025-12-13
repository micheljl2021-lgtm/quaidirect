import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SmsAnalytics } from '@/types/sms-analytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getTypeLabel, getStatusColor, getStatusLabel } from '@/lib/sms-analytics';

interface SmsChartsProps {
  analytics: SmsAnalytics | undefined;
  loading?: boolean;
}

const COLORS = {
  invitation: '#3b82f6',
  notification: '#10b981',
  promotion: '#f59e0b',
};

export function SmsCharts({ analytics, loading }: SmsChartsProps) {
  if (loading || !analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chargement...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Chargement des graphiques...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Daily SMS Volume */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Volume SMS par jour</CardTitle>
          <CardDescription>Nombre de SMS envoyés quotidiennement</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('fr-FR')}
                formatter={(value: any) => [value, 'SMS']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                name="Nombre de SMS" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* SMS by Type (Pie Chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par type</CardTitle>
          <CardDescription>Distribution des types de messages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.byType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, count }) => `${getTypeLabel(type)}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.byType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.type as keyof typeof COLORS] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any, name) => [value, 'Messages']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* SMS by Status (Bar Chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Statuts des messages</CardTitle>
          <CardDescription>Répartition par statut d'envoi</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.byStatus}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="status" 
                tickFormatter={(value) => getStatusLabel(value)}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => getStatusLabel(value)}
                formatter={(value: any) => [value, 'Messages']}
              />
              <Bar dataKey="count" name="Nombre">
                {analytics.byStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost by Type */}
      {analytics.byType.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Coût par type de message</CardTitle>
            <CardDescription>Dépenses par catégorie de SMS</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.byType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="type" 
                  tickFormatter={(value) => getTypeLabel(value)}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => getTypeLabel(value)}
                  formatter={(value: any) => [`${value.toFixed(2)}€`, 'Coût']}
                />
                <Legend />
                <Bar dataKey="cost" name="Coût (€)" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
