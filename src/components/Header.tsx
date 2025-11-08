import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, User, MapPin } from "lucide-react";

const Header = () => {
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

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/carte" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Carte des arrivages
          </Link>
          <Link to="/premium" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Premium
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link to="/premium">
            <Button variant="default" size="sm" className="gap-2 bg-gradient-ocean hover:opacity-90 transition-opacity">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Devenir Premium</span>
            </Button>
          </Link>
          
          <Link to="/compte">
            <Avatar className="h-9 w-9 cursor-pointer border-2 border-border hover:border-primary transition-colors">
              <AvatarFallback className="bg-secondary">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
