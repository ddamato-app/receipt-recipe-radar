export interface CategoryBreakdown {
  vegetables: number;
  fruits: number;
  protein: number;
  grains: number;
  dairy: number;
  processed: number;
  other: number;
}

export interface ConsumptionPattern {
  breakdown: CategoryBreakdown;
  totalItems: number;
  weekLabel: string;
}

export interface HealthScore {
  totalScore: number;
  categoryScore: number;
  qualityScore: number;
  smartShoppingScore: number;
  breakdown: CategoryBreakdown;
  recommendations: string[];
  consumptionBreakdown?: CategoryBreakdown;
  buyingVsEatingGap?: {
    category: string;
    bought: number;
    consumed: number;
    gap: number;
  }[];
}

const CATEGORY_KEYWORDS = {
  vegetables: ['lettuce', 'spinach', 'broccoli', 'carrot', 'pepper', 'tomato', 'cucumber', 'onion', 'celery', 'kale', 'cabbage', 'zucchini', 'eggplant', 'cauliflower'],
  fruits: ['apple', 'banana', 'berry', 'berries', 'strawberr', 'orange', 'grape', 'melon', 'pear', 'peach', 'mango', 'pineapple'],
  protein: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'egg', 'tofu', 'bean', 'lentil', 'turkey', 'tuna'],
  grains: ['bread', 'pasta', 'rice', 'quinoa', 'oat', 'cereal', 'tortilla', 'bagel', 'cracker'],
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream'],
  processed: ['pizza', 'chip', 'soda', 'cookie', 'candy', 'frozen meal', 'nugget', 'fries'],
};

export function categorizeItem(itemName: string, currentCategory?: string): string {
  const name = itemName.toLowerCase();
  
  // If already categorized correctly, keep it
  if (currentCategory) {
    const catKey = currentCategory.toLowerCase();
    if (catKey.includes('vegg') || catKey === 'veggies') return 'vegetables';
    if (catKey.includes('fruit')) return 'fruits';
    if (catKey.includes('meat') || catKey.includes('protein')) return 'protein';
    if (catKey.includes('grain') || catKey.includes('pantry')) return 'grains';
    if (catKey.includes('dairy')) return 'dairy';
  }
  
  // Auto-categorize based on keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => name.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
}

