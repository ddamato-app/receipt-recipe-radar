import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Copy, Search, ChefHat } from "lucide-react";
import { toast } from "sonner";

type Recipe = {
  id: string;
  name: string;
  category: string;
  description: string;
  ingredients: string[];
  instructions: string;
  cookTime: number;
  difficulty: "Easy" | "Medium" | "Hard";
  imageUrl?: string;
  status: "Active" | "Draft";
  timesGenerated: number;
};

const generateMockRecipes = (): Recipe[] => {
  const categories = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];
  const difficulties: ("Easy" | "Medium" | "Hard")[] = ["Easy", "Medium", "Hard"];
  const recipeNames = [
    "Chicken Stir Fry", "Caesar Salad", "Smoothie Bowl", "Spaghetti Carbonara",
    "Veggie Omelette", "Grilled Salmon", "Beef Tacos", "Margherita Pizza",
    "Chicken Curry", "Greek Salad", "Pancakes", "Burger & Fries",
    "Pad Thai", "Mushroom Risotto", "Chicken Wings", "Fish & Chips",
    "Vegetable Soup", "Lasagna", "Sushi Rolls", "French Toast",
    "Chocolate Cake", "Apple Pie", "Tiramisu", "Brownies",
    "Muffins", "Cookies", "Ice Cream Sundae", "Cheesecake",
    "Fruit Salad", "Avocado Toast"
  ];

  return recipeNames.map((name, i) => ({
    id: `recipe-${i + 1}`,
    name,
    category: categories[Math.floor(Math.random() * categories.length)],
    description: `Delicious ${name.toLowerCase()} recipe that's perfect for any occasion.`,
    ingredients: [
      "Main ingredient 1",
      "Main ingredient 2",
      "Seasoning",
      "Optional garnish"
    ],
    instructions: "1. Prepare ingredients\n2. Cook as needed\n3. Season to taste\n4. Serve hot",
    cookTime: Math.floor(Math.random() * 60) + 10,
    difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
    status: Math.random() > 0.2 ? "Active" : "Draft",
    timesGenerated: Math.floor(Math.random() * 500),
  }));
};

export default function AdminRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>(generateMockRecipes());
  const [searchTerm, setSearchTerm] = useState("");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState<Partial<Recipe>>({
    name: "",
    category: "Dinner",
    description: "",
    ingredients: [],
    instructions: "",
    cookTime: 30,
    difficulty: "Medium",
    imageUrl: "",
    status: "Active",
  });

  const handleAddNew = () => {
    setFormData({
      name: "",
      category: "Dinner",
      description: "",
      ingredients: [],
      instructions: "",
      cookTime: 30,
      difficulty: "Medium",
      imageUrl: "",
      status: "Active",
    });
    setIsAddingNew(true);
    setEditingRecipe(null);
  };

  const handleEdit = (recipe: Recipe) => {
    setFormData(recipe);
    setEditingRecipe(recipe);
    setIsAddingNew(false);
  };

  const handleSave = () => {
    if (!formData.name || !formData.category) {
      toast.error("Please fill in required fields");
      return;
    }

    const recipeData: Recipe = {
      id: editingRecipe?.id || `recipe-${Date.now()}`,
      name: formData.name!,
      category: formData.category!,
      description: formData.description || "",
      ingredients: formData.ingredients || [],
      instructions: formData.instructions || "",
      cookTime: formData.cookTime || 30,
      difficulty: formData.difficulty || "Medium",
      imageUrl: formData.imageUrl,
      status: formData.status || "Active",
      timesGenerated: editingRecipe?.timesGenerated || 0,
    };

    if (editingRecipe) {
      setRecipes(recipes.map(r => r.id === editingRecipe.id ? recipeData : r));
      toast.success("Recipe updated successfully");
    } else {
      setRecipes([recipeData, ...recipes]);
      toast.success("Recipe added successfully");
    }

    setEditingRecipe(null);
    setIsAddingNew(false);
  };

  const handleDelete = () => {
    if (!recipeToDelete) return;
    
    setRecipes(recipes.filter(r => r.id !== recipeToDelete.id));
    toast.success("Recipe deleted successfully");
    setRecipeToDelete(null);
  };

  const handleDuplicate = (recipe: Recipe) => {
    const duplicated: Recipe = {
      ...recipe,
      id: `recipe-${Date.now()}`,
      name: `${recipe.name} (Copy)`,
      timesGenerated: 0,
    };
    setRecipes([duplicated, ...recipes]);
    toast.success("Recipe duplicated successfully");
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "Medium": return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "Hard": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Recipe Management</h1>
        <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Recipe
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search recipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipe</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cook Time</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Times Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecipes.map((recipe) => (
                <TableRow key={recipe.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <ChefHat className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{recipe.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{recipe.category}</Badge>
                  </TableCell>
                  <TableCell>{recipe.cookTime} min</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getDifficultyColor(recipe.difficulty)}>
                      {recipe.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">{recipe.timesGenerated}</TableCell>
                  <TableCell>
                    <Badge variant={recipe.status === "Active" ? "default" : "secondary"}>
                      {recipe.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(recipe)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDuplicate(recipe)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setRecipeToDelete(recipe)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredRecipes.map((recipe) => (
          <Card key={recipe.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{recipe.name}</p>
                    <Badge variant="outline" className="mt-1">{recipe.category}</Badge>
                  </div>
                </div>
                <Badge variant={recipe.status === "Active" ? "default" : "secondary"}>
                  {recipe.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{recipe.cookTime} min</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Difficulty</p>
                  <Badge variant="secondary" className={getDifficultyColor(recipe.difficulty)}>
                    {recipe.difficulty}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Generated</p>
                  <p className="font-medium">{recipe.timesGenerated}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(recipe)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDuplicate(recipe)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setRecipeToDelete(recipe)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Recipe Modal */}
      <Dialog open={isAddingNew || !!editingRecipe} onOpenChange={() => {
        setIsAddingNew(false);
        setEditingRecipe(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? "Edit Recipe" : "Add New Recipe"}</DialogTitle>
            <DialogDescription>
              {editingRecipe ? "Update recipe details" : "Create a new recipe for the database"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Recipe Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chicken Stir Fry"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                  <SelectItem value="Lunch">Lunch</SelectItem>
                  <SelectItem value="Dinner">Dinner</SelectItem>
                  <SelectItem value="Snack">Snack</SelectItem>
                  <SelectItem value="Dessert">Dessert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the recipe"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="ingredients">Ingredients (one per line)</Label>
              <Textarea
                id="ingredients"
                value={formData.ingredients?.join('\n') || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  ingredients: e.target.value.split('\n').filter(i => i.trim()) 
                })}
                placeholder="2 cups flour&#10;1 tsp salt&#10;3 eggs"
                rows={6}
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="1. First step&#10;2. Second step&#10;3. Third step"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cookTime">Cook Time (minutes)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  value={formData.cookTime}
                  onChange={(e) => setFormData({ ...formData, cookTime: parseInt(e.target.value) || 0 })}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/recipe-image.jpg"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="status"
                checked={formData.status === "Active"}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, status: checked ? "Active" : "Draft" })
                }
              />
              <Label htmlFor="status">Active (visible to users)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddingNew(false);
              setEditingRecipe(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!recipeToDelete} onOpenChange={() => setRecipeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recipe: {recipeToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This recipe will be permanently removed from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
