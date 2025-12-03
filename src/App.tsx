import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedFisherRoute } from "@/components/ProtectedFisherRoute";
import PageLoader from "@/components/PageLoader";

// Critical pages - loaded immediately
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages for better performance
const Carte = lazy(() => import("./pages/Carte"));
const PremiumPaywall = lazy(() => import("./pages/PremiumPaywall"));
const PremiumSuccess = lazy(() => import("./pages/PremiumSuccess"));
const PremiumSettings = lazy(() => import("./pages/PremiumSettings"));
const CGV = lazy(() => import("./pages/CGV"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const Compte = lazy(() => import("./pages/Compte"));
const PecheurOnboarding = lazy(() => import("./pages/PecheurOnboarding"));
const PecheurPayment = lazy(() => import("./pages/PecheurPayment"));
const PecheurDashboard = lazy(() => import("./pages/PecheurDashboard"));
const CreateArrivage = lazy(() => import("./pages/CreateArrivage"));
const SimpleAnnonce = lazy(() => import("./pages/SimpleAnnonce"));
const EditArrivage = lazy(() => import("./pages/EditArrivage"));
const DuplicateArrivage = lazy(() => import("./pages/DuplicateArrivage"));
const FisherProfile = lazy(() => import("./pages/FisherProfile"));
const EditFisherProfile = lazy(() => import("./pages/EditFisherProfile"));
const Recettes = lazy(() => import("./pages/Recettes"));
const RecetteDetail = lazy(() => import("./pages/RecetteDetail"));
const Panier = lazy(() => import("./pages/Panier"));
const PanierSuccess = lazy(() => import("./pages/PanierSuccess"));
const Arrivages = lazy(() => import("./pages/Arrivages"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const PremiumDashboard = lazy(() => import("./pages/PremiumDashboard"));
const DemoTracabilite = lazy(() => import("./pages/DemoTracabilite"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OnboardingConfirmation = lazy(() => import("./pages/OnboardingConfirmation"));
const PecheurPaymentSuccess = lazy(() => import("./pages/PecheurPaymentSuccess"));
const PecheurContacts = lazy(() => import("./pages/PecheurContacts"));
const AmbassadorPartner = lazy(() => import("./pages/AmbassadorPartner"));
const PecheurAmbassadorStatus = lazy(() => import("./pages/PecheurAmbassadorStatus"));
const PecheurPreferences = lazy(() => import("./pages/PecheurPreferences"));
const DropDetail = lazy(() => import("./pages/DropDetail"));
const CommentCaMarche = lazy(() => import("./pages/CommentCaMarche"));
const DevenirPecheur = lazy(() => import("./pages/DevenirPecheur"));
const PoissonFraisHyeres = lazy(() => import("./pages/seo/PoissonFraisHyeres"));
const PoissonFraisToulon = lazy(() => import("./pages/seo/PoissonFraisToulon"));
const PoissonFraisLaRochelle = lazy(() => import("./pages/seo/PoissonFraisLaRochelle"));
const PecheurSupport = lazy(() => import("./pages/PecheurSupport"));
const SecureProfileEdit = lazy(() => import("./pages/SecureProfileEdit"));
const EditSalePoints = lazy(() => import("./pages/EditSalePoints"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const MarineAIRefactored = lazy(() => import("./pages/MarineAIRefactored"));
const CreateArrivageWizard = lazy(() => import("./pages/CreateArrivageWizard"));

const queryClient = new QueryClient();

// Wrapper for lazy-loaded routes
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Critical routes - no lazy loading */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            {/* Lazy-loaded public routes */}
            <Route path="/carte" element={<LazyRoute><Carte /></LazyRoute>} />
            <Route path="/premium" element={<LazyRoute><PremiumPaywall /></LazyRoute>} />
            <Route path="/premium/success" element={<LazyRoute><PremiumSuccess /></LazyRoute>} />
            <Route path="/premium/reglages" element={<LazyRoute><PremiumSettings /></LazyRoute>} />
            <Route path="/cgv" element={<LazyRoute><CGV /></LazyRoute>} />
            <Route path="/mentions-legales" element={<LazyRoute><MentionsLegales /></LazyRoute>} />
            <Route path="/demo-tracabilite" element={<LazyRoute><DemoTracabilite /></LazyRoute>} />
            <Route path="/recettes" element={<LazyRoute><Recettes /></LazyRoute>} />
            <Route path="/recettes/:id" element={<LazyRoute><RecetteDetail /></LazyRoute>} />
            <Route path="/panier" element={<LazyRoute><Panier /></LazyRoute>} />
            <Route path="/panier/success" element={<LazyRoute><PanierSuccess /></LazyRoute>} />
            <Route path="/arrivages" element={<LazyRoute><Arrivages /></LazyRoute>} />
            <Route path="/comment-ca-marche" element={<LazyRoute><CommentCaMarche /></LazyRoute>} />
            <Route path="/devenir-pecheur" element={<LazyRoute><DevenirPecheur /></LazyRoute>} />
            <Route path="/ambassadeur-partenaire" element={<LazyRoute><AmbassadorPartner /></LazyRoute>} />
            <Route path="/drop/:id" element={<LazyRoute><DropDetail /></LazyRoute>} />
            <Route path="/pecheurs/:slug" element={<LazyRoute><FisherProfile /></LazyRoute>} />
            <Route path="/reset-password" element={<LazyRoute><ResetPassword /></LazyRoute>} />
            <Route path="/onboarding/confirmation" element={<LazyRoute><OnboardingConfirmation /></LazyRoute>} />
            <Route path="/secure/profile/edit" element={<LazyRoute><SecureProfileEdit /></LazyRoute>} />

            {/* SEO pages */}
            <Route path="/poisson-frais-hyeres" element={<LazyRoute><PoissonFraisHyeres /></LazyRoute>} />
            <Route path="/poisson-frais-toulon" element={<LazyRoute><PoissonFraisToulon /></LazyRoute>} />
            <Route path="/poisson-frais-la-rochelle" element={<LazyRoute><PoissonFraisLaRochelle /></LazyRoute>} />

            {/* User dashboard routes */}
            <Route path="/dashboard/user" element={<LazyRoute><UserDashboard /></LazyRoute>} />
            <Route path="/dashboard/premium" element={<LazyRoute><PremiumDashboard /></LazyRoute>} />
            <Route path="/dashboard/admin" element={<LazyRoute><AdminDashboard /></LazyRoute>} />
            <Route path="/dashboard/pecheur" element={<LazyRoute><PecheurDashboard /></LazyRoute>} />
            <Route path="/compte" element={<LazyRoute><Compte /></LazyRoute>} />

            {/* Pecheur payment routes */}
            <Route path="/pecheur/payment" element={<LazyRoute><PecheurPayment /></LazyRoute>} />
            <Route path="/pecheur/payment-success" element={<LazyRoute><PecheurPaymentSuccess /></LazyRoute>} />

            {/* Protected pecheur routes */}
            <Route path="/pecheur/points-de-vente" element={
              <ProtectedFisherRoute>
                <LazyRoute><EditSalePoints /></LazyRoute>
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/contacts" element={
              <ProtectedFisherRoute>
                <LazyRoute><PecheurContacts /></LazyRoute>
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/onboarding" element={
              <ProtectedFisherRoute>
                <LazyRoute><PecheurOnboarding /></LazyRoute>
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/nouvel-arrivage" element={
              <ProtectedFisherRoute>
                <LazyRoute><CreateArrivage /></LazyRoute>
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/annonce-simple" element={
              <ProtectedFisherRoute>
                <LazyRoute><SimpleAnnonce /></LazyRoute>
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/nouvel-arrivage-v2" element={
              <ProtectedFisherRoute>
                <LazyRoute><CreateArrivageWizard /></LazyRoute>
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/modifier-arrivage/:dropId" element={
              <ProtectedFisherRoute>
                <LazyRoute><EditArrivage /></LazyRoute>
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/dupliquer-arrivage/:dropId" element={
              <ProtectedFisherRoute>
                <LazyRoute><DuplicateArrivage /></LazyRoute>
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/edit-profile" element={
              <ProtectedFisherRoute>
                <LazyRoute><EditFisherProfile /></LazyRoute>
              </ProtectedFisherRoute>
            } />
            <Route path="/pecheur/ambassadeur" element={<LazyRoute><PecheurAmbassadorStatus /></LazyRoute>} />
            <Route path="/pecheur/ia-marin" element={<LazyRoute><MarineAIRefactored /></LazyRoute>} />
            <Route path="/pecheur/support" element={<LazyRoute><PecheurSupport /></LazyRoute>} />
            <Route path="/pecheur/preferences" element={<LazyRoute><PecheurPreferences /></LazyRoute>} />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
