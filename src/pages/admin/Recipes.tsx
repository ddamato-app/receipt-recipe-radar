import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function AdminRecipes() {
  const [recipes] = useState([
    {
      id: "1",
      name: "Caesar Salad",
      ingredients: ["Lettuce", "Caesar Dressing", "Croutons", "Parmesan"],
      timesGenerated: 432,
      cookTime: "15 min",
      difficulty: "Easy",
    },
    {
      id: "2",
      name: "Spaghetti Carbonara",
      ingredients: ["Spaghetti", "Eggs", "Bacon", "Parmesan"],
      timesGenerated: 389,
      cookTime: "25 min",
      difficulty: "Medium",
    },
    {
      id: "3",
      name: "Chicken Stir Fry",
      ingredients: ["Chicken", "Mixed Vegetables", "Soy Sauce", "Rice"],
      timesGenerated: 356,
      cookTime: "30 min",
      difficulty: "Easy",
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Recipe
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{recipe.name}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ingredients:</p>
                <p className="text-sm">{recipe.ingredients.join(", ")}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cook Time:</span>
                <span>{recipe.cookTime}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Difficulty:</span>
                <span>{recipe.difficulty}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Generated:</span>
                <span className="font-semibold">{recipe.timesGenerated} times</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
