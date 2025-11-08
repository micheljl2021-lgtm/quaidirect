import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Carte from "./pages/Carte";
import Premium from "./pages/Premium";
import Compte from "./pages/Compte";
import Auth from "./pages/Auth";
import PecheurOnboarding from "./pages/PecheurOnboarding";
import PecheurDashboard from "./pages/PecheurDashboard";
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
            <Route path="/premium" element={<Premium />} />
            <Route path="/compte" element={<Compte />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pecheur/onboarding" element={<PecheurOnboarding />} />
            <Route path="/pecheur/dashboard" element={<PecheurDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
