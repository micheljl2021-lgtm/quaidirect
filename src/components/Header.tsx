import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClientSubscriptionLevel } from "@/hooks/useClientSubscriptionLevel";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, User, Menu, X, Shield, Download, Smartphone } from "lucide-react";
import { AdminRoleSwitcher } from "@/components/admin/AdminRoleSwitcher";
import logoQuaidirect from "@/assets/logo-quaidirect-full.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive 
      ? "text-primary font-semibold underline underline-offset-4" 
      : "text-muted-foreground hover:text-foreground"
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-base font-medium transition-colors py-2 ${
    isActive 
      ? "text-primary font-semibold" 
      : "text-foreground hover:text-primary"
  }`;

const Header = () => {
  const { user, userRole, signOut } = useAuth();
  const { isPremium, isPremiumPlus } = useClientSubscriptionLevel();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Un utilisateur avec abonnement premium/premium+ dans payments
  const hasClientPremiumSubscription = isPremium || isPremiumPlus;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleInstallClick = async () => {
    // Détecter iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isInstallable) {
      // Android et autres navigateurs compatibles - déclencher l'invite native
      await promptInstall();
    } else if (isIOS) {
      // iOS - afficher les instructions
      toast({
        title: "📱 Installer sur iPhone/iPad",
        description: "Appuyez sur le bouton Partager (⬆️) puis 'Sur l'écran d'accueil'",
        duration: 8000,
      });
    } else if (isInstalled) {
      toast({
        title: "✅ Application déjà installée",
        description: "QuaiDirect est déjà sur votre écran d'accueil !",
      });
    } else {
      // Fallback - rediriger vers la page de téléchargement
      navigate('/telecharger');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 md:h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center" 
          aria-label="Accueil QuaiDirect"
        >
          <img 
            src={logoQuaidirect} 
            alt="QuaiDirect" 
            className="h-12 md:h-16 lg:h-20 w-auto object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/carte" className={navLinkClass}>
            Carte des points de vente
          </NavLink>
          <NavLink to="/arrivages" className={navLinkClass}>
            Arrivages
          </NavLink>
          <NavLink to="/recettes" className={navLinkClass}>
            Recettes
          </NavLink>
          <NavLink to="/panier" className={navLinkClass}>
            Panier
          </NavLink>
          <NavLink to="/premium" className={navLinkClass}>
            Premium
          </NavLink>
          {/* Afficher dashboard user si rôle user ET pas d'abonnement premium */}
          {userRole === 'user' && !hasClientPremiumSubscription && (
            <NavLink to="/dashboard/user" className={navLinkClass}>
              Mon dashboard
            </NavLink>
          )}
          {/* Afficher dashboard premium si abonnement premium/premium+ dans payments */}
          {hasClientPremiumSubscription && userRole !== 'fisherman' && userRole !== 'admin' && (
            <NavLink to="/dashboard/premium" className={({ isActive }) => `${navLinkClass({ isActive })} flex items-center gap-1`}>
              <Crown className="h-4 w-4" aria-hidden="true" />
              Dashboard Premium
            </NavLink>
          )}
          {userRole === 'fisherman' && (
            <NavLink to="/dashboard/pecheur" className={navLinkClass}>
              Dashboard pêcheur
            </NavLink>
          )}
          {userRole === 'admin' && (
            <NavLink to="/dashboard/admin" className={({ isActive }) => `${navLinkClass({ isActive })} flex items-center gap-1`}>
              <Shield className="h-4 w-4" aria-hidden="true" />
              Dashboard Admin
            </NavLink>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {userRole === 'admin' && <AdminRoleSwitcher />}

          {!isInstalled && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={handleInstallClick}
            >
              <Smartphone className="h-4 w-4" />
              <span>Installer l'app</span>
            </Button>
          )}
          
          {!user && (
            <Link to="/premium">
              <Button variant="default" size="sm" className="gap-2 bg-gradient-ocean hover:opacity-90 transition-opacity">
                <Crown className="h-4 w-4" />
                <span>Devenir Premium</span>
              </Button>
            </Link>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer border-2 border-border hover:border-primary transition-colors">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {user.email}
                  {userRole && (
                    <span className="block text-xs text-muted-foreground capitalize">
                      {userRole}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/compte')}>
                  Mon compte
                </DropdownMenuItem>
                {userRole !== 'fisherman' && userRole !== 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/pecheur/onboarding')}>
                    Devenir pêcheur
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              Connexion
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </Button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute inset-x-0 top-16 z-[100] bg-background md:hidden border-t border-border shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="flex flex-col gap-3 p-6">
              <NavLink 
                to="/carte" 
                className={mobileNavLinkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Carte des points de vente
              </NavLink>
              <NavLink 
                to="/arrivages" 
                className={mobileNavLinkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Arrivages
              </NavLink>
              <NavLink 
                to="/recettes" 
                className={mobileNavLinkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Recettes
              </NavLink>
              <NavLink 
                to="/panier" 
                className={mobileNavLinkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Panier
              </NavLink>
              <NavLink 
                to="/premium" 
                className={mobileNavLinkClass}
                onClick={() => setIsMenuOpen(false)}
              >
                Premium
              </NavLink>
              {/* Afficher dashboard user si rôle user ET pas d'abonnement premium */}
              {userRole === 'user' && !hasClientPremiumSubscription && (
                <NavLink 
                  to="/dashboard/user" 
                  className={mobileNavLinkClass}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mon dashboard
                </NavLink>
              )}
              {/* Afficher dashboard premium si abonnement premium/premium+ dans payments */}
              {hasClientPremiumSubscription && userRole !== 'fisherman' && userRole !== 'admin' && (
                <NavLink 
                  to="/dashboard/premium" 
                  className={({ isActive }) => `${mobileNavLinkClass({ isActive })} flex items-center gap-2`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Crown className="h-4 w-4" />
                  Dashboard Premium
                </NavLink>
              )}
              {userRole === 'fisherman' && (
                <NavLink 
                  to="/dashboard/pecheur" 
                  className={mobileNavLinkClass}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard pêcheur
                </NavLink>
              )}
              {userRole === 'admin' && (
                <NavLink 
                  to="/dashboard/admin" 
                  className={({ isActive }) => `${mobileNavLinkClass({ isActive })} flex items-center gap-2`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  Dashboard Admin
                </NavLink>
              )}
              
              {!isInstalled && (
                <button 
                  className="text-base font-medium transition-colors py-2 text-foreground hover:text-primary flex items-center gap-2"
                  onClick={() => {
                    handleInstallClick();
                    setIsMenuOpen(false);
                  }}
                >
                  <Smartphone className="h-4 w-4" />
                  Installer l'app
                </button>
              )}
              
              <div className="border-t my-2" />
              
              {user ? (
                <>
                  <Link 
                    to="/compte" 
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mon compte
                  </Link>
                  {userRole !== 'fisherman' && userRole !== 'admin' && (
                    <Link 
                      to="/pecheur/onboarding" 
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Devenir pêcheur
                    </Link>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    Déconnexion
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  Connexion
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
