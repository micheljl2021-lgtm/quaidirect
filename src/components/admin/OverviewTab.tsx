import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Fish, Anchor, Package, DollarSign, Star, Bell, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function OverviewTab() {
  const { data: stats } = useQuery({
    queryKey: ['admin-overview-stats'],
    queryFn: async () => {
      const [users, fishermen, drops, offers, sales, reservations, premiumSubs, notifications] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('fishermen').select('id', { count: 'exact', head: true }).not('verified_at', 'is', null),
        supabase.from('drops').select('id', { count: 'exact', head: true }),
        supabase.from('offers').select('id', { count: 'exact', head: true }),
        supabase.from('sales').select('total_price, created_at').eq('status', 'completed'),
        supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'active').in('plan', ['premium_monthly', 'premium_annual', 'premium_plus_monthly', 'premium_plus_annual', 'premium']),
        supabase.from('notifications').select('id, created_at'),
      ]);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthSales = sales.data?.filter(s => new Date(s.created_at) >= thisMonth) || [];
      const monthRevenue = monthSales.reduce((sum, s) => sum + (s.total_price || 0), 0);
      const todayNotifications = notifications.data?.filter(n => 
        new Date(n.created_at).toDateString() === new Date().toDateString()
      ).length || 0;

      return {
        users: users.count || 0,
        fishermen: fishermen.count || 0,
        drops: drops.count || 0,
        offers: offers.count || 0,
        monthSales: monthSales.length,
        monthRevenue,
        activeReservations: reservations.count || 0,
        activePremium: premiumSubs.count || 0,
        todayNotifications,
      };
    },
  });

  const { data: salesChart } = useQuery({
    queryKey: ['admin-sales-chart'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sales')
        .select('created_at, total_price')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });

      const last30Days = new Array(30).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          ventes: 0,
          revenue: 0,
        };
      });

      data?.forEach(sale => {
        const dateStr = sale.created_at.split('T')[0];
        const dayData = last30Days.find(d => d.date === dateStr);
        if (dayData) {
          dayData.ventes += 1;
          dayData.revenue += sale.total_price || 0;
        }
      });

      return last30Days;
    },
  });

  const { data: rolesChart } = useQuery({
    queryKey: ['admin-roles-chart'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role');

      const counts: Record<string, number> = {};
      data?.forEach(r => {
        counts[r.role] = (counts[r.role] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pêcheurs Vérifiés</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fishermen}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrivages</CardTitle>
            <Anchor className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.drops}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offres</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.offers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes ce mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus du mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthRevenue.toFixed(2)}€</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Actifs</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePremium}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications aujourd'hui</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayNotifications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventes (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ventes" stroke="hsl(var(--primary))" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des rôles</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={rolesChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {rolesChart?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}