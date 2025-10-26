import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChefHat, Sparkles, Loader2, Info, Crown, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { SAMPLE_RECIPES } from "@/lib/sampleRecipes";
import { ProgressIncentive } from "@/components/ProgressIncentive";
import { AuthModal } from "@/components/AuthModal";
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

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showProgressIncentive, setShowProgressIncentive] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { toast } = useToast();
  const { tier, recipeCountToday, canGenerateRecipe, incrementRecipeCount, checkProgressMilestone } = useAuth();

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

    // Check recipe limit for anonymous users
    if (!canGenerateRecipe()) {
      setShowUpgradePrompt(true);
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
        
        // Calculate urgency and sort by expiring items
        const recipesWithUrgency = recipesWithIds.map((recipe: Recipe) => 
          calculateRecipeUrgency(recipe)
        );
        recipesWithUrgency.sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0));
        
        setRecipes(recipesWithUrgency);
        
        // Increment recipe count for anonymous users
        if (tier === 'anonymous') {
          incrementRecipeCount();
          
          // Check for progress milestone
          const milestone = checkProgressMilestone();
          if (milestone === '2-recipes') {
            setShowProgressIncentive(true);
          }
        }
        
        toast({
          title: "Recipes generated!",
          description: `Found ${recipesWithUrgency.length} delicious recipes for you.`,
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

  const calculateRecipeUrgency = (recipe: Recipe): Recipe => {
    const expiringItems: Array<{ name: string; daysUntilExpiry: number }> = [];
    let urgencyScore = 0;

    recipe.matchingIngredients.forEach((ingredient) => {
      const fridgeItem = fridgeItems.find(
        (item) => item.name.toLowerCase().includes(ingredient.toLowerCase()) ||
                  ingredient.toLowerCase().includes(item.name.toLowerCase())
      );

      if (fridgeItem?.expiry_date) {
        const daysUntilExpiry = differenceInDays(new Date(fridgeItem.expiry_date), new Date());
        
        if (daysUntilExpiry <= 2) {
          expiringItems.push({ name: fridgeItem.name, daysUntilExpiry });
          urgencyScore += (2 - daysUntilExpiry) * 10; // Higher score for items expiring sooner
        }
      }
    });

    return {
      ...recipe,
      urgencyScore,
      expiringItems: expiringItems.length > 0 ? expiringItems : undefined,
    };
  };

  const handleCookRecipe = async (recipe: Recipe) => {
    try {
      // Find and mark matching ingredients as used
      const itemsToMark: string[] = [];
      
      for (const ingredient of recipe.matchingIngredients) {
        const fridgeItem = fridgeItems.find(
          (item) => item.name.toLowerCase().includes(ingredient.toLowerCase()) ||
                    ingredient.toLowerCase().includes(item.name.toLowerCase())
        );

        if (fridgeItem) {
          itemsToMark.push(fridgeItem.id);
          
          // Update item as used
          const { error } = await supabase
            .from('fridge_items')
            .update({ 
              status: 'used',
              completed_at: new Date().toISOString()
            })
            .eq('id', fridgeItem.id);

          if (error) throw error;
        }
      }

      // Track cooked recipe
      const cookedRecipes = JSON.parse(localStorage.getItem('cookedRecipes') || '[]');
      cookedRecipes.push({
        recipeId: recipe.id,
        recipeName: recipe.name,
        cookedAt: new Date().toISOString(),
        ingredientsUsed: recipe.matchingIngredients,
      });
      localStorage.setItem('cookedRecipes', JSON.stringify(cookedRecipes));

      // Refresh fridge items
      await fetchFridgeItems();

      toast({
        title: "🎉 Recipe cooked!",
        description: `Marked ${itemsToMark.length} ingredients as used. Enjoy your ${recipe.name}!`,
        className: "border-success",
      });

      // Remove recipe from list
      setRecipes(recipes.filter(r => r.id !== recipe.id));
    } catch (error: any) {
      console.error('Error marking recipe as cooked:', error);
      toast({
        title: "Error",
        description: "Failed to mark ingredients as used",
        variant: "destructive",
      });
    }
  };

  const getMatchPercentage = (matchingIngredients: string[], additionalIngredients: string[]) => {
    const totalIngredients = matchingIngredients.length + additionalIngredients.length;
    if (totalIngredients === 0) return 0;
    return Math.round((matchingIngredients.length / totalIngredients) * 100);
  };

  const recipeLimit = 3;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Recipe Ideas</h1>
        <p className="text-muted-foreground">Based on what's in your fridge</p>
      </div>

      {/* Recipe Counter for Anonymous Users */}
      {tier === 'anonymous' && (
        <Card className="p-4 bg-gradient-to-r from-secondary/10 to-warning/10 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Recipes today:</span>
            <span className="text-lg font-bold text-foreground">
              {recipeCountToday}/{recipeLimit}
            </span>
          </div>
        </Card>
      )}

      {/* Unlimited Badge for Free/Pro Users */}
      {tier !== 'anonymous' && (
        <Card className="p-4 bg-gradient-to-r from-success/10 to-primary/10 shadow-lg">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-success" />
            <span className="text-sm font-semibold text-foreground">Unlimited recipes ✨</span>
          </div>
        </Card>
      )}

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
        className="w-full h-14 bg-gradient-to-r from-secondary to-warning text-white shadow-md hover:shadow-lg transition-all relative"
      >
        {tier !== 'pro' && (
          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-warning to-primary text-white text-xs">
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        )}
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
            {SAMPLE_RECIPES.map((recipe) => (
              <Card key={recipe.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all">
                <div className="aspect-video w-full overflow-hidden">
                  <img 
                    src={recipe.image} 
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground mb-2">{recipe.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
                  
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
                      <span>{recipe.ingredients.length} ingredients</span>
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
            const totalIngredients = recipe.matchingIngredients.length + recipe.additionalIngredients.length;
            const matchPercentage = getMatchPercentage(recipe.matchingIngredients, recipe.additionalIngredients);
            const isUrgent = recipe.expiringItems && recipe.expiringItems.length > 0;
            
            return (
              <Card key={recipe.id} className={`p-5 shadow-lg hover:shadow-xl transition-all ${isUrgent ? 'border-2 border-destructive' : ''}`}>
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
                    onClick={() => handleCookRecipe(recipe)}
                    className="flex-1 bg-success text-white shadow-md hover:shadow-lg transition-all hover:bg-success/90"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Cook This
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 shadow-md hover:shadow-lg transition-all"
                  >
                    View Full Recipe
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Upgrade Prompt */}
      <UpgradePrompt 
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        type="recipe-limit"
      />

      {/* Progress Incentive */}
      <ProgressIncentive 
        open={showProgressIncentive}
        onOpenChange={setShowProgressIncentive}
        type="2-recipes"
        onCreateAccount={() => setShowAuthModal(true)}
      />

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultTab="signup"
      />
    </div>
  );
}
