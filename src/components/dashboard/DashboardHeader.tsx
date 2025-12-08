import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Anchor, Plus, MessageSquare, Settings, Users, Crown, Bot, Pencil, HelpCircle } from 'lucide-react';

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

  return (
    <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Tableau de bord
        </h1>
        <p className="text-lg text-muted-foreground">
          Gérez vos arrivages et ventes
        </p>
      </div>
      <div className="flex gap-3 flex-wrap">
        {fishermanId && (
          <>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2"
              onClick={handleViewStorefront}
            >
              <Anchor className="h-5 w-5" />
              Ma page vitrine
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/pecheur/preferences')}
            >
              <Settings className="h-5 w-5" />
              Préférences
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/pecheur/edit-profile')}
            >
              <Pencil className="h-5 w-5" />
              Ma vitrine
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/pecheur/contacts')}
            >
              <Users className="h-5 w-5" />
              Carnet de clients
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 border-0"
              onClick={() => navigate('/pecheur/ia-marin')}
            >
              <Bot className="h-5 w-5" />
              IA du Marin
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 border-0"
              onClick={() => navigate('/pecheur/support')}
            >
              <HelpCircle className="h-5 w-5" />
              Contacter l'admin
            </Button>
          </>
        )}
        <Button 
          size="lg" 
          className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          onClick={() => navigate('/pecheur/annonce-simple')}
        >
          <MessageSquare className="h-5 w-5" />
          Arrivage
        </Button>
        <Button 
          size="lg" 
          className="gap-2"
          onClick={() => navigate('/pecheur/nouvel-arrivage-v2')}
        >
          <Plus className="h-5 w-5" />
          Arrivage premium
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
