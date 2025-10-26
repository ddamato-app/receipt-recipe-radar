import chickenStirFryImg from "@/assets/recipe-chicken-stir-fry.jpg";
import spaghettiCarbonaraImg from "@/assets/recipe-spaghetti-carbonara.jpg";
import caesarSaladImg from "@/assets/recipe-caesar-salad.jpg";
import friedRiceImg from "@/assets/recipe-fried-rice.jpg";
import veggieOmeletteImg from "@/assets/recipe-veggie-omelette.jpg";

export type SampleRecipe = {
  id: string;
  name: string;
  image: string;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
  instructions: string[];
  description: string;
};

export const SAMPLE_RECIPES: SampleRecipe[] = [
  {
    id: "recipe-1",
    name: "Chicken Stir Fry",
    image: chickenStirFryImg,
    cookTime: 15,
    servings: 4,
    difficulty: "Easy",
    ingredients: ["Chicken Breast", "Lettuce", "Vegetables", "Soy Sauce", "Garlic", "Ginger"],
    instructions: [
      "Cut chicken into bite-sized pieces",
      "Heat oil in a wok or large pan",
      "Cook chicken until golden brown",
      "Add vegetables and stir fry for 3-4 minutes",
      "Add soy sauce, garlic, and ginger",
      "Serve hot with rice"
    ],
    description: "Quick and healthy stir fry with fresh vegetables"
  },
  {
    id: "recipe-2",
    name: "Strawberry Smoothie",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop",
    cookTime: 5,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["Strawberries", "Yogurt", "Milk", "Honey"],
    instructions: [
      "Wash and hull strawberries",
      "Add all ingredients to blender",
      "Blend until smooth",
      "Pour into glasses and serve"
    ],
    description: "Refreshing and nutritious strawberry smoothie"
  },
  {
    id: "recipe-3",
    name: "Caesar Salad",
    image: caesarSaladImg,
    cookTime: 10,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["Lettuce", "Chicken Breast", "Parmesan", "Caesar Dressing", "Croutons"],
    instructions: [
      "Grill or pan-fry chicken breast",
      "Chop lettuce into bite-sized pieces",
      "Slice cooked chicken",
      "Toss lettuce with dressing",
      "Top with chicken, parmesan, and croutons"
    ],
    description: "Classic Caesar salad with grilled chicken"
  },
  {
    id: "recipe-4",
    name: "French Toast",
    image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=300&fit=crop",
    cookTime: 15,
    servings: 4,
    difficulty: "Easy",
    ingredients: ["Bread", "Milk", "Eggs", "Cinnamon", "Butter", "Maple Syrup"],
    instructions: [
      "Whisk together milk, eggs, and cinnamon",
      "Heat butter in a pan",
      "Dip bread slices in egg mixture",
      "Cook until golden brown on both sides",
      "Serve with maple syrup and fresh berries"
    ],
    description: "Classic French toast for a perfect breakfast"
  },
  {
    id: "recipe-5",
    name: "Grilled Chicken Sandwich",
    image: "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=400&h=300&fit=crop",
    cookTime: 20,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["Chicken Breast", "Lettuce", "Bread", "Tomato", "Mayo", "Cheese"],
    instructions: [
      "Season and grill chicken breast",
      "Toast bread slices",
      "Spread mayo on bread",
      "Layer lettuce, tomato, cheese, and chicken",
      "Top with second bread slice and serve"
    ],
    description: "Delicious grilled chicken sandwich"
  },
  {
    id: "recipe-6",
    name: "Fruit Yogurt Parfait",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
    cookTime: 5,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["Yogurt", "Strawberries", "Granola", "Honey"],
    instructions: [
      "Layer yogurt in glasses",
      "Add sliced strawberries",
      "Sprinkle granola on top",
      "Drizzle with honey",
      "Serve immediately"
    ],
    description: "Healthy and delicious yogurt parfait"
  },
  {
    id: "recipe-7",
    name: "Veggie Omelette",
    image: veggieOmeletteImg,
    cookTime: 10,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["Eggs", "Lettuce", "Tomato", "Cheese", "Butter"],
    instructions: [
      "Beat eggs in a bowl",
      "Heat butter in a pan",
      "Pour eggs and let set slightly",
      "Add chopped vegetables and cheese",
      "Fold and serve hot"
    ],
    description: "Fluffy omelette packed with fresh vegetables"
  },
  {
    id: "recipe-8",
    name: "Spaghetti Carbonara",
    image: spaghettiCarbonaraImg,
    cookTime: 20,
    servings: 4,
    difficulty: "Medium",
    ingredients: ["Spaghetti", "Eggs", "Bacon", "Parmesan", "Black Pepper"],
    instructions: [
      "Cook spaghetti according to package",
      "Fry bacon until crispy",
      "Mix eggs and parmesan",
      "Toss hot pasta with egg mixture",
      "Add bacon and pepper, serve"
    ],
    description: "Creamy Italian classic pasta"
  },
  {
    id: "recipe-9",
    name: "Chicken Fried Rice",
    image: friedRiceImg,
    cookTime: 25,
    servings: 4,
    difficulty: "Easy",
    ingredients: ["Chicken Breast", "Rice", "Eggs", "Vegetables", "Soy Sauce", "Garlic"],
    instructions: [
      "Cook rice and let cool",
      "Dice chicken and cook",
      "Scramble eggs separately",
      "Stir fry vegetables",
      "Combine all with rice and soy sauce"
    ],
    description: "Satisfying fried rice with chicken and vegetables"
  },
  {
    id: "recipe-10",
    name: "Chicken Quesadilla",
    image: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400&h=300&fit=crop",
    cookTime: 15,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["Chicken Breast", "Tortillas", "Cheese", "Bell Peppers", "Onion"],
    instructions: [
      "Cook and shred chicken",
      "Sauté peppers and onions",
      "Layer cheese, chicken, and veggies on tortilla",
      "Top with another tortilla",
      "Cook until golden and cheese melts"
    ],
    description: "Cheesy chicken quesadilla with vegetables"
  },
  {
    id: "recipe-11",
    name: "Caprese Salad",
    image: "https://images.unsplash.com/photo-1592417817038-d13a4f0e729e?w=400&h=300&fit=crop",
    cookTime: 10,
    servings: 4,
    difficulty: "Easy",
    ingredients: ["Tomato", "Mozzarella", "Basil", "Olive Oil", "Balsamic Vinegar"],
    instructions: [
      "Slice tomatoes and mozzarella",
      "Arrange on a plate alternating",
      "Add fresh basil leaves",
      "Drizzle with olive oil and balsamic",
      "Season with salt and pepper"
    ],
    description: "Fresh Italian salad with tomatoes and mozzarella"
  },
  {
    id: "recipe-12",
    name: "Egg Salad Sandwich",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
    cookTime: 15,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["Eggs", "Bread", "Mayo", "Lettuce", "Mustard"],
    instructions: [
      "Hard boil eggs and chop",
      "Mix with mayo and mustard",
      "Toast bread if desired",
      "Add lettuce to bread",
      "Spread egg salad and serve"
    ],
    description: "Classic egg salad sandwich"
  },
  {
    id: "recipe-13",
    name: "Chicken Caesar Wrap",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop",
    cookTime: 10,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["Chicken Breast", "Lettuce", "Tortilla", "Caesar Dressing", "Parmesan"],
    instructions: [
      "Grill or cook chicken breast",
      "Chop lettuce finely",
      "Slice chicken into strips",
      "Mix lettuce with Caesar dressing",
      "Wrap in tortilla with chicken and parmesan"
    ],
    description: "Caesar salad in a convenient wrap"
  },
  {
    id: "recipe-14",
    name: "Strawberry Milkshake",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop",
    cookTime: 5,
    servings: 2,
    difficulty: "Easy",
    ingredients: ["Strawberries", "Milk", "Ice Cream", "Sugar"],
    instructions: [
      "Hull strawberries",
      "Add all ingredients to blender",
      "Blend until smooth and creamy",
      "Pour into glasses",
      "Top with whipped cream if desired"
    ],
    description: "Creamy strawberry milkshake"
  },
  {
    id: "recipe-15",
    name: "Greek Yogurt Bowl",
    image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&h=300&fit=crop",
    cookTime: 5,
    servings: 1,
    difficulty: "Easy",
    ingredients: ["Yogurt", "Granola", "Strawberries", "Honey", "Nuts"],
    instructions: [
      "Add yogurt to a bowl",
      "Top with fresh strawberries",
      "Sprinkle granola and nuts",
      "Drizzle with honey",
      "Enjoy immediately"
    ],
    description: "Healthy Greek yogurt breakfast bowl"
  },
  {
    id: "recipe-16",
    name: "Chicken Lettuce Wraps",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop",
    cookTime: 15,
    servings: 4,
    difficulty: "Easy",
    ingredients: ["Chicken Breast", "Lettuce", "Soy Sauce", "Garlic", "Ginger", "Green Onions"],
    instructions: [
      "Cook ground chicken with garlic and ginger",
      "Add soy sauce and green onions",
      "Wash and separate lettuce leaves",
      "Spoon chicken mixture into lettuce cups",
      "Serve with extra sauce"
    ],
    description: "Light and flavorful Asian-inspired lettuce wraps"
  },
  {
    id: "recipe-17",
    name: "Simple Chicken Soup",
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop",
    cookTime: 30,
    servings: 6,
    difficulty: "Easy",
    ingredients: ["Chicken Breast", "Vegetables", "Chicken Broth", "Garlic", "Herbs"],
    instructions: [
      "Dice chicken and vegetables",
      "Sauté chicken until cooked",
      "Add broth and bring to boil",
      "Add vegetables and herbs",
      "Simmer for 20 minutes and serve"
    ],
    description: "Comforting homemade chicken soup"
  },
  {
    id: "recipe-18",
    name: "Bread Pudding",
    image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&h=300&fit=crop",
    cookTime: 45,
    servings: 8,
    difficulty: "Medium",
    ingredients: ["Bread", "Milk", "Eggs", "Sugar", "Cinnamon", "Vanilla"],
    instructions: [
      "Cube stale bread",
      "Mix milk, eggs, sugar, and spices",
      "Pour over bread and let soak",
      "Bake at 350°F for 45 minutes",
      "Serve warm with cream or sauce"
    ],
    description: "Sweet and comforting bread pudding dessert"
  },
  {
    id: "recipe-19",
    name: "Chicken Salad",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    cookTime: 15,
    servings: 4,
    difficulty: "Easy",
    ingredients: ["Chicken Breast", "Lettuce", "Tomato", "Cucumber", "Ranch Dressing"],
    instructions: [
      "Grill and slice chicken",
      "Chop all vegetables",
      "Toss in a large bowl",
      "Add chicken on top",
      "Drizzle with dressing and serve"
    ],
    description: "Fresh and healthy chicken salad"
  },
  {
    id: "recipe-20",
    name: "Yogurt Chicken Marinade",
    image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=300&fit=crop",
    cookTime: 30,
    servings: 4,
    difficulty: "Easy",
    ingredients: ["Chicken Breast", "Yogurt", "Garlic", "Lemon", "Spices"],
    instructions: [
      "Mix yogurt with garlic and spices",
      "Marinate chicken for 2 hours",
      "Grill or bake chicken",
      "Cook until internal temp reaches 165°F",
      "Serve with rice or salad"
    ],
    description: "Tender yogurt-marinated grilled chicken"
  }
];
