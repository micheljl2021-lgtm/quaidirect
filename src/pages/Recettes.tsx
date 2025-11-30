import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Users, ChefHat, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Recipe {
  id: string;
  title: string;
  description: string;
  preparation_time: number;
  cooking_time: number;
  difficulty: string;
  servings: number;
  image_url: string | null;
  species: Array<{
    name: string;
    quantity: string;
  }>;
}

const Recettes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [durationFilter, setDurationFilter] = useState("all");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [allSpecies, setAllSpecies] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (recipesError) throw recipesError;

      if (recipesData) {
        const recipesWithSpecies = await Promise.all(
          recipesData.map(async (recipe) => {
            const { data: speciesData } = await supabase
              .from("recipe_species")
              .select(`
                quantity,
                species:species_id (name)
              `)
              .eq("recipe_id", recipe.id);

            return {
              ...recipe,
              species: speciesData?.map((s: any) => ({
                name: s.species?.name || "",
                quantity: s.quantity,
              })) || [],
            };
          })
        );

        setRecipes(recipesWithSpecies);
        
        // Extract unique species for filter
        const uniqueSpecies = Array.from(
          new Set(recipesWithSpecies.flatMap(r => r.species.map(s => s.name)))
        ).sort();
        setAllSpecies(uniqueSpecies);
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement des recettes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = !searchQuery ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.species.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const totalTime = recipe.preparation_time + recipe.cooking_time;
    const matchesDuration = durationFilter === "all" ||
      (durationFilter === "quick" && totalTime <= 30) ||
      (durationFilter === "long" && totalTime > 30);

    const matchesSpecies = speciesFilter === "all" ||
      recipe.species.some(s => s.name === speciesFilter);

    return matchesSearch && matchesDuration && matchesSpecies;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "facile":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "moyen":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "difficile":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8">
        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Recettes de la mer
            </h1>
            <p className="text-lg text-muted-foreground">
              Découvrez comment sublimer votre poisson frais
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une recette ou un poisson..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Durée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes durées</SelectItem>
                <SelectItem value="quick">{"Rapide (≤30 min)"}</SelectItem>
                <SelectItem value="long">{"Long (>30 min)"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Type de poisson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les poissons</SelectItem>
                {allSpecies.map(species => (
                  <SelectItem key={species} value={species}>
                    {species}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Chargement des recettes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/recettes/${recipe.id}`)}
              >
                <div className="aspect-video bg-gradient-ocean flex items-center justify-center">
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ChefHat className="h-16 w-16 text-white/50" />
                  )}
                </div>

                <CardContent className="pt-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {recipe.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {recipe.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={getDifficultyColor(recipe.difficulty)}
                    >
                      {recipe.difficulty}
                    </Badge>
                    {recipe.species.map((species, idx) => (
                      <Badge key={idx} variant="outline">
                        {species.name}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {recipe.preparation_time + recipe.cooking_time} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {recipe.servings} pers.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && filteredRecipes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">
              Aucune recette ne correspond à votre recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recettes;
