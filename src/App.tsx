import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Carte from "./pages/Carte";
import PremiumPaywall from "./pages/PremiumPaywall";
import Compte from "./pages/Compte";
import Auth from "./pages/Auth";
import PecheurOnboarding from "./pages/PecheurOnboarding";
import PecheurDashboard from "./pages/PecheurDashboard";
import CreateArrivage from "./pages/CreateArrivage";
import Recettes from "./pages/Recettes";
import RecetteDetail from "./pages/RecetteDetail";
import Forfaits from "./pages/Forfaits";
import Arrivages from "./pages/Arrivages";
import UserDashboard from "./pages/UserDashboard";
import PremiumDashboard from "./pages/PremiumDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/carte" element={<Carte />} />
            <Route path="/premium" element={<PremiumPaywall />} />
          <Route path="/recettes" element={<Recettes />} />
          <Route path="/recettes/:id" element={<RecetteDetail />} />
          <Route path="/forfaits" element={<Forfaits />} />
          <Route path="/arrivages" element={<Arrivages />} />
            <Route path="/dashboard/user" element={<UserDashboard />} />
            <Route path="/dashboard/premium" element={<PremiumDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/compte" element={<Compte />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pecheur/onboarding" element={<PecheurOnboarding />} />
            <Route path="/pecheur/dashboard" element={<PecheurDashboard />} />
            <Route path="/pecheur/nouvel-arrivage" element={<CreateArrivage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
