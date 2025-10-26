import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  Check, 
  X, 
  AlertCircle, 
  Flame,
  DollarSign,
  Clock,
  Users,
  Plus,
  Share2,
  Save,
  CheckCircle2,
  TrendingDown,
  Lightbulb,
  Apple,
  Calendar
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import { SAMPLE_RECIPES } from "@/lib/sampleRecipes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FridgeItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string | null;
  price?: number;
}

interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  category: string;
  forMeal?: string;
  checked: boolean;
}

interface MealSuggestion {
  recipeName: string;
  image: string;
  hasIngredients: string[];
  needsIngredients: { name: string; price: number }[];
  totalCost: number;
  servings: number;
  cookTime: string;
}

const STORES = [
  "Walmart",
  "Costco",
  "Metro",
  "IGA",
  "Whole Foods",
  "Loblaws",
  "Sobeys",
  "Food Basics",
  "Other"
];

export default function ShoppingMode() {
  const [selectedStore, setSelectedStore] = useState("");
  const [shoppingStarted, setShoppingStarted] = useState(false);
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [showAllItems, setShowAllItems] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [showDoneDialog, setShowDoneDialog] = useState(false);
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tier, user } = useAuth();

  useEffect(() => {
    fetchFridgeItems();
    generateMealSuggestions();
  }, []);

  const fetchFridgeItems = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('fridge_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      setFridgeItems(data || []);
    } catch (error) {
      console.error('Error fetching fridge items:', error);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string | null) => {
    if (!expiryDate) return 999;
    return differenceInDays(new Date(expiryDate), new Date());
  };

  const getExpiryColor = (days: number) => {
    if (days <= 1) return "text-destructive";
    if (days <= 3) return "text-warning";
    return "text-success";
  };

  const generateMealSuggestions = () => {
    // Take first 3 recipes and generate mock suggestions
    const suggestions: MealSuggestion[] = SAMPLE_RECIPES.slice(0, 3).map((recipe) => {
      const hasIngredients = recipe.ingredients.slice(0, Math.floor(recipe.ingredients.length * 0.7));
      const needsIngredients = recipe.ingredients.slice(Math.floor(recipe.ingredients.length * 0.7))
        .map(ing => ({
          name: ing.split(' ').slice(1).join(' '),
          price: Math.random() * 5 + 1
        }));

      return {
        recipeName: recipe.name,
        image: recipe.image,
        hasIngredients: hasIngredients.map(ing => ing.split(' ').slice(1).join(' ')),
        needsIngredients,
        totalCost: needsIngredients.reduce((sum, item) => sum + item.price, 0),
        servings: recipe.servings,
        cookTime: `${recipe.cookTime} min`,
      };
    });

    setMealSuggestions(suggestions);
  };

  const addMealToList = (meal: MealSuggestion) => {
    const newItems: ShoppingItem[] = meal.needsIngredients.map(item => ({
      id: Math.random().toString(),
      name: item.name,
      price: item.price,
      category: 'Meal Ingredient',
      forMeal: meal.recipeName,
      checked: false,
    }));

    setShoppingList([...shoppingList, ...newItems]);
    toast({
      title: "Added to list!",
      description: `${meal.needsIngredients.length} items from ${meal.recipeName}`,
    });
  };

  const addCustomItem = () => {
    if (!customItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: Math.random().toString(),
      name: customItemName,
      price: parseFloat(customItemPrice) || 0,
      category: 'Custom',
      checked: false,
    };

    setShoppingList([...shoppingList, newItem]);
    setCustomItemName("");
    setCustomItemPrice("");
    toast({
      title: "Item added",
      description: `${customItemName} added to your list`,
    });
  };

  const toggleItem = (id: string) => {
    setShoppingList(shoppingList.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const removeItem = (id: string) => {
    setShoppingList(shoppingList.filter(item => item.id !== id));
  };

  const handleDoneShopping = async () => {
    const checkedItems = shoppingList.filter(item => item.checked);
    
    if (checkedItems.length === 0) {
      toast({
        title: "No items checked",
        description: "Check off items you purchased first",
        variant: "destructive",
      });
      return;
    }

    setShowDoneDialog(true);
  };

  const confirmAddToFridge = async () => {
    try {
      if (!user) return;

      const checkedItems = shoppingList.filter(item => item.checked);
      const today = new Date();
      
      const itemsToInsert = checkedItems.map(item => ({
        user_id: user.id,
        name: item.name,
        quantity: 1,
        unit: 'pcs',
        category: item.category === 'Custom' ? 'Other' : item.category,
        price: item.price,
        expiry_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        status: 'active',
      }));

      const { error } = await supabase
        .from('fridge_items')
        .insert(itemsToInsert);

      if (error) throw error;

      // Save shopping session
      const session = {
        date: new Date().toISOString(),
        storeName: selectedStore,
        items: checkedItems,
        totalCost: checkedItems.reduce((sum, item) => sum + item.price, 0),
        completed: true,
      };
      
      const existingSessions = JSON.parse(localStorage.getItem('shoppingSessions') || '[]');
      localStorage.setItem('shoppingSessions', JSON.stringify([session, ...existingSessions]));

      toast({
        title: "Success!",
        description: `Added ${checkedItems.length} items to your fridge`,
      });

      setShowDoneDialog(false);
      navigate('/inventory');
    } catch (error) {
      console.error('Error adding items:', error);
      toast({
        title: "Error",
        description: "Failed to add items to fridge",
        variant: "destructive",
      });
    }
  };

  const totalCost = shoppingList.reduce((sum, item) => sum + item.price, 0);
  const checkedCount = shoppingList.filter(item => item.checked).length;

  const expiringItems = fridgeItems.filter(item => {
    const days = getDaysUntilExpiry(item.expiry_date);
    return days <= 5;
  });

  const displayedFridgeItems = showAllItems 
    ? fridgeItems 
    : fridgeItems.filter(item => getDaysUntilExpiry(item.expiry_date) <= 3);

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">🛒 Shopping Mode</h1>
        <p className="text-muted-foreground">Your smart shopping companion</p>
      </div>

      {/* Store Selector */}
      <Card className="p-6 shadow-lg">
        <h2 className="text-lg font-bold text-foreground mb-4">Where are you shopping?</h2>
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a store" />
          </SelectTrigger>
          <SelectContent>
            {STORES.map(store => (
              <SelectItem key={store} value={store}>{store}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedStore && !shoppingStarted && (
          <Button
            onClick={() => setShoppingStarted(true)}
            className="w-full mt-4 bg-gradient-to-r from-primary to-success text-white"
            size="lg"
          >
            Start Shopping
          </Button>
        )}
      </Card>

      {shoppingStarted && (
        <>
          {/* Items Already in Fridge */}
          <Card className="p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  Already in Your Fridge
                </h2>
                <p className="text-sm text-muted-foreground">Avoid buying these duplicates</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllItems(!showAllItems)}
              >
                {showAllItems ? "Hide Safe Items" : "Show All"}
              </Button>
            </div>

            {displayedFridgeItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {showAllItems 
                    ? "Your fridge is empty! Add items first to get personalized suggestions."
                    : "No items expiring soon - you're all set!"
                  }
                </p>
                <Button onClick={() => navigate('/add')}>Add Items Now</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {displayedFridgeItems.map(item => {
                  const daysLeft = getDaysUntilExpiry(item.expiry_date);
                  return (
                    <Card key={item.id} className="p-3">
                      <div className="text-2xl mb-2">
                        {item.category === 'Dairy' && '🥛'}
                        {item.category === 'Meat' && '🍗'}
                        {item.category === 'Vegetables' && '🥬'}
                        {item.category === 'Fruits' && '🍎'}
                        {!['Dairy', 'Meat', 'Vegetables', 'Fruits'].includes(item.category) && '📦'}
                      </div>
                      <p className="font-semibold text-foreground text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} {item.unit}</p>
                      <p className={`text-xs font-medium ${getExpiryColor(daysLeft)}`}>
                        {daysLeft <= 0 ? 'Expired' : daysLeft === 1 ? 'Expires tomorrow' : `Expires in ${daysLeft}d`}
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">{item.category}</Badge>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Smart Suggestions Tabs */}
          <Card className="p-6 shadow-lg">
            <h2 className="text-lg font-bold text-foreground mb-4">🍳 Smart Suggestions</h2>
            
            <Tabs defaultValue="meals" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="meals">Meal Plans</TabsTrigger>
                <TabsTrigger value="runningLow">Running Low</TabsTrigger>
                <TabsTrigger value="specials">Store Specials</TabsTrigger>
              </TabsList>

              <TabsContent value="meals" className="space-y-4 mt-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-foreground mb-1">Complete These Meals This Week</h3>
                  <p className="text-sm text-muted-foreground">
                    Recipes you can make with just a few additions
                  </p>
                </div>

                {mealSuggestions.map((meal, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="flex gap-4">
                      <img src={meal.image} alt={meal.recipeName} className="w-24 h-24 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground mb-2">{meal.recipeName}</h4>
                        
                        <p className="text-sm text-success mb-1">
                          ✓ You have: {meal.hasIngredients.slice(0, 3).join(', ')}
                        </p>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          🛒 Need to buy:
                        </p>
                        <ul className="text-xs space-y-1 mb-2">
                          {meal.needsIngredients.map((item, i) => (
                            <li key={i} className="text-muted-foreground">
                              ☐ {item.name} - ${item.price.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${meal.totalCost.toFixed(2)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Serves {meal.servings}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {meal.cookTime}
                          </span>
                        </div>
                        
                        <Button 
                          size="sm" 
                          onClick={() => addMealToList(meal)}
                          className="w-full"
                        >
                          Add Items to List
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Total for all meals: {mealSuggestions.reduce((sum, m) => sum + m.needsIngredients.length, 0)} items | 
                    ${mealSuggestions.reduce((sum, m) => sum + m.totalCost, 0).toFixed(2)}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => mealSuggestions.forEach(meal => addMealToList(meal))}
                  >
                    Add All to Shopping List
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="runningLow" className="space-y-4 mt-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">⚠️ Expiring Soon - Use or Replace</h3>
                  {expiringItems.length > 0 ? (
                    <div className="space-y-2">
                      {expiringItems.slice(0, 3).map(item => {
                        const days = getDaysUntilExpiry(item.expiry_date);
                        return (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                            <span className="text-sm text-foreground">
                              ☐ {item.name} (expires {days === 0 ? 'today' : `in ${days}d`})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items expiring soon!</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">💡 Healthy Additions</h3>
                  <p className="text-sm text-muted-foreground mb-3">Boost your health score with these:</p>
                  <div className="space-y-2">
                    {['Broccoli (Boost vegetable intake)', 'Apples (Add more fruits)', 'Salmon (Healthy protein)'].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-success/10 rounded">
                        <span className="text-sm text-foreground">☐ {item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="specials" className="space-y-4 mt-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">🏷️ On Sale This Week</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Strawberries', price: 3.99, save: 2.00 },
                      { name: 'Ground Beef', price: 4.99, save: 3.00 },
                      { name: 'Organic Spinach', price: 2.50, save: 1.50 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-primary/10 rounded">
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-sm text-success">Save ${item.save.toFixed(2)}</p>
                        </div>
                        <Badge className="bg-primary">${item.price}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">🌱 Seasonal Picks</h3>
                  <p className="text-sm text-muted-foreground mb-2">Fresh and affordable this season:</p>
                  <div className="flex flex-wrap gap-2">
                    {['Asparagus', 'Strawberries', 'Lettuce', 'Cucumbers'].map(item => (
                      <Badge key={item} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Shopping List */}
          <Card className="p-6 shadow-lg">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              📝 Your Shopping List
              <Badge variant="outline" className="ml-auto">
                {checkedCount}/{shoppingList.length} items
              </Badge>
            </h2>

            {shoppingList.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Your list is empty</p>
                <p className="text-sm text-muted-foreground">
                  Add items from meal plans, running low, or create custom items below
                </p>
              </div>
            ) : (
              <ScrollArea className="h-64 mb-4">
                <div className="space-y-2">
                  {shoppingList.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Checkbox 
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>${item.price.toFixed(2)}</span>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                          {item.forMeal && <span className="text-primary">For: {item.forMeal}</span>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="mb-4 p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Total:</span>
                <span className="text-xl font-bold text-foreground">${totalCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Add Custom Item */}
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-semibold text-foreground">Add Custom Item</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Item name"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
                />
                <Input
                  placeholder="$0.00"
                  type="number"
                  step="0.01"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="w-24"
                />
                <Button onClick={addCustomItem} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Shopping Tips */}
          {expiringItems.length > 0 && (
            <Card className="p-4 bg-warning/10 border-warning/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-1">⚠️ Waste Prevention Tip</p>
                  <p className="text-sm text-muted-foreground">
                    You have {expiringItems.length} items expiring soon - prioritize recipes using them before buying more!
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Bottom Actions */}
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t shadow-lg">
            <div className="max-w-7xl mx-auto grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem('savedShoppingList', JSON.stringify(shoppingList));
                  toast({ title: "List saved!", description: "Access from Profile → Shopping History" });
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const text = `FreshTrack Shopping List:\n${shoppingList.map(i => `- ${i.name}`).join('\n')}`;
                  if (navigator.share) {
                    navigator.share({ text });
                  } else {
                    navigator.clipboard.writeText(text);
                    toast({ title: "Copied to clipboard!" });
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={handleDoneShopping}
                className="bg-gradient-to-r from-primary to-success text-white"
                disabled={shoppingList.length === 0}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Done Shopping Dialog */}
      <Dialog open={showDoneDialog} onOpenChange={setShowDoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add these items to your fridge?</DialogTitle>
            <DialogDescription>
              We'll add the items you checked off with today's date and estimated expiration.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {shoppingList.filter(item => item.checked).map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">{item.name}</span>
                  <span className="text-sm text-muted-foreground">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDoneDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmAddToFridge} className="flex-1 bg-gradient-to-r from-primary to-success text-white">
              Yes, Add All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
