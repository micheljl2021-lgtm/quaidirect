import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Anchor, Plus, Settings, Users, Bot, Pencil, HelpCircle, Map, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  fishermanId: string | null;
}

const DashboardHeader = ({ fishermanId }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  const handleViewStorefront = async () => {
    if (!fishermanId) return;
    const { data } = await supabase
      .from('fishermen')
      .select('slug')
      .eq('id', fishermanId)
      .maybeSingle();
    if (data?.slug) {
      navigate(`/pecheurs/${data.slug}`);
    }
  };

  // Actions groupées pour le menu mobile
  const mobileActions = [
    { icon: Anchor, label: 'Ma page vitrine', onClick: handleViewStorefront },
    { icon: Settings, label: 'Préférences', onClick: () => navigate('/pecheur/preferences') },
    { icon: Pencil, label: 'Ma vitrine', onClick: () => navigate('/pecheur/edit-profile') },
    { icon: Users, label: 'Carnet de clients', onClick: () => navigate('/pecheur/contacts') },
    { icon: Map, label: 'Mes zones', onClick: () => navigate('/pecheur/zones-reglementaires') },
    { icon: Bot, label: 'IA du Marin', onClick: () => navigate('/pecheur/ia-marin'), special: 'ai' },
    { icon: HelpCircle, label: 'Contacter l\'admin', onClick: () => navigate('/pecheur/support'), special: 'support' },
  ];

  return (
    <div className="mb-6 md:mb-8 flex flex-col gap-4">
      {/* Titre et description */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 md:mb-2">
          Tableau de bord
        </h1>
        <p className="text-sm md:text-lg text-muted-foreground">
          Publiez vos arrivages et prévenez vos clients
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Bouton principal toujours visible */}
        <Button 
          size="default"
          className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex-1 sm:flex-none min-w-[140px]"
          onClick={() => navigate('/pecheur/nouvel-arrivage')}
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          <span className="text-sm sm:text-base">Nouvel arrivage</span>
        </Button>

        {fishermanId && (
          <>
            {/* Desktop: tous les boutons visibles */}
            <div className="hidden lg:flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleViewStorefront}>
                <Anchor className="h-4 w-4" aria-hidden="true" />
                Ma page vitrine
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/pecheur/preferences')}>
                <Settings className="h-4 w-4" aria-hidden="true" />
                Préférences
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/pecheur/edit-profile')}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Ma vitrine
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/pecheur/contacts')}>
                <Users className="h-4 w-4" aria-hidden="true" />
                Carnet de clients
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => navigate('/pecheur/zones-reglementaires')}>
                <Map className="h-4 w-4" aria-hidden="true" />
                Mes zones
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0"
                onClick={() => navigate('/pecheur/ia-marin')}
              >
                <Bot className="h-4 w-4" aria-hidden="true" />
                IA du Marin
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 border-0"
                onClick={() => navigate('/pecheur/support')}
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                Support
              </Button>
            </div>

            {/* Tablette/Mobile: menu déroulant */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="default" variant="outline" className="gap-2">
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    <span className="text-sm">Plus</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background z-50">
                  {mobileActions.map((action, index) => (
                    <DropdownMenuItem
                      key={action.label}
                      onClick={action.onClick}
                      className={`gap-3 py-3 cursor-pointer ${
                        action.special === 'ai' ? 'text-purple-600 dark:text-purple-400' :
                        action.special === 'support' ? 'text-orange-600 dark:text-orange-400' : ''
                      }`}
                    >
                      <action.icon className="h-4 w-4" aria-hidden="true" />
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
