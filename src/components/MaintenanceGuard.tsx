import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MAINTENANCE_MODE } from "@/lib/constants";
import MaintenancePage from "@/pages/MaintenancePage";

interface MaintenanceGuardProps {
  children: ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { user, userRole, loading } = useAuth();

  // Si mode maintenance désactivé, afficher le site normalement
  if (!MAINTENANCE_MODE) {
    return <>{children}</>;
  }

  // Pendant le chargement de l'auth, afficher une page de maintenance simple
  // pour éviter le flash du contenu
  if (loading) {
    return <MaintenancePage showAdminLink={false} />;
  }

  // Si l'utilisateur est admin, bypass la maintenance
  const isAdmin = userRole === "admin";
  if (user && isAdmin) {
    return <>{children}</>;
  }

  // Sinon afficher la page de maintenance
  return <MaintenancePage showAdminLink={true} />;
}
