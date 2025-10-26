import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChefHat, Sparkles, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import chickenStirFryImg from "@/assets/recipe-chicken-stir-fry.jpg";
import spaghettiCarbonaraImg from "@/assets/recipe-spaghetti-carbonara.jpg";
import caesarSaladImg from "@/assets/recipe-caesar-salad.jpg";
import friedRiceImg from "@/assets/recipe-fried-rice.jpg";
import veggieOmeletteImg from "@/assets/recipe-veggie-omelette.jpg";

type Recipe = {
  id: string;
  name: string;
  description: string;
  cookTime: number;
  servings: number;
  difficulty: string;
  matchingIngredients: string[];
  additionalIngredients: string[];
  instructions: string[];
};

type FridgeItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string | null;
};

type SampleRecipe = {
  id: string;
  name: string;
  image: string;
  cookTime: number;
  difficulty: string;
  ingredientCount: number;
};

const sampleRecipes: SampleRecipe[] = [
  {
    id: "sample-1",
    name: "Chicken Stir Fry",
    image: chickenStirFryImg,
    cookTime: 15,
    difficulty: "Easy",
    ingredientCount: 8,
  },
  {
    id: "sample-2",
    name: "Spaghetti Carbonara",
    image: spaghettiCarbonaraImg,
    cookTime: 20,
    difficulty: "Medium",
    ingredientCount: 6,
  },
  {
    id: "sample-3",
    name: "Caesar Salad",
    image: caesarSaladImg,
    cookTime: 10,
    difficulty: "Easy",
    ingredientCount: 7,
  },
  {
    id: "sample-4",
    name: "Fried Rice",
    image: friedRiceImg,
    cookTime: 25,
    difficulty: "Easy",
    ingredientCount: 9,
  },
  {
    id: "sample-5",
    name: "Veggie Omelette",
    image: veggieOmeletteImg,
    cookTime: 10,
    difficulty: "Easy",
    ingredientCount: 5,
  },
];

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFridgeItems();
  }, []);

  const fetchFridgeItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fridge_items')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setFridgeItems(data || []);
    } catch (error: any) {
      console.error('Error fetching fridge items:', error);
      toast({
        title: "Error",
        description: "Failed to load fridge items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRecipes = async () => {
    if (fridgeItems.length === 0) {
      toast({
        title: "No ingredients",
        description: "Add some items to your fridge first!",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-recipes', {
        body: { ingredients: fridgeItems }
      });

      if (error) throw error;

      if (data?.recipes) {
        const recipesWithIds = data.recipes.map((recipe: any, index: number) => ({
          ...recipe,
          id: `${Date.now()}-${index}`,
        }));
        setRecipes(recipesWithIds);
        toast({
          title: "Recipes generated!",
          description: `Found ${recipesWithIds.length} delicious recipes for you.`,
        });
      }
    } catch (error: any) {
      console.error('Error generating recipes:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate recipes",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getMatchPercentage = (matchingIngredients: string[]) => {
    if (fridgeItems.length === 0) return 0;
    return Math.round((matchingIngredients.length / fridgeItems.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Recipe Ideas</h1>
        <p className="text-muted-foreground">Based on what's in your fridge</p>
      </div>

      {/* Fridge Items Count */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <p className="text-center text-sm text-muted-foreground">
          You have <strong>{fridgeItems.length}</strong> items in your fridge
        </p>
      </Card>

      {/* AI Suggestion Button */}
      <Button 
        onClick={generateRecipes}
        disabled={generating || fridgeItems.length === 0}
        className="w-full h-14 bg-gradient-to-r from-secondary to-warning text-white shadow-md hover:shadow-lg transition-all"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating Recipes...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Get AI Recipe Suggestions
          </>
        )}
      </Button>

      {/* Recipe Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="space-y-4">
          {/* Info Card */}
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Popular Recipes Preview
                </p>
                <p className="text-xs text-muted-foreground">
                  Add ingredients to see personalized matches based on what you have in your fridge
                </p>
              </div>
            </div>
          </Card>

          {/* Sample Recipes */}
          <div className="grid grid-cols-1 gap-4">
            {sampleRecipes.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all">
                <div className="aspect-video w-full overflow-hidden">
                  <img 
                    src={recipe.image} 
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground mb-3">{recipe.name}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{recipe.cookTime} min</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {recipe.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <ChefHat className="w-4 h-4" />
                      <span>{recipe.ingredientCount} ingredients</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {recipes.map((recipe) => {
            const matchPercentage = getMatchPercentage(recipe.matchingIngredients);
            
            return (
              <Card key={recipe.id} className="p-5 shadow-lg hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1">{recipe.name}</h3>
                    <p className="text-sm text-muted-foreground">{recipe.description}</p>
                  </div>
                  <ChefHat className="w-8 h-8 text-primary ml-2" />
                </div>

                {/* Recipe Stats */}
                <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.cookTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{recipe.servings} servings</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {recipe.difficulty}
                  </Badge>
                </div>

                {/* Ingredient Match */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Ingredient Match</span>
                    <span className="font-semibold text-primary">{matchPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-primary to-success h-2 rounded-full transition-all"
                      style={{ width: `${matchPercentage}%` }}
                    />
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <strong>You have:</strong> {recipe.matchingIngredients.join(', ')}
                    </p>
                    {recipe.additionalIngredients.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <strong>You'll need:</strong> {recipe.additionalIngredients.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Instructions Preview */}
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold text-foreground mb-2">Quick Steps:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    {recipe.instructions.slice(0, 3).map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                    {recipe.instructions.length > 3 && (
                      <li className="text-primary">+ {recipe.instructions.length - 3} more steps</li>
                    )}
                  </ol>
                </div>

                <Button className="w-full bg-primary text-white shadow-md hover:shadow-lg transition-all">
                  View Full Recipe
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