export function calculateHealthScore(items: any[]): HealthScore {
  if (items.length === 0) {
    return {
      totalScore: 0,
      categoryScore: 0,
      qualityScore: 0,
      smartShoppingScore: 0,
      breakdown: {
        vegetables: 0,
        fruits: 0,
        protein: 0,
        grains: 0,
        dairy: 0,
        processed: 0,
        other: 0,
      },
      recommendations: ['Add items to your fridge to see your health score'],
    };
  }

  // Categorize all items
  const categorized = items.map(item => ({
    ...item,
    healthCategory: categorizeItem(item.name, item.category),
  }));

  // Calculate category breakdown (percentage)
  const breakdown: CategoryBreakdown = {
    vegetables: 0,
    fruits: 0,
    protein: 0,
    grains: 0,
    dairy: 0,
    processed: 0,
    other: 0,
  };

  categorized.forEach(item => {
    const cat = item.healthCategory as keyof CategoryBreakdown;
    breakdown[cat] = (breakdown[cat] || 0) + 1;
  });

  // Convert to percentages
  Object.keys(breakdown).forEach(key => {
    breakdown[key as keyof CategoryBreakdown] = 
      Math.round((breakdown[key as keyof CategoryBreakdown] / items.length) * 100);
  });

  // Category Balance Score (40 points max)
  let categoryScore = 0;
  const targets = {
    vegetables: { min: 25, max: 40, weight: 1.0 },
    fruits: { min: 15, max: 25, weight: 1.0 },
    protein: { min: 20, max: 30, weight: 0.9 },
    grains: { min: 15, max: 25, weight: 0.8 },
    dairy: { min: 10, max: 20, weight: 0.7 },
    processed: { min: 0, max: 10, weight: -1.0 }, // Negative weight
  };

  Object.entries(targets).forEach(([cat, target]) => {
    const percentage = breakdown[cat as keyof CategoryBreakdown];
    if (cat === 'processed') {
      // Lower is better for processed
      categoryScore += percentage <= target.max ? 40 : Math.max(0, 40 - (percentage - target.max) * 2);
    } else {
      if (percentage >= target.min && percentage <= target.max) {
        categoryScore += 40 * target.weight;
      } else if (percentage < target.min) {
        categoryScore += (percentage / target.min) * 40 * target.weight;
      } else {
        categoryScore += Math.max(0, 40 - (percentage - target.max) * 2) * target.weight;
      }
    }
  });

  categoryScore = Math.min(40, Math.round(categoryScore / 5)); // Average and cap at 40

  // Food Quality Score (30 points max)
  const freshProduceRatio = (breakdown.vegetables + breakdown.fruits) / 100;
  const processedRatio = breakdown.processed / 100;
  const variety = new Set(categorized.map(i => i.name.toLowerCase())).size;
  
  const qualityScore = Math.round(
    (freshProduceRatio * 10) + // Up to 10 points for fresh produce
    ((1 - processedRatio) * 10) + // Up to 10 points for low processed
    (Math.min(variety / items.length, 1) * 10) // Up to 10 points for variety
  );

  // Smart Shopping Score (30 points max)
  const usedItems = items.filter(i => i.status === 'used').length;
  const wasteRate = items.length > 0 ? 1 - (usedItems / items.length) : 0;
  const smartShoppingScore = Math.round(
    (1 - wasteRate) * 30 // Up to 30 points for low waste
  );

  const totalScore = Math.min(100, categoryScore + qualityScore + smartShoppingScore);

  // Generate recommendations
  const recommendations: string[] = [];
  if (breakdown.fruits < 15) {
    recommendations.push('Add more fruits 🍎 - Try bananas, apples, or berries');
  }
  if (breakdown.vegetables < 25) {
    recommendations.push('Increase vegetables 🥬 - Add leafy greens and colorful veggies');
  }
  if (breakdown.processed > 10) {
    recommendations.push('Reduce processed foods 🍕 - Swap for whole ingredients');
  }
  if (variety < items.length * 0.7) {
    recommendations.push('Increase variety 📦 - Try different proteins and grains');
  }
  if (breakdown.vegetables >= 25 && breakdown.vegetables <= 40) {
    recommendations.push('Great job on vegetables! 🥬 Keep it up!');
  }

  return {
    totalScore,
    categoryScore,
    qualityScore,
    smartShoppingScore,
    breakdown,
    recommendations,
  };
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Great';
  if (score >= 50) return 'Good';
  return 'Needs Improvement';
}

