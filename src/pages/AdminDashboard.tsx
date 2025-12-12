import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, MessageSquare } from "lucide-react";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { ImprovedUsersTab } from "@/components/admin/ImprovedUsersTab";
import { ImprovedFishermenTab } from "@/components/admin/ImprovedFishermenTab";
import { ImprovedDropsTab } from "@/components/admin/ImprovedDropsTab";
import { SalesTab } from "@/components/admin/SalesTab";
import { ReservationsTab } from "@/components/admin/ReservationsTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { PremiumSubscriptionsTab } from "@/components/admin/PremiumSubscriptionsTab";
import { FishermanSubscriptionsTab } from "@/components/admin/FishermanSubscriptionsTab";
import { ContactsTab } from "@/components/admin/ContactsTab";
import { SupportRequestsTab } from "@/components/admin/SupportRequestsTab";
import PublicInquiriesTab from "@/components/admin/PublicInquiriesTab";
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
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-2">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="fishermen">Pêcheurs</TabsTrigger>
            <TabsTrigger value="drops">Arrivages</TabsTrigger>
            <TabsTrigger value="sales">Ventes</TabsTrigger>
            <TabsTrigger value="reservations">Réservations</TabsTrigger>
            <TabsTrigger value="offers">Offres</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
            <TabsTrigger value="fisherman-subs">Pêcheurs Abo</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="support">Demandes</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              <MessageSquare className="h-4 w-4 mr-1" />
              Messages
              {newInquiriesCount && newInquiriesCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {newInquiriesCount}
                </span>
              ) : null}
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

          <TabsContent value="fisherman-subs" className="space-y-6">
            <FishermanSubscriptionsTab />
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
