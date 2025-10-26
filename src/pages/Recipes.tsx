import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, ChefHat, Sparkles, Loader2, Info, Crown, AlertCircle, Flame, Salad, Pizza, Leaf, ShoppingCart, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { SAMPLE_RECIPES } from "@/lib/sampleRecipes";
import { ProgressIncentive } from "@/components/ProgressIncentive";
import { AuthModal } from "@/components/AuthModal";
import { differenceInDays, getHours } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecipeCard } from "@/components/RecipeCard";

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
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [quickFilter, setQuickFilter] = useState<string>("");
  const { toast } = useToast();
  const { tier, recipeCountToday, canGenerateRecipe, incrementRecipeCount, checkProgressMilestone } = useAuth();

  useEffect(() => {
    fetchFridgeItems();
  }, []);

  // Auto-generate recipes when fridge items are loaded
  useEffect(() => {
    if (fridgeItems.length > 0 && recipes.length === 0 && !loading && !generating) {
      generateRecipes();
    }
  }, [fridgeItems]);

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

  const generateRecipes = async (category?: string) => {
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
      // Use local matching algorithm
      const { matchRecipes } = await import("@/lib/recipeMatching");
      const matchedRecipes = matchRecipes(fridgeItems, category);
      
      if (matchedRecipes.length === 0) {
        toast({
          title: "No matches found",
          description: "Try adding more ingredients to your fridge or try a different category.",
        });
        setRecipes([]);
        return;
      }
      
      // Convert to Recipe type
      const convertedRecipes: Recipe[] = matchedRecipes.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        matchingIngredients: recipe.itemsUserHas,
        additionalIngredients: recipe.itemsUserNeeds,
        instructions: recipe.instructions,
        urgencyScore: recipe.urgencyScore,
        expiringItems: recipe.expiringItemsUsed.length > 0 ? recipe.expiringItemsUsed : undefined,
      }));
      
      setRecipes(convertedRecipes);
      
      toast({
        title: "Recipes matched!",
        description: `Found ${convertedRecipes.length} recipes based on your fridge contents.`,
      });
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

  const getTimeBasedGreeting = () => {
    const hour = getHours(new Date());
    if (hour < 11) return { icon: "☀️", text: "Breakfast Ideas", filter: "breakfast" };
    if (hour < 14) return { icon: "🥗", text: "Lunch Options", filter: "lunch" };
    if (hour < 20) return { icon: "🍽️", text: "Dinner Recipes", filter: "dinner" };
    return { icon: "🌙", text: "Snack Ideas", filter: "snacks" };
  };

  const perfectMatches = recipes.filter(r => r.additionalIngredients.length === 0);
  const almostPerfect = recipes.filter(r => {
    const total = r.matchingIngredients.length + r.additionalIngredients.length;
    const percentage = (r.matchingIngredients.length / total) * 100;
    return percentage >= 80 && r.additionalIngredients.length > 0;
  });
  const otherRecipes = recipes.filter(r => {
    const total = r.matchingIngredients.length + r.additionalIngredients.length;
    const percentage = (r.matchingIngredients.length / total) * 100;
    return r.additionalIngredients.length > 0 && percentage < 80;
  });

  const hasExpiringItems = fridgeItems.some(item => {
    if (!item.expiry_date) return false;
    const daysUntil = differenceInDays(new Date(item.expiry_date), new Date());
    return daysUntil <= 2;
  });

  const expiringItems = fridgeItems.filter(item => {
    if (!item.expiry_date) return false;
    const daysUntil = differenceInDays(new Date(item.expiry_date), new Date());
    return daysUntil <= 2;
  });

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetail(true);
  };

  const recipeLimit = 3;
  const timeGreeting = getTimeBasedGreeting();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Recipe Ideas</h1>
        <p className="text-muted-foreground">Based on what's in your fridge</p>
      </div>

      {/* Fridge Items Count */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10">
        <p className="text-center text-sm text-muted-foreground">
          You have <strong className="text-foreground">{fridgeItems.length}</strong> items in your fridge
        </p>
      </Card>

      {/* Expiration Urgency Banner */}
      {hasExpiringItems && (
        <Card className="p-4 bg-destructive/10 border-destructive/20 border-2 animate-pulse-success">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive mb-1">
                ⚠️ Priority: Items expiring soon!
              </p>
              <p className="text-xs text-muted-foreground">
                Use these soon: {expiringItems.map(i => `${i.name} (${differenceInDays(new Date(i.expiry_date!), new Date())}d)`).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Smart Recipe Generation Section */}
      <Card className="p-6 bg-gradient-to-br from-success/10 via-primary/10 to-secondary/10 shadow-xl border-2 border-success/20">
        <div className="text-center space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">🍳 Ready to Cook?</h2>
            <p className="text-sm text-muted-foreground">
              {fridgeItems.length > 0 
                ? `We'll find recipes using your: ${fridgeItems.slice(0, 5).map(i => i.name).join(', ')}${fridgeItems.length > 5 ? '...' : ''}`
                : "Add items to your fridge to get personalized recipe suggestions"
              }
            </p>
          </div>

          <Button 
            onClick={() => generateRecipes()}
            disabled={generating || fridgeItems.length === 0}
            className="w-full h-16 bg-gradient-to-r from-success to-primary text-white shadow-lg hover:shadow-xl transition-all text-lg font-semibold"
          >
            {generating ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Analyzing your fridge...
              </>
            ) : (
              <>
                <ChefHat className="w-6 h-6 mr-2" />
                Generate Recipes from My Fridge
              </>
            )}
          </Button>

          {/* Tier Badge */}
          {tier === 'anonymous' ? (
            <div className="text-xs text-muted-foreground">
              {recipeCountToday}/{recipeLimit} recipes generated today
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-success" />
              <span className="text-xs font-semibold text-success">Unlimited recipes ✨</span>
            </div>
          )}

          {/* Quick Filters */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3">Or browse by:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateRecipes("quick")}
                disabled={generating || fridgeItems.length === 0}
                className="text-xs hover:bg-primary/10"
              >
                <Flame className="w-4 h-4 mr-1" />
                Quick Meals
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateRecipes("healthy")}
                disabled={generating || fridgeItems.length === 0}
                className="text-xs hover:bg-success/10"
              >
                <Salad className="w-4 h-4 mr-1" />
                Healthy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateRecipes("comfort")}
                disabled={generating || fridgeItems.length === 0}
                className="text-xs hover:bg-warning/10"
              >
                <Pizza className="w-4 h-4 mr-1" />
                Comfort Food
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateRecipes("vegetarian")}
                disabled={generating || fridgeItems.length === 0}
                className="text-xs hover:bg-secondary/10"
              >
                <Leaf className="w-4 h-4 mr-1" />
                Vegetarian
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Generated Recipes Section */}
      {recipes.length > 0 && (
        <div className="space-y-6">
          {/* Perfect Matches */}
          {perfectMatches.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-success" />
                <h3 className="text-lg font-bold text-foreground">Perfect Matches - You have everything!</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {perfectMatches.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    fridgeItems={fridgeItems}
                    onViewRecipe={handleViewRecipe}
                    onCookRecipe={handleCookRecipe}
                    isPerfectMatch
                  />
                ))}
              </div>
            </div>
          )}

          {/* Almost Perfect */}
          {almostPerfect.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Almost Perfect - Just need 1-2 items</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {almostPerfect.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    fridgeItems={fridgeItems}
                    onViewRecipe={handleViewRecipe}
                    onCookRecipe={handleCookRecipe}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Recipes */}
          {otherRecipes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-muted-foreground" />
                <h3 className="text-lg font-bold text-foreground">More Recipe Ideas</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {otherRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    fridgeItems={fridgeItems}
                    onViewRecipe={handleViewRecipe}
                    onCookRecipe={handleCookRecipe}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Popular Recipes */}
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
      ) : fridgeItems.length === 0 ? (
        <Card className="p-8 text-center space-y-4">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-bold text-foreground">Your fridge is empty!</h3>
          <p className="text-sm text-muted-foreground">
            Add items to your fridge first, then we'll suggest recipes you can make.
          </p>
          <Button onClick={() => window.location.href = '/add'} className="mt-4">
            Add Items to Fridge
          </Button>
        </Card>
      ) : recipes.length === 0 ? (
        <div className="space-y-4">
          {/* Info Card */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">
              {timeGreeting.icon} {timeGreeting.text}
            </h3>
          </div>

          {/* Sample Recipes */}
          <div className="grid grid-cols-1 gap-4">
            {SAMPLE_RECIPES.slice(0, 6).map((recipe) => {
              // Calculate match with fridge items
              const matchingCount = recipe.ingredients.filter(ing => 
                fridgeItems.some(item => 
                  item.name.toLowerCase().includes(ing.toLowerCase()) ||
                  ing.toLowerCase().includes(item.name.toLowerCase())
                )
              ).length;
              const matchPercentage = Math.round((matchingCount / recipe.ingredients.length) * 100);

              return (
                <Card key={recipe.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all">
                  <div className="aspect-video w-full overflow-hidden">
                    <img 
                      src={recipe.image} 
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">{recipe.name}</h3>
                      <p className="text-sm text-muted-foreground">{recipe.description}</p>
                    </div>

                    {/* Match Indicator */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-semibold">
                          You have {matchingCount}/{recipe.ingredients.length} ingredients
                        </span>
                        <span className="font-semibold text-primary">{matchPercentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-primary to-success h-1.5 rounded-full transition-all"
                          style={{ width: `${matchPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{recipe.cookTime} min</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {recipe.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{recipe.servings} servings</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Recipe Detail Dialog */}
      {selectedRecipe && (
        <Dialog open={showRecipeDetail} onOpenChange={setShowRecipeDetail}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{selectedRecipe.name}</DialogTitle>
              <DialogDescription className="text-sm">
                You have {selectedRecipe.matchingIngredients.length}/{selectedRecipe.matchingIngredients.length + selectedRecipe.additionalIngredients.length} ingredients
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Recipe Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{selectedRecipe.cookTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{selectedRecipe.servings} servings</span>
                  </div>
                  <Badge variant="secondary">{selectedRecipe.difficulty}</Badge>
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="text-lg font-bold mb-3">Ingredients</h3>
                  <div className="space-y-2">
                    {selectedRecipe.matchingIngredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-foreground">{ing} <span className="text-muted-foreground">(You have this)</span></span>
                      </div>
                    ))}
                    {selectedRecipe.additionalIngredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <X className="w-4 h-4 text-destructive" />
                        <span className="text-foreground">{ing} <span className="text-muted-foreground">(You need this)</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-lg font-bold mb-3">Instructions</h3>
                  <ol className="space-y-3 list-decimal list-inside">
                    {selectedRecipe.instructions.map((step, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      handleCookRecipe(selectedRecipe);
                      setShowRecipeDetail(false);
                    }}
                    className="flex-1 bg-success text-white hover:bg-success/90"
                  >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Start Cooking
                  </Button>
                  {selectedRecipe.additionalIngredients.length > 0 && (
                    <Button variant="outline" className="flex-1">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add Missing to List
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
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