export function calculateConsumptionScore(consumedItems: any[]): HealthScore {
  if (consumedItems.length === 0) {
    return {
      totalScore: 0,
      categoryScore: 0,
      qualityScore: 0,
      smartShoppingScore: 0,
      breakdown: {
        vegetables: 0,
        fruits: 0,
        protein: 0,
        grains: 0,
        dairy: 0,
        processed: 0,
        other: 0,
      },
      recommendations: ['Start tracking what you eat by marking items as "used"'],
    };
  }

  // Categorize consumed items
  const categorized = consumedItems.map(item => ({
    ...item,
    healthCategory: categorizeItem(item.name, item.category),
  }));

  // Calculate category breakdown (percentage)
  const breakdown: CategoryBreakdown = {
    vegetables: 0,
    fruits: 0,
    protein: 0,
    grains: 0,
    dairy: 0,
    processed: 0,
    other: 0,
  };

  categorized.forEach(item => {
    const cat = item.healthCategory as keyof CategoryBreakdown;
    breakdown[cat] = (breakdown[cat] || 0) + 1;
  });

  // Convert to percentages
  Object.keys(breakdown).forEach(key => {
    breakdown[key as keyof CategoryBreakdown] = 
      Math.round((breakdown[key as keyof CategoryBreakdown] / consumedItems.length) * 100);
  });

  // Category Balance Score (40 points max) - based on CONSUMPTION
  let categoryScore = 0;
  const targets = {
    vegetables: { min: 30, max: 45, weight: 1.2 }, // Higher target for consumption
    fruits: { min: 15, max: 25, weight: 1.0 },
    protein: { min: 20, max: 30, weight: 1.0 },
    grains: { min: 10, max: 20, weight: 0.8 },
    dairy: { min: 5, max: 15, weight: 0.7 },
    processed: { min: 0, max: 5, weight: -1.5 }, // Stricter on consumption
  };

  Object.entries(targets).forEach(([cat, target]) => {
    const percentage = breakdown[cat as keyof CategoryBreakdown];
    if (cat === 'processed') {
      categoryScore += percentage <= target.max ? 40 : Math.max(0, 40 - (percentage - target.max) * 3);
    } else {
      if (percentage >= target.min && percentage <= target.max) {
        categoryScore += 40 * target.weight;
      } else if (percentage < target.min) {
        categoryScore += (percentage / target.min) * 40 * target.weight;
      } else {
        categoryScore += Math.max(0, 40 - (percentage - target.max) * 2) * target.weight;
      }
    }
  });

  categoryScore = Math.min(40, Math.round(categoryScore / 5));

  // Quality Score (30 points max)
  const freshProduceRatio = (breakdown.vegetables + breakdown.fruits) / 100;
  const processedRatio = breakdown.processed / 100;
  const variety = new Set(categorized.map(i => i.name.toLowerCase())).size;
  
  const qualityScore = Math.round(
    (freshProduceRatio * 12) + // Up to 12 points for fresh produce
    ((1 - processedRatio) * 12) + // Up to 12 points for low processed
    (Math.min(variety / consumedItems.length, 1) * 6) // Up to 6 points for variety
  );

  // Consistency Score (30 points max)
  const smartShoppingScore = Math.min(30, consumedItems.length * 2); // Reward regular tracking

  const totalScore = Math.min(100, categoryScore + qualityScore + smartShoppingScore);

  // Generate recommendations based on consumption
  const recommendations: string[] = [];
  if (breakdown.vegetables < 30) {
    recommendations.push('Eat more vegetables 🥬 - Aim for 30-45% of your diet');
  }
  if (breakdown.fruits < 15) {
    recommendations.push('Add more fruits 🍎 - Target 15-25% of meals');
  }
  if (breakdown.processed > 5) {
    recommendations.push('Reduce processed foods 🍕 - Keep below 5% of consumption');
  }
  if (breakdown.protein < 20) {
    recommendations.push('Increase protein intake 🍗 - Aim for 20-30%');
  }
  if (breakdown.vegetables >= 30 && breakdown.fruits >= 15) {
    recommendations.push('Great produce consumption! 🎉 Keep it up!');
  }
  if (breakdown.processed <= 5) {
    recommendations.push('Excellent! You\'re avoiding processed foods 👏');
  }

  return {
    totalScore,
    categoryScore,
    qualityScore,
    smartShoppingScore,
    breakdown,
    recommendations,
  };
}

export function compareBuyingVsEating(
  fridgeItems: any[],
  consumedItems: any[]
): { category: string; bought: number; consumed: number; gap: number }[] {
  const fridgeBreakdown = calculateHealthScore(fridgeItems).breakdown;
  const consumedBreakdown = calculateConsumptionScore(consumedItems).breakdown;

  const categories = ['vegetables', 'fruits', 'protein', 'grains', 'dairy'];
  
  return categories
    .map(category => {
      const bought = fridgeBreakdown[category as keyof CategoryBreakdown];
      const consumed = consumedBreakdown[category as keyof CategoryBreakdown];
      const gap = bought - consumed;
      
      return {
        category: category.charAt(0).toUpperCase() + category.slice(1),
        bought,
        consumed,
        gap,
      };
    })
    .filter(item => item.bought > 0 || item.consumed > 0)
    .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
}

export function generateSmartRecommendations(
  fridgeItems: any[],
  consumedItems: any[]
): string[] {
  const gaps = compareBuyingVsEating(fridgeItems, consumedItems);
  const recommendations: string[] = [];

  gaps.forEach(({ category, bought, consumed, gap }) => {
    if (gap > 15) {
      recommendations.push(
        `You bought lots of ${category.toLowerCase()} (${bought}%) but only ate ${consumed}% - try more ${category.toLowerCase()} recipes!`
      );
    } else if (gap < -10) {
      recommendations.push(
        `You ate more ${category.toLowerCase()} than you bought - consider stocking up!`
      );
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('Your buying and eating patterns are well balanced! 🎯');
  }

  return recommendations;
}
