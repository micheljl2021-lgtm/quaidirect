import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Fish } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Species {
  id: string;
  name: string;
  scientific_name: string | null;
}

export const FavoriteSpeciesManager = () => {
  const { user } = useAuth();
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [favoriteSpeciesIds, setFavoriteSpeciesIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // Fetch all species
      const { data: speciesData, error: speciesError } = await supabase
        .from('species')
        .select('id, name, scientific_name')
        .order('name');

      if (speciesError) throw speciesError;
      setAllSpecies(speciesData || []);

      // Fetch user's favorite species
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('follow_species')
        .select('species_id')
        .eq('user_id', user!.id);

      if (favoritesError) throw favoritesError;
      setFavoriteSpeciesIds(favoritesData?.map(f => f.species_id) || []);
    } catch (error: any) {
      console.error('Error loading species:', error);
      toast.error('Erreur lors du chargement des espèces');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSpecies = async (speciesId: string, isChecked: boolean) => {
    if (!user) return;
    
    setSaving(true);
    try {
      if (isChecked) {
        // Add to favorites
        const { error } = await supabase
          .from('follow_species')
          .insert({ user_id: user.id, species_id: speciesId });
        
        if (error) throw error;
        setFavoriteSpeciesIds(prev => [...prev, speciesId]);
        toast.success('Espèce ajoutée aux favoris');
      } else {
        // Remove from favorites
        const { error } = await supabase
          .from('follow_species')
          .delete()
          .eq('user_id', user.id)
          .eq('species_id', speciesId);
        
        if (error) throw error;
        setFavoriteSpeciesIds(prev => prev.filter(id => id !== speciesId));
        toast.success('Espèce retirée des favoris');
      }
    } catch (error: any) {
      console.error('Error toggling species:', error);
      toast.error('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Fish className="h-5 w-5 text-primary" />
            <CardTitle>Mes espèces favorites</CardTitle>
          </div>
          <CardDescription>
            Chargement...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Fish className="h-5 w-5 text-primary" />
          <CardTitle>Mes espèces favorites</CardTitle>
        </div>
        <CardDescription>
          Recevez des alertes quand ces espèces sont disponibles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {favoriteSpeciesIds.length > 0 
            ? `${favoriteSpeciesIds.length} espèce(s) sélectionnée(s)`
            : 'Aucune espèce favorite pour le moment'
          }
        </p>
        
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {allSpecies.map(species => (
              <div key={species.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                <Checkbox
                  id={species.id}
                  checked={favoriteSpeciesIds.includes(species.id)}
                  onCheckedChange={(checked) => handleToggleSpecies(species.id, checked as boolean)}
                  disabled={saving}
                />
                <label
                  htmlFor={species.id}
                  className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {species.name}
                  {species.scientific_name && (
                    <span className="block text-xs text-muted-foreground italic">
                      {species.scientific_name}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
