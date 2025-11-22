import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, User, MapPin, Menu, X, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-ocean">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">QuaiDirect</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/carte" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Carte des arrivages
          </Link>
          <Link to="/arrivages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Arrivages
          </Link>
          <Link to="/recettes" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Recettes
          </Link>
          <Link to="/forfaits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Forfaits
          </Link>
          <Link to="/premium" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Premium
          </Link>
          {userRole === 'user' && (
            <Link to="/dashboard/user" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Mon dashboard
            </Link>
          )}
          {userRole === 'premium' && (
            <Link to="/dashboard/premium" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Crown className="h-4 w-4" />
              Dashboard Premium
            </Link>
          )}
          {userRole === 'fisherman' && (
            <Link to="/dashboard/pecheur" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard pêcheur
            </Link>
          )}
          {userRole === 'admin' && (
            <Link to="/dashboard/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Shield className="h-4 w-4" />
              Dashboard Admin
            </Link>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
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
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-16 z-[60] bg-background backdrop-blur-sm md:hidden overflow-y-auto">
            <nav className="flex flex-col gap-4 p-6">
              <Link 
                to="/carte" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Carte des arrivages
              </Link>
              <Link 
                to="/arrivages" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Arrivages
              </Link>
              <Link 
                to="/recettes" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Recettes
              </Link>
              <Link 
                to="/forfaits" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Forfaits
              </Link>
              <Link 
                to="/premium" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Premium
              </Link>
              {userRole === 'user' && (
                <Link 
                  to="/dashboard/user" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mon dashboard
                </Link>
              )}
              {userRole === 'premium' && (
                <Link 
                  to="/dashboard/premium" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Crown className="h-4 w-4" />
                  Dashboard Premium
                </Link>
              )}
              {userRole === 'fisherman' && (
                <Link 
                  to="/dashboard/pecheur" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard pêcheur
                </Link>
              )}
              {userRole === 'admin' && (
                <Link 
                  to="/dashboard/admin" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  Dashboard Admin
                </Link>
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
