import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChefHat, Sparkles } from "lucide-react";

type Recipe = {
  id: string;
  name: string;
  description: string;
  cookTime: number;
  servings: number;
  difficulty: string;
  matchingIngredients: number;
  totalIngredients: number;
};

export default function Recipes() {
  // Mock recipe data - will be replaced with AI-generated recipes based on fridge contents
  const recipes: Recipe[] = [
    {
      id: "1",
      name: "Creamy Chicken Pasta",
      description: "A delicious pasta dish with chicken and a creamy sauce",
      cookTime: 30,
      servings: 4,
      difficulty: "Easy",
      matchingIngredients: 5,
      totalIngredients: 8,
    },
    {
      id: "2",
      name: "Fresh Garden Salad",
      description: "Light and healthy salad with fresh vegetables",
      cookTime: 15,
      servings: 2,
      difficulty: "Easy",
      matchingIngredients: 6,
      totalIngredients: 7,
    },
    {
      id: "3",
      name: "Berry Smoothie Bowl",
      description: "Refreshing smoothie bowl with strawberries and yogurt",
      cookTime: 10,
      servings: 2,
      difficulty: "Easy",
      matchingIngredients: 4,
      totalIngredients: 6,
    },
  ];

  const getMatchPercentage = (matching: number, total: number) => {
    return Math.round((matching / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Recipe Ideas</h1>
        <p className="text-muted-foreground">Based on what's in your fridge</p>
      </div>

      {/* AI Suggestion Button */}
      <Button 
        className="w-full h-14 bg-gradient-to-r from-secondary to-warning text-white shadow-md hover:shadow-lg transition-all"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Get AI Recipe Suggestions
      </Button>

      {/* Recipe Cards */}
      <div className="space-y-4">
        {recipes.map((recipe) => {
          const matchPercentage = getMatchPercentage(recipe.matchingIngredients, recipe.totalIngredients);
          
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
                <p className="text-xs text-muted-foreground mt-1">
                  You have {recipe.matchingIngredients} of {recipe.totalIngredients} ingredients
                </p>
              </div>

              <Button className="w-full bg-primary text-white shadow-md hover:shadow-lg transition-all">
                View Recipe
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
