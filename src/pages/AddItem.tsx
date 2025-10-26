import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X, Check, Loader2, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type ScannedItem = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: string;
  daysLeft: number;
  price?: number;
};

export default function AddItem() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPriceInput, setShowPriceInput] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "1",
    unit: "pcs",
    category: "",
    expiryDate: "",
    expiryQuick: "",
    price: "",
  });

  // Common items with their default categories
  const commonItems = [
    { name: "Milk", category: "Dairy", expiry: 7 },
    { name: "Eggs", category: "Dairy", expiry: 14 },
    { name: "Bread", category: "Bakery", expiry: 3 },
    { name: "Chicken", category: "Meat", expiry: 3 },
    { name: "Lettuce", category: "Vegetables", expiry: 5 },
    { name: "Tomatoes", category: "Vegetables", expiry: 7 },
    { name: "Yogurt", category: "Dairy", expiry: 14 },
    { name: "Cheese", category: "Dairy", expiry: 21 },
    { name: "Apples", category: "Fruits", expiry: 14 },
    { name: "Carrots", category: "Vegetables", expiry: 14 },
    { name: "Ground Beef", category: "Meat", expiry: 2 },
    { name: "Butter", category: "Dairy", expiry: 30 },
  ];

  // Autocomplete suggestions
  const itemSuggestions = [
    ...commonItems.map(item => ({ name: item.name, category: item.category })),
    { name: "Orange Juice", category: "Beverages" },
    { name: "Banana", category: "Fruits" },
    { name: "Broccoli", category: "Vegetables" },
    { name: "Salmon", category: "Meat" },
    { name: "Rice", category: "Other" },
    { name: "Pasta", category: "Other" },
  ];

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScannedItems([]);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Image = e.target?.result as string;
      setScannedImage(base64Image);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-receipt`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ imageBase64: base64Image }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to scan receipt');
        }

        const data = await response.json();
        setScannedItems(data.items || []);
        
        toast({
          title: "Receipt Scanned!",
          description: `Found ${data.items?.length || 0} items`,
        });
      } catch (error) {
        console.error('Scan error:', error);
        toast({
          title: "Scan Failed",
          description: error instanceof Error ? error.message : "Failed to process receipt",
          variant: "destructive",
        });
      } finally {
        setIsScanning(false);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleClearScan = () => {
    setScannedImage(null);
    setScannedItems([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddScannedItems = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to add items",
          variant: "destructive",
        });
        return;
      }

      const itemsToInsert = scannedItems.map(item => ({
        user_id: user.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        expiry_date: item.expiryDate,
        price: item.price || 0,
      }));

      const { error } = await supabase
        .from('fridge_items')
        .insert(itemsToInsert);

      if (error) throw error;

      toast({
        title: "Items added!",
        description: `Successfully added ${scannedItems.length} items to your fridge.`,
      });
      
      handleClearScan();
      navigate('/inventory');
    } catch (error: any) {
      console.error('Error adding items:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add items",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdd = async (item: typeof commonItems[0]) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to add items",
          variant: "destructive",
        });
        return;
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + item.expiry);

      const { error } = await supabase
        .from('fridge_items')
        .insert([{
          user_id: user.id,
          name: item.name,
          quantity: 1,
          unit: "pcs",
          category: item.category,
          expiry_date: expiryDate.toISOString().split('T')[0],
          price: 0,
        }]);

      if (error) throw error;

      toast({
        title: "Item Added!",
        description: `${item.name} has been added to your fridge`,
      });
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpiryQuickSelect = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setFormData({ 
      ...formData, 
      expiryDate: date.toISOString().split('T')[0],
      expiryQuick: days.toString()
    });
  };

  const handleItemNameChange = (name: string) => {
    const suggestion = itemSuggestions.find(
      item => item.name.toLowerCase() === name.toLowerCase()
    );
    
    if (suggestion && !formData.category) {
      setFormData({ ...formData, name, category: suggestion.category });
    } else {
      setFormData({ ...formData, name });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to add items",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('fridge_items')
        .insert([{
          user_id: user.id,
          name: formData.name,
          quantity: Number(formData.quantity) || 1,
          unit: formData.unit,
          category: formData.category,
          expiry_date: formData.expiryDate,
          price: Number(formData.price) || 0,
        }]);

      if (error) throw error;

      toast({
        title: "Item Added!",
        description: `${formData.name} has been added to your fridge`,
      });

      setFormData({
        name: "",
        quantity: "1",
        unit: "pcs",
        category: "",
        expiryDate: "",
        expiryQuick: "",
        price: "",
      });
      setShowPriceInput(false);
      
      navigate('/inventory');
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Add Items</h1>
        <p className="text-muted-foreground">Scan receipt or add items manually</p>
      </div>

      {/* Scan Options */}
      <div className="grid grid-cols-2 gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />
        <Button 
          className="h-24 bg-gradient-to-br from-primary to-success text-white shadow-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
        >
          <div className="flex flex-col items-center gap-2">
            {isScanning ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <Camera className="w-8 h-8" />
            )}
            <span className="text-sm font-medium">
              {isScanning ? "Scanning..." : "Scan Receipt"}
            </span>
          </div>
        </Button>
        <Button 
          variant="outline"
          className="h-24 shadow-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanning}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">Upload Image</span>
          </div>
        </Button>
      </div>

      {/* Scanned Results */}
      {scannedImage && (
        <Card className="p-4 shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-bold text-foreground">Scanned Receipt</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearScan}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={scannedImage} 
              alt="Receipt" 
              className="w-full max-h-48 object-contain bg-muted"
            />
          </div>

          {isScanning ? (
            <div className="flex items-center justify-center py-8 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-muted-foreground">AI is reading your receipt...</p>
            </div>
          ) : scannedItems.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found {scannedItems.length} items
                </p>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {scannedItems.map((item, index) => (
                  <Card key={index} className="p-3 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{item.quantity} {item.unit}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {item.expiryDate} ({item.daysLeft}d)
                        </p>
                        {item.price && item.price > 0 && (
                          <p className="text-xs font-semibold text-primary mt-1">
                            ${item.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Check className="w-5 h-5 text-success" />
                    </div>
                  </Card>
                ))}
              </div>

              <Button 
                onClick={handleAddScannedItems}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-primary to-success text-white shadow-md"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Add All Items to Fridge
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </Card>
      )}

      {/* Quick Add Section */}
      <Card className="p-6 shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Add</h2>
        <div className="grid grid-cols-3 gap-2">
          {commonItems.map((item) => (
            <Button
              key={item.name}
              variant="outline"
              onClick={() => handleQuickAdd(item)}
              disabled={isSaving}
              className="h-auto py-3 px-2 text-sm"
            >
              {item.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Manual Entry Form */}
      <Card className="p-6 shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">Add Manually</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              list="item-suggestions"
              placeholder="e.g., Milk, Eggs, Chicken"
              value={formData.name}
              onChange={(e) => handleItemNameChange(e.target.value)}
              className="mt-1"
            />
            <datalist id="item-suggestions">
              {itemSuggestions.map((item) => (
                <option key={item.name} value={item.name} />
              ))}
            </datalist>
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dairy">Dairy</SelectItem>
                <SelectItem value="Fruits">Fruits</SelectItem>
                <SelectItem value="Vegetables">Vegetables</SelectItem>
                <SelectItem value="Meat">Meat</SelectItem>
                <SelectItem value="Bakery">Bakery</SelectItem>
                <SelectItem value="Beverages">Beverages</SelectItem>
                <SelectItem value="Snacks">Snacks</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Expiration *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                type="button"
                variant={formData.expiryQuick === "3" ? "default" : "outline"}
                onClick={() => handleExpiryQuickSelect(3)}
                className="text-sm"
              >
                3 days
              </Button>
              <Button
                type="button"
                variant={formData.expiryQuick === "7" ? "default" : "outline"}
                onClick={() => handleExpiryQuickSelect(7)}
                className="text-sm"
              >
                1 week
              </Button>
              <Button
                type="button"
                variant={formData.expiryQuick === "14" ? "default" : "outline"}
                onClick={() => handleExpiryQuickSelect(14)}
                className="text-sm"
              >
                2 weeks
              </Button>
              <Button
                type="button"
                variant={formData.expiryQuick === "30" ? "default" : "outline"}
                onClick={() => handleExpiryQuickSelect(30)}
                className="text-sm"
              >
                1 month
              </Button>
            </div>
            <div className="mt-2">
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value, expiryQuick: "" })}
                className="text-sm"
                placeholder="Or pick custom date"
              />
            </div>
          </div>

          {!showPriceInput ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowPriceInput(true)}
              className="w-full text-muted-foreground"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Add price for tracking
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="price">Price (optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPriceInput(false);
                    setFormData({ ...formData, price: "" });
                  }}
                  className="h-6 px-2"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              </div>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-primary to-success text-white shadow-md hover:shadow-lg transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Add to Fridge"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
