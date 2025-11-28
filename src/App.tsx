import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedFisherRoute } from "@/components/ProtectedFisherRoute";
import Landing from "./pages/Landing";
import Carte from "./pages/Carte";
import PremiumPaywall from "./pages/PremiumPaywall";
import PremiumSuccess from "./pages/PremiumSuccess";
import PremiumSettings from "./pages/PremiumSettings";
import CGV from "./pages/CGV";
import MentionsLegales from "./pages/MentionsLegales";
import Compte from "./pages/Compte";
import Auth from "./pages/Auth";
import PecheurOnboarding from "./pages/PecheurOnboarding";
import PecheurPayment from "./pages/PecheurPayment";
import PecheurDashboard from "./pages/PecheurDashboard";
import CreateArrivage from "./pages/CreateArrivage";
import EditArrivage from "./pages/EditArrivage";
import FisherProfile from "./pages/FisherProfile";
import EditFisherProfile from "./pages/EditFisherProfile";
import Recettes from "./pages/Recettes";
import RecetteDetail from "./pages/RecetteDetail";
import Panier from "./pages/Panier";
import Arrivages from "./pages/Arrivages";
import UserDashboard from "./pages/UserDashboard";
import PremiumDashboard from "./pages/PremiumDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DemoTracabilite from "./pages/DemoTracabilite";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import OnboardingConfirmation from "./pages/OnboardingConfirmation";
import PecheurPaymentSuccess from "./pages/PecheurPaymentSuccess";
import PecheurContacts from "./pages/PecheurContacts";
import AmbassadorPartner from "./pages/AmbassadorPartner";
import PecheurAmbassadorStatus from "./pages/PecheurAmbassadorStatus";
import MarineAI from "./pages/MarineAI";

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
            <Route path="/premium/success" element={<PremiumSuccess />} />
            <Route path="/premium/reglages" element={<PremiumSettings />} />
            <Route path="/cgv" element={<CGV />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/demo-tracabilite" element={<DemoTracabilite />} />
          <Route path="/recettes" element={<Recettes />} />
          <Route path="/recettes/:id" element={<RecetteDetail />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/arrivages" element={<Arrivages />} />
            <Route path="/dashboard/user" element={<UserDashboard />} />
            <Route path="/dashboard/premium" element={<PremiumDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/pecheur" element={<PecheurDashboard />} />
            <Route path="/compte" element={<Compte />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pecheur/payment" element={<PecheurPayment />} />
            <Route path="/pecheur/payment-success" element={<PecheurPaymentSuccess />} />
            <Route path="/pecheur/contacts" element={<PecheurContacts />} />
            <Route path="/pecheur/onboarding" element={
              <ProtectedFisherRoute>
                <PecheurOnboarding />
              </ProtectedFisherRoute>
            } />
            <Route path="/onboarding/confirmation" element={<OnboardingConfirmation />} />
            <Route path="/pecheur/nouvel-arrivage" element={<CreateArrivage />} />
            <Route path="/pecheur/modifier-arrivage/:dropId" element={
              <ProtectedFisherRoute>
                <EditArrivage />
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/edit-profile" element={<EditFisherProfile />} />
            <Route path="/pecheur/ambassadeur" element={<PecheurAmbassadorStatus />} />
            <Route path="/pecheur/ia-marin" element={<MarineAI />} />
            <Route path="/ambassadeur-partenaire" element={<AmbassadorPartner />} />
            <Route path="/pecheur/:id" element={<FisherProfile />} />
            <Route path="/pecheurs/:slug" element={<FisherProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
