import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const DuplicateArrivage = () => {
  const { dropId } = useParams<{ dropId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadAndDuplicateDrop = async () => {
      if (!dropId) {
        toast({
          title: "Erreur",
          description: "Aucun arrivage à dupliquer",
          variant: "destructive",
        });
        navigate('/dashboard/pecheur');
        return;
      }

      try {
        // Fetch drop data with all relations
        const { data: drop, error: dropError } = await supabase
          .from('drops')
          .select(`
            *,
            port:ports(*),
            drop_species(species_id),
            drop_photos(photo_url, display_order),
            offers(
              *,
              species:species(*),
              offer_photos(photo_url, display_order)
            )
          `)
          .eq('id', dropId)
          .single();

        if (dropError) throw dropError;

        if (!drop) {
          throw new Error('Arrivage introuvable');
        }

        // Store duplication data in sessionStorage for CreateArrivage
        sessionStorage.setItem('duplicateDropData', JSON.stringify({
          port_id: drop.port_id,
          is_premium: drop.is_premium,
          notes: drop.notes,
          drop_photos: drop.drop_photos || [],
          species: (drop.drop_species || []).map((ds: any) => ds.species_id),
          offers: (drop.offers || []).map((offer: any) => ({
            species_id: offer.species_id,
            title: offer.title,
            description: offer.description,
            unit_price: offer.unit_price,
            total_units: offer.total_units,
            available_units: offer.available_units,
            indicative_weight_kg: offer.indicative_weight_kg,
            price_type: offer.price_type,
            photos: (offer.offer_photos || []).map((p: any) => ({
              url: p.photo_url,
              order: p.display_order
            }))
          }))
        }));

        // Redirect to create page with duplication flag
        navigate('/pecheur/nouvel-arrivage?duplicate=true');
      } catch (error) {
        console.error('Error loading drop for duplication:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger l'arrivage à dupliquer",
          variant: "destructive",
        });
        navigate('/dashboard/pecheur');
      }
    };

    loadAndDuplicateDrop();
  }, [dropId, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Duplication de l'arrivage en cours...</p>
      </div>
    </div>
  );
};

export default DuplicateArrivage;
