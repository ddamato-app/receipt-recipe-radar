import { differenceInDays } from "date-fns";
import { SAMPLE_RECIPES, SampleRecipe } from "./sampleRecipes";

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

type MatchedRecipe = SampleRecipe & {
  matchPercentage: number;
  itemsUserHas: string[];
  itemsUserNeeds: string[];
  expiringItemsUsed: Array<{ name: string; daysUntilExpiry: number }>;
  urgencyScore: number;
};

/**
 * Checks if a fridge item name matches a recipe ingredient
 */
function ingredientMatchesItem(ingredient: string, itemName: string): boolean {
  const ingredientLower = ingredient.toLowerCase().trim();
  const itemLower = itemName.toLowerCase().trim();
  
  // Direct match
  if (ingredientLower === itemLower) return true;
  
  // Partial match (ingredient contains item or item contains ingredient)
  if (ingredientLower.includes(itemLower) || itemLower.includes(ingredientLower)) {
    return true;
  }
  
  // Handle plurals and common variations
  const singularIngredient = ingredientLower.replace(/s$/, '');
  const singularItem = itemLower.replace(/s$/, '');
  
  if (singularIngredient === singularItem) return true;
  if (singularIngredient.includes(singularItem) || singularItem.includes(singularIngredient)) {
    return true;
  }
  
  return false;
}

/**
 * Calculates match percentage and identifies which ingredients user has
 */
function calculateRecipeMatch(
  recipe: SampleRecipe,
  fridgeItems: FridgeItem[]
): {
  matchPercentage: number;
  itemsUserHas: string[];
  itemsUserNeeds: string[];
  expiringItemsUsed: Array<{ name: string; daysUntilExpiry: number }>;
} {
  const itemsUserHas: string[] = [];
  const itemsUserNeeds: string[] = [];
  const expiringItemsUsed: Array<{ name: string; daysUntilExpiry: number }> = [];
  
  recipe.ingredients.forEach(ingredient => {
    const matchingItem = fridgeItems.find(item => 
      ingredientMatchesItem(ingredient, item.name)
    );
    
    if (matchingItem) {
      itemsUserHas.push(ingredient);
      
      // Check if this item is expiring soon (0-2 days)
      if (matchingItem.expiry_date) {
        const daysUntilExpiry = differenceInDays(new Date(matchingItem.expiry_date), new Date());
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 2) {
          expiringItemsUsed.push({
            name: matchingItem.name,
            daysUntilExpiry
          });
        }
      }
    } else {
      itemsUserNeeds.push(ingredient);
    }
  });
  
  const matchPercentage = (itemsUserHas.length / recipe.ingredients.length) * 100;
  
  return {
    matchPercentage,
    itemsUserHas,
    itemsUserNeeds,
    expiringItemsUsed
  };
}

/**
 * Calculates urgency score for recipe sorting
 * Higher score = more urgent (uses expiring items, high match)
 */
function calculateUrgencyScore(
  matchPercentage: number,
  expiringItemsCount: number,
  minDaysUntilExpiry: number
): number {
  let score = matchPercentage; // Base score from match percentage
  
  // Bonus for using expiring items
  if (expiringItemsCount > 0) {
    score += 100; // Heavy bonus for using expiring items
    score += (2 - minDaysUntilExpiry) * 50; // More urgent if expiring sooner
    score += expiringItemsCount * 20; // Bonus for multiple expiring items
  }
  
  return score;
}

/**
 * Matches recipes based on fridge contents and sorts by relevance
 */
export function matchRecipes(
  fridgeItems: FridgeItem[],
  category?: string,
  minMatchPercentage: number = 30
): MatchedRecipe[] {
  let recipesToMatch = SAMPLE_RECIPES;
  
  // Filter by category if specified
  if (category) {
    const categoryMap: Record<string, string[]> = {
      quick: ['Easy'],
      healthy: ['Easy', 'Medium'],
      comfort: ['Medium'],
      vegetarian: ['Easy', 'Medium']
    };
    
    // For vegetarian, filter out meat-based recipes
    if (category === 'vegetarian') {
      recipesToMatch = recipesToMatch.filter(recipe => 
        !recipe.ingredients.some(ing => 
          ing.toLowerCase().includes('chicken') || 
          ing.toLowerCase().includes('beef') || 
          ing.toLowerCase().includes('pork') ||
          ing.toLowerCase().includes('bacon') ||
          ing.toLowerCase().includes('meat')
        )
      );
    }
    
    // For quick meals, prioritize recipes under 20 minutes
    if (category === 'quick') {
      recipesToMatch = recipesToMatch.filter(recipe => recipe.cookTime <= 20);
    }
    
    // For healthy, prioritize recipes with vegetables and low difficulty
    if (category === 'healthy') {
      recipesToMatch = recipesToMatch.filter(recipe => 
        recipe.ingredients.some(ing => 
          ing.toLowerCase().includes('lettuce') ||
          ing.toLowerCase().includes('vegetables') ||
          ing.toLowerCase().includes('tomato') ||
          ing.toLowerCase().includes('yogurt')
        )
      );
    }
    
    // For comfort food, prioritize medium difficulty and hearty dishes
    if (category === 'comfort') {
      recipesToMatch = recipesToMatch.filter(recipe => 
        recipe.ingredients.some(ing => 
          ing.toLowerCase().includes('cheese') ||
          ing.toLowerCase().includes('bread') ||
          ing.toLowerCase().includes('pasta') ||
          ing.toLowerCase().includes('rice')
        )
      );
    }
  }
  
  const matchedRecipes: MatchedRecipe[] = recipesToMatch
    .map(recipe => {
      const matchData = calculateRecipeMatch(recipe, fridgeItems);
      const urgencyScore = calculateUrgencyScore(
        matchData.matchPercentage,
        matchData.expiringItemsUsed.length,
        matchData.expiringItemsUsed.length > 0
          ? Math.min(...matchData.expiringItemsUsed.map(item => item.daysUntilExpiry))
          : 999
      );
      
      return {
        ...recipe,
        ...matchData,
        urgencyScore
      };
    })
    .filter(recipe => recipe.matchPercentage >= minMatchPercentage)
    .sort((a, b) => {
      // Primary sort: urgency score (expiring items + match)
      if (Math.abs(b.urgencyScore - a.urgencyScore) > 5) {
        return b.urgencyScore - a.urgencyScore;
      }
      
      // Secondary sort: match percentage
      if (Math.abs(b.matchPercentage - a.matchPercentage) > 5) {
        return b.matchPercentage - a.matchPercentage;
      }
      
      // Tertiary sort: easier and quicker recipes first
      const difficultyScore = (r: MatchedRecipe) => {
        const diffScore = r.difficulty === 'Easy' ? 3 : r.difficulty === 'Medium' ? 2 : 1;
        const timeScore = r.cookTime <= 15 ? 2 : r.cookTime <= 30 ? 1 : 0;
        return diffScore + timeScore;
      };
      
      return difficultyScore(b) - difficultyScore(a);
    });
  
  // Return top 8 recipes
  return matchedRecipes.slice(0, 8);
}
