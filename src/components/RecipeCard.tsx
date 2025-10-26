import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChefHat, AlertCircle } from "lucide-react";
import { differenceInDays } from "date-fns";

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
  urgencyScore?: number;
  expiringItems?: Array<{ name: string; daysUntilExpiry: number }>;
};

type FridgeItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string | null;
  price?: number;
  status?: string;
};

interface RecipeCardProps {
  recipe: Recipe;
  fridgeItems: FridgeItem[];
  onViewRecipe: (recipe: Recipe) => void;
  onCookRecipe: (recipe: Recipe) => void;
  isPerfectMatch?: boolean;
}

export function RecipeCard({ recipe, fridgeItems, onViewRecipe, onCookRecipe, isPerfectMatch }: RecipeCardProps) {
  const totalIngredients = recipe.matchingIngredients.length + recipe.additionalIngredients.length;
  const matchPercentage = Math.round((recipe.matchingIngredients.length / totalIngredients) * 100);
  const isUrgent = recipe.expiringItems && recipe.expiringItems.length > 0;

  return (
    <Card className={`p-5 shadow-lg hover:shadow-xl transition-all ${isUrgent ? 'border-2 border-destructive' : isPerfectMatch ? 'border-2 border-success' : ''}`}>
      {/* Urgent Badge */}
      {isUrgent && (
        <div className="mb-3 p-2 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">URGENT - Use expiring items!</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {recipe.expiringItems!.map((item, idx) => (
              <Badge key={idx} variant="destructive" className="text-xs">
                {item.name} (expires {item.daysUntilExpiry === 0 ? 'today' : item.daysUntilExpiry === 1 ? 'tomorrow' : `in ${item.daysUntilExpiry} days`})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Perfect Match Badge */}
      {isPerfectMatch && (
        <div className="mb-3 p-2 bg-success/10 rounded-lg border border-success/20">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-success" />
            <span className="text-sm font-semibold text-success">✓ You have all ingredients!</span>
          </div>
        </div>
      )}

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
          <span className="text-muted-foreground font-semibold">
            You have {recipe.matchingIngredients.length}/{totalIngredients} ingredients
          </span>
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
            <strong>✓ You have:</strong> {recipe.matchingIngredients.join(', ')}
          </p>
          {recipe.additionalIngredients.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <strong>🛒 You'll need:</strong> {recipe.additionalIngredients.join(', ')}
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={() => onCookRecipe(recipe)}
          className="flex-1 bg-success text-white shadow-md hover:shadow-lg transition-all hover:bg-success/90"
        >
          <ChefHat className="w-4 h-4 mr-2" />
          Cook This
        </Button>
        <Button 
          variant="outline"
          onClick={() => onViewRecipe(recipe)}
          className="flex-1 shadow-md hover:shadow-lg transition-all"
        >
          View Full Recipe
        </Button>
      </div>
    </Card>
  );
}
