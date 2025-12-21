import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Anchor, Calendar, Package, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  drops: any[];
  archivedDrops?: any[];
}

const DashboardStats = ({ drops, archivedDrops = [] }: DashboardStatsProps) => {
  const todayCount = drops.filter(d => {
    const today = new Date().toDateString();
    return new Date(d.eta_at).toDateString() === today;
  }).length;

  const totalOffers = drops.reduce((sum, d) => sum + (d.offers?.length || 0), 0);
  const totalDrops = drops.length + archivedDrops.length;

  const stats = [
    { label: "Aujourd'hui", value: todayCount, icon: Calendar, color: 'text-blue-500' },
    { label: 'Actifs', value: drops.length, icon: Anchor, color: 'text-green-500' },
    { label: 'Total offres', value: totalOffers, icon: Package, color: 'text-orange-500' },
    { label: 'Total arrivages', value: totalDrops, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-3 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs md:text-sm">{stat.label}</CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.color} hidden sm:block`} aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl md:text-3xl">{stat.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
