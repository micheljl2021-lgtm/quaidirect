import { useState } from "react";
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

export function AdminRoleSwitcher() {
  const navigate = useNavigate();

  const viewAs = (role: string) => {
    switch (role) {
      case 'user':
        navigate('/mon-compte');
        break;
      case 'fisherman':
        navigate('/pecheur/dashboard');
        break;
      case 'premium':
        navigate('/premium/dashboard');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          Prévisualiser comme...
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Voir le site comme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => viewAs('user')} className="gap-2 cursor-pointer">
          <User className="h-4 w-4" />
          Utilisateur standard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => viewAs('premium')} className="gap-2 cursor-pointer">
          <Crown className="h-4 w-4" />
          Client Premium
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => viewAs('fisherman')} className="gap-2 cursor-pointer">
          <Fish className="h-4 w-4" />
          Pêcheur
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => viewAs('admin')} className="gap-2 cursor-pointer">
          <Shield className="h-4 w-4" />
          Admin (retour)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
