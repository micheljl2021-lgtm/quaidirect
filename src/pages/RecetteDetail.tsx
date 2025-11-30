import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChefHat, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecipeDetail {
  id: string;
  title: string;
  description: string;
  preparation_time: number;
  cooking_time: number;
  difficulty: string;
  servings: number;
  instructions: Array<{ step: number; text: string }>;
  image_url: string | null;
  species: Array<{
    name: string;
    quantity: string;
  }>;
  ingredients: Array<{
    name: string;
    quantity: string;
    order_index: number;
  }>;
}

const RecetteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    if (!id) return;

    try {
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .single();

      if (recipeError) throw recipeError;

      const { data: speciesData } = await supabase
        .from("recipe_species")
        .select(`
          quantity,
          species:species_id (name)
        `)
        .eq("recipe_id", id);

      const { data: ingredientsData } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", id)
        .order("order_index", { ascending: true });

      setRecipe({
        ...recipeData,
        instructions: (recipeData.instructions as any) || [],
        species: speciesData?.map((s: any) => ({
          name: s.species?.name || "",
          quantity: s.quantity,
        })) || [],
        ingredients: ingredientsData || [],
      });
    } catch (error: any) {
      toast.error("Erreur lors du chargement de la recette");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-4 py-8 text-center">
          <p className="text-muted-foreground">Recette non trouvée</p>
          <Button onClick={() => navigate("/recettes")} className="mt-4">
            Retour aux recettes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/recettes")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux recettes
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="aspect-video bg-gradient-ocean rounded-xl overflow-hidden mb-6 flex items-center justify-center">
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ChefHat className="h-24 w-24 text-white/50" />
              )}
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-4">
              {recipe.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              {recipe.description}
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Badge variant="outline" className="text-base px-4 py-2">
                {recipe.difficulty}
              </Badge>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>
                  {recipe.preparation_time + recipe.cooking_time} minutes
                  (prep: {recipe.preparation_time} min, cuisson: {recipe.cooking_time} min)
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>{recipe.servings} personnes</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Ingrédients */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Ingrédients
                </h2>

                <div className="space-y-3 mb-6">
                  <h3 className="font-semibold text-foreground">Poisson</h3>
                  {recipe.species.map((species, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">{species.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {species.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">Autres ingrédients</h3>
                  {recipe.ingredients.map((ingredient, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="font-medium">{ingredient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {ingredient.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Préparation
                </h2>

                <div className="space-y-6">
                  {recipe.instructions.map((instruction) => (
                    <div key={instruction.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                        {instruction.step}
                      </div>
                      <p className="text-muted-foreground flex-1 pt-1">
                        {instruction.text}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA - Besoin de poisson frais */}
          <Card className="bg-gradient-ocean text-white mb-8">
            <CardContent className="pt-6 pb-6 text-center">
              <h3 className="text-2xl font-bold mb-2">
                Où acheter ce poisson aujourd'hui?
              </h3>
              <p className="text-white/90 mb-4">
                Trouvez les points de vente proposant {recipe.species[0]?.name || "ce poisson"}
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/carte")}
              >
                Voir sur la carte
              </Button>
            </CardContent>
          </Card>

          {/* CTA - Besoin de poisson frais */}
          <Card className="bg-gradient-ocean text-white">
            <CardContent className="pt-6 pb-6 text-center">
              <h3 className="text-2xl font-bold mb-2">
                Besoin de poisson frais?
              </h3>
              <p className="text-white/90 mb-4">
                Commandez directement auprès de nos marins-pêcheurs
              </p>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/carte")}
              >
                Voir les arrivages
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RecetteDetail;
