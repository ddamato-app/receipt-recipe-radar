import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AddItem() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "pcs",
    category: "",
    expiryDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.quantity || !formData.category || !formData.expiryDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Item Added!",
      description: `${formData.name} has been added to your fridge`,
    });

    // Reset form
    setFormData({
      name: "",
      quantity: "",
      unit: "pcs",
      category: "",
      expiryDate: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Add Items</h1>
        <p className="text-muted-foreground">Scan receipt or add items manually</p>
      </div>

      {/* Scan Options */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="h-24 bg-gradient-to-br from-primary to-success text-white shadow-md"
          onClick={() => toast({ title: "Camera feature coming soon!" })}
        >
          <div className="flex flex-col items-center gap-2">
            <Camera className="w-8 h-8" />
            <span className="text-sm font-medium">Scan Receipt</span>
          </div>
        </Button>
        <Button 
          variant="outline"
          className="h-24 shadow-md"
          onClick={() => toast({ title: "Upload feature coming soon!" })}
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8" />
            <span className="text-sm font-medium">Upload Image</span>
          </div>
        </Button>
      </div>

      {/* Manual Entry Form */}
      <Card className="p-6 shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">Add Manually</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Milk, Eggs, Chicken"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">pieces</SelectItem>
                  <SelectItem value="g">grams</SelectItem>
                  <SelectItem value="kg">kilograms</SelectItem>
                  <SelectItem value="ml">milliliters</SelectItem>
                  <SelectItem value="liter">liters</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <Label htmlFor="expiryDate">Expiration Date *</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="mt-1"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-success text-white shadow-md hover:shadow-lg transition-all"
          >
            Add to Fridge
          </Button>
        </form>
      </Card>
    </div>
  );
}
