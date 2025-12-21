import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, User, Fish, Crown, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AdminRoleSwitcher() {
  const navigate = useNavigate();
  const { setViewAsRole, clearViewAsRole, viewAsRole } = useAuth();

  const go = (role: 'user' | 'premium' | 'fisherman' | 'admin') => {
    switch (role) {
      case 'user':
        setViewAsRole('user');
        navigate('/dashboard/user');
        break;
      case 'premium':
        setViewAsRole('premium');
        navigate('/dashboard/premium');
        break;
      case 'fisherman':
        setViewAsRole('fisherman');
        navigate('/dashboard/pecheur');
        break;
      case 'admin':
      default:
        clearViewAsRole();
        navigate('/dashboard/admin');
        break;
    }
  };

  const label = viewAsRole
    ? viewAsRole === 'user'
      ? 'Test : utilisateur'
      : viewAsRole === 'premium'
        ? 'Test : premium'
        : viewAsRole === 'fisherman'
          ? 'Test : pêcheur'
          : 'Admin'
    : 'Admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Tester le site comme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => go('user')} className="gap-2 cursor-pointer">
          <User className="h-4 w-4" />
          Utilisateur standard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go('premium')} className="gap-2 cursor-pointer">
          <Crown className="h-4 w-4" />
          Client Premium
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go('fisherman')} className="gap-2 cursor-pointer">
          <Fish className="h-4 w-4" />
          Pêcheur
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => go('admin')} className="gap-2 cursor-pointer">
          <Shield className="h-4 w-4" />
          Retour Admin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
