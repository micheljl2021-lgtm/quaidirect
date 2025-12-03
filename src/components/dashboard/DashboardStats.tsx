import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStatsProps {
  drops: any[];
}

const DashboardStats = ({ drops }: DashboardStatsProps) => {
  const todayCount = drops.filter(d => {
    const today = new Date().toDateString();
    return new Date(d.eta_at).toDateString() === today;
  }).length;

  const totalOffers = drops.reduce((sum, d) => sum + (d.offers?.length || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Aujourd'hui</CardDescription>
          <CardTitle className="text-3xl">{todayCount}</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Actifs</CardDescription>
          <CardTitle className="text-3xl">{drops.length}</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total offres</CardDescription>
          <CardTitle className="text-3xl">{totalOffers}</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total arrivages</CardDescription>
          <CardTitle className="text-3xl">{drops.length}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
};

export default DashboardStats;
