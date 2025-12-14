import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, MessageSquare, Bell } from "lucide-react";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { ImprovedUsersTab } from "@/components/admin/ImprovedUsersTab";
import { ImprovedFishermenTab } from "@/components/admin/ImprovedFishermenTab";
import { ImprovedDropsTab } from "@/components/admin/ImprovedDropsTab";
import { SalesTab } from "@/components/admin/SalesTab";
import { ReservationsTab } from "@/components/admin/ReservationsTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { PremiumSubscriptionsTab } from "@/components/admin/PremiumSubscriptionsTab";
import { FishermenSmsTab } from "@/components/admin/FishermenSmsTab";
import { ContactsTab } from "@/components/admin/ContactsTab";
import { SupportRequestsTab } from "@/components/admin/SupportRequestsTab";
import PublicInquiriesTab from "@/components/admin/PublicInquiriesTab";
import { PlatformUpdatesTab } from "@/components/admin/PlatformUpdatesTab";
import { getRedirectPathByRole } from "@/lib/authRedirect";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  // Fetch new inquiries count for badge
  const { data: newInquiriesCount } = useQuery({
    queryKey: ["new-inquiries-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("launch_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (userRole !== "admin") {
      navigate(getRedirectPathByRole(userRole));
      return;
    }
  }, [user, userRole, loading, navigate]);

  if (loading || userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20">
              <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard Admin</h1>
            <Badge className="gap-2">
              <Shield className="h-3 w-3" aria-hidden="true" />
              Administrateur
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Contrôle total de la plateforme QuaiDirect
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto gap-1 pb-2 scrollbar-thin">
            <TabsTrigger value="overview" className="whitespace-nowrap">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users" className="whitespace-nowrap">Utilisateurs</TabsTrigger>
            <TabsTrigger value="fishermen" className="whitespace-nowrap">Pêcheurs</TabsTrigger>
            <TabsTrigger value="drops" className="whitespace-nowrap">Arrivages</TabsTrigger>
            <TabsTrigger value="sales" className="whitespace-nowrap">Ventes</TabsTrigger>
            <TabsTrigger value="reservations" className="whitespace-nowrap">Réservations</TabsTrigger>
            <TabsTrigger value="offers" className="whitespace-nowrap">Offres</TabsTrigger>
            <TabsTrigger value="premium" className="whitespace-nowrap">Premium</TabsTrigger>
            <TabsTrigger value="fisherman-sms" className="whitespace-nowrap">SMS Pêcheurs</TabsTrigger>
            <TabsTrigger value="contacts" className="whitespace-nowrap">Contacts</TabsTrigger>
            <TabsTrigger value="support" className="whitespace-nowrap">Demandes</TabsTrigger>
            <TabsTrigger value="messages" className="relative whitespace-nowrap">
              <MessageSquare className="h-4 w-4 mr-1" />
              Messages
              {newInquiriesCount && newInquiriesCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {newInquiriesCount}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="updates" className="whitespace-nowrap">
              <Bell className="h-4 w-4 mr-1" />
              MAJ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <ImprovedUsersTab />
          </TabsContent>

          <TabsContent value="fishermen" className="space-y-6">
            <ImprovedFishermenTab />
          </TabsContent>

          <TabsContent value="drops" className="space-y-6">
            <ImprovedDropsTab />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <SalesTab />
          </TabsContent>

          <TabsContent value="reservations" className="space-y-6">
            <ReservationsTab />
          </TabsContent>

          <TabsContent value="offers" className="space-y-6">
            <OffersTab />
          </TabsContent>

          <TabsContent value="premium" className="space-y-6">
            <PremiumSubscriptionsTab />
          </TabsContent>

          <TabsContent value="fisherman-sms" className="space-y-6">
            <FishermenSmsTab />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <ContactsTab />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <SupportRequestsTab />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <PublicInquiriesTab />
          </TabsContent>

          <TabsContent value="updates" className="space-y-6">
            <PlatformUpdatesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
