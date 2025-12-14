import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, MessageSquare, Package, TrendingUp } from "lucide-react";
import { FISHERMAN_PLANS } from "@/config/pricing";

interface FishermanSmsData {
  id: string;
  boat_name: string;
  company_name: string | null;
  email: string | null;
  user_id: string;
  plan: string | null;
  free_sms_used: number;
  paid_sms_balance: number;
  bonus_sms_at_signup: number;
  monthly_allocation: number;
}

const getPlanConfig = (planName: string | null) => {
  if (!planName) return { quota: 0, name: "Aucun", color: "secondary" as const };
  
  if (planName.includes("elite")) {
    return { quota: FISHERMAN_PLANS.ELITE.smsQuotaMonthly, name: "Elite", color: "destructive" as const };
  }
  if (planName.includes("pro")) {
    return { quota: FISHERMAN_PLANS.PRO.smsQuotaMonthly, name: "Pro", color: "default" as const };
  }
  if (planName.includes("standard") || planName.includes("basic")) {
    return { quota: FISHERMAN_PLANS.STANDARD.smsQuotaMonthly, name: "Standard", color: "secondary" as const };
  }
  
  return { quota: 50, name: planName, color: "outline" as const };
};

export const FishermenSmsTab = () => {
  const { data: fishermenSms, isLoading, error } = useQuery({
    queryKey: ["fishermen-sms-admin"],
    queryFn: async () => {
      // Get all verified fishermen with their payment info
      const { data: fishermen, error: fishError } = await supabase
        .from("fishermen")
        .select("id, boat_name, company_name, email, user_id")
        .not("verified_at", "is", null);

      if (fishError) throw fishError;
      if (!fishermen) return [];

      // Get current month
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Get SMS usage for current month
      const { data: smsUsage, error: usageError } = await supabase
        .from("fishermen_sms_usage")
        .select("*")
        .eq("month_year", currentMonth);

      if (usageError) throw usageError;

      // Get active payments/subscriptions
      const { data: payments, error: payError } = await supabase
        .from("payments")
        .select("user_id, plan, status")
        .in("status", ["active", "trialing"]);

      if (payError) throw payError;

      // Combine data
      const result: FishermanSmsData[] = fishermen.map((f) => {
        const usage = smsUsage?.find((u) => u.fisherman_id === f.id);
        const payment = payments?.find((p) => p.user_id === f.user_id);

        return {
          id: f.id,
          boat_name: f.boat_name,
          company_name: f.company_name,
          email: f.email,
          user_id: f.user_id,
          plan: payment?.plan || null,
          free_sms_used: usage?.free_sms_used || 0,
          paid_sms_balance: usage?.paid_sms_balance || 0,
          bonus_sms_at_signup: usage?.bonus_sms_at_signup || 0,
          monthly_allocation: usage?.monthly_allocation || 0,
        };
      });

      return result;
    },
  });

  // Calculate stats
  const stats = {
    totalFishermen: fishermenSms?.length || 0,
    totalSmsUsed: fishermenSms?.reduce((acc, f) => acc + f.free_sms_used, 0) || 0,
    totalBonusSms: fishermenSms?.reduce((acc, f) => acc + f.bonus_sms_at_signup + f.paid_sms_balance, 0) || 0,
    withActivePlan: fishermenSms?.filter((f) => f.plan).length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        Erreur lors du chargement des données SMS
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Pêcheurs vérifiés</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFishermen}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">SMS utilisés (mois)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSmsUsed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">SMS bonus total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBonusSms}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Avec abonnement</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withActivePlan}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quotas SMS par pêcheur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Bateau</TableHead>
                  <TableHead className="font-semibold">Plan</TableHead>
                  <TableHead className="font-semibold">Quota mensuel</TableHead>
                  <TableHead className="font-semibold">Utilisés</TableHead>
                  <TableHead className="font-semibold">Bonus</TableHead>
                  <TableHead className="font-semibold">Progression</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fishermenSms?.map((fisherman) => {
                  const planConfig = getPlanConfig(fisherman.plan);
                  const totalAvailable = planConfig.quota + fisherman.paid_sms_balance + fisherman.bonus_sms_at_signup;
                  const usagePercent = totalAvailable > 0 
                    ? Math.min(100, (fisherman.free_sms_used / totalAvailable) * 100) 
                    : 0;

                  return (
                    <TableRow key={fisherman.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{fisherman.boat_name}</div>
                          {fisherman.company_name && (
                            <div className="text-sm text-muted-foreground">{fisherman.company_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={planConfig.color}>{planConfig.name}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{planConfig.quota} SMS/mois</TableCell>
                      <TableCell>
                        <span className={fisherman.free_sms_used > planConfig.quota ? "text-destructive font-semibold" : "font-medium"}>
                          {fisherman.free_sms_used}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {fisherman.bonus_sms_at_signup + fisherman.paid_sms_balance}
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="flex items-center gap-2">
                          <Progress value={usagePercent} className="h-2" />
                          <span className="text-sm font-medium text-muted-foreground w-12">
                            {Math.round(usagePercent)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!fishermenSms || fishermenSms.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun pêcheur vérifié
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
