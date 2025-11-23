import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { SalesTab } from "@/components/admin/SalesTab";
import { ReservationsTab } from "@/components/admin/ReservationsTab";
import { PremiumSubscriptionsTab } from "@/components/admin/PremiumSubscriptionsTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { ImprovedUsersTab } from "@/components/admin/ImprovedUsersTab";
import { ImprovedDropsTab } from "@/components/admin/ImprovedDropsTab";
import { ImprovedFishermenTab } from "@/components/admin/ImprovedFishermenTab";

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (userRole !== "admin") {
      navigate("/");
      return;
    }
  }, [user, userRole, navigate]);

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard Admin</h1>
            <Badge className="gap-2">
              <Shield className="h-3 w-3" />
              Administrateur
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Contrôle total de la plateforme QuaiDirect
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-2">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="fishermen">Pêcheurs</TabsTrigger>
            <TabsTrigger value="drops">Arrivages</TabsTrigger>
            <TabsTrigger value="sales">Ventes</TabsTrigger>
            <TabsTrigger value="reservations">Réservations</TabsTrigger>
            <TabsTrigger value="offers">Offres</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;