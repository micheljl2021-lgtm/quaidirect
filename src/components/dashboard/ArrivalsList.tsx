import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Anchor, CheckCircle, Copy, Package, Pencil, Plus, History } from 'lucide-react';
import { ShareDropButton } from '@/components/SocialShareButtons';

interface ArrivalsListProps {
  drops: any[];
  archivedDrops: any[];
  fishermanId: string | null;
  onRefresh: () => void;
}

const ArrivalsList = ({ drops, archivedDrops, fishermanId, onRefresh }: ArrivalsListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSaveAsTemplate = async (e: React.MouseEvent, drop: any) => {
    e.stopPropagation();
    const arrivageData = {
      salePointId: drop.sale_point_id || drop.port_id,
      salePointName: drop.sale_point?.label || drop.port?.name,
      timeSlot: "matin",
      species: drop.offers?.map((o: any) => ({
        id: o.id,
        speciesId: o.species_id,
        speciesName: o.title,
        quantity: o.total_units,
        unit: o.price_type === 'per_kg' ? 'kg' : 'pieces',
        price: o.unit_price,
        remark: o.description,
      })) || [],
    };
    
    const name = prompt("Nom du modèle :");
    if (name) {
      const { error } = await supabase
        .from("drop_templates")
        .insert({
          fisherman_id: fishermanId,
          name,
          icon: "⭐",
          payload: arrivageData,
          usage_count: 0,
        });
      
      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de sauvegarder le modèle',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Modèle enregistré !',
          description: `Tu pourras réutiliser "${name}" pour créer rapidement des arrivages similaires`,
        });
      }
    }
  };

  const handleComplete = async (e: React.MouseEvent, dropId: string) => {
    e.stopPropagation();
    const { error } = await supabase
      .from('drops')
      .update({ status: 'completed' })
      .eq('id', dropId);
    
    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer comme terminé',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Arrivage archivé',
        description: 'L\'arrivage a été marqué comme terminé',
      });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mes arrivages</CardTitle>
          <CardDescription>Historique de vos annonces</CardDescription>
        </CardHeader>
        <CardContent>
          {drops.length === 0 ? (
            <div className="text-center py-16 space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10">
                <Anchor className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-3 max-w-md mx-auto">
                <h3 className="text-xl font-bold">Aucun arrivage en cours</h3>
                <p className="text-muted-foreground">
                  Créez votre premier arrivage pour commencer à vendre votre pêche directement aux clients en quelques clics.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/pecheur/nouvel-arrivage-v2')} size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Créer mon premier arrivage
                </Button>
                <Button onClick={() => navigate('/comment-ca-marche')} variant="outline" size="lg">
                  Comment ça marche ?
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {drops.map(drop => {
                // Get the first photo (sorted by display_order)
                const firstPhoto = drop.drop_photos
                  ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                  ?.[0]?.photo_url;

                return (
                <div 
                  key={drop.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div 
                      className="flex gap-3 flex-1 cursor-pointer"
                      onClick={() => navigate(`/drop/${drop.id}`)}
                    >
                      {/* Photo thumbnail */}
                      {firstPhoto && (
                        <img 
                          src={firstPhoto} 
                          alt="Arrivage"
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">
                            {drop.sale_point?.label || drop.sale_point?.address || drop.port?.name || 'Point de vente'}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            drop.status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                            drop.status === 'landed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {drop.status === 'scheduled' ? 'Programmé' : 'Arrivé'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          ETA : {new Date(drop.eta_at).toLocaleString('fr-FR')}
                        </p>
                        {drop.offers?.length > 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {drop.offers.length} offre(s) détaillée(s)
                          </p>
                        ) : drop.drop_species?.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {drop.drop_species
                              .filter((ds: any) => ds.species && ds.species.id)
                              .slice(0, 3)
                              .map((ds: any) => (
                                <span key={ds.species.id} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  {ds.species.name}
                                </span>
                              ))}
                            {drop.drop_species.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{drop.drop_species.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Présence au port</p>
                        )}
                      </div>
                    </div>
                    <TooltipProvider>
                      <div className="flex flex-wrap gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div onClick={(e) => e.stopPropagation()}>
                              <ShareDropButton
                                dropId={drop.id}
                                fishermanName="Mon arrivage"
                                species={drop.offers?.map((o: any) => o.title || o.species?.name).filter(Boolean).slice(0, 2).join(', ') || 
                                  drop.drop_species?.map((ds: any) => ds.species?.name).filter(Boolean).slice(0, 2).join(', ') || 
                                  'Produits frais'}
                                saleTime={new Date(drop.sale_start_time || drop.eta_at).toLocaleString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                variant="ghost"
                                size="sm"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Partager sur les réseaux sociaux</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm" onClick={(e) => handleSaveAsTemplate(e, drop)}>
                              <Package className="h-3 w-3" />
                              <span className="hidden xs:inline">Modèle</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sauvegarder comme modèle réutilisable</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs sm:text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/pecheur/dupliquer-arrivage/${drop.id}`);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                              <span className="hidden xs:inline">Dupliquer</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Créer un nouvel arrivage basé sur celui-ci</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs sm:text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/pecheur/modifier-arrivage/${drop.id}`);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                              <span className="hidden xs:inline">Modifier</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Modifier les détails de l'arrivage</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="default" size="sm" className="gap-1 text-xs sm:text-sm" onClick={(e) => handleComplete(e, drop.id)}>
                              <CheckCircle className="h-4 w-4" />
                              <span className="hidden xs:inline">Terminer</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Marquer comme terminé et archiver</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>

      {archivedDrops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des arrivages
            </CardTitle>
            <CardDescription>Les 10 derniers arrivages terminés ou annulés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {archivedDrops.map(drop => (
                <div key={drop.id} className="p-3 border-b last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">
                        {drop.sale_point?.label || drop.sale_point?.address || drop.port?.name || 'Point de vente'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(drop.eta_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      {drop.drop_species?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {drop.drop_species.slice(0, 2).map((ds: any) => (
                            <span key={ds.species.id} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                              {ds.species.name}
                            </span>
                          ))}
                          {drop.drop_species.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{drop.drop_species.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                      drop.status === 'completed' 
                        ? 'bg-secondary text-secondary-foreground' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {drop.status === 'completed' ? 'Terminé' : 'Annulé'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ArrivalsList;
