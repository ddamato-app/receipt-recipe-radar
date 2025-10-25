import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, X, Check, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type ScannedItem = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: string;
  daysLeft: number;
};

export default function AddItem() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    unit: "pcs",
    category: "",
    expiryDate: "",
  });

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

  const handleAddScannedItems = () => {
    toast({
      title: "Items Added!",
      description: `${scannedItems.length} items added to your fridge`,
    });
    handleClearScan();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
                      </div>
                      <Check className="w-5 h-5 text-success" />
                    </div>
                  </Card>
                ))}
              </div>

              <Button 
                onClick={handleAddScannedItems}
                className="w-full bg-gradient-to-r from-primary to-success text-white shadow-md"
              >
                Add All Items to Fridge
              </Button>
            </div>
          ) : null}
        </Card>
      )}

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
