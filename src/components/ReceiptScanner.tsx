import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, Upload, X, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReceiptScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ScannedItem {
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: string;
  daysLeft: number;
  price: number;
  selected: boolean;
}

type ScanStep = 'upload' | 'processing' | 'review' | 'error';

export function ReceiptScanner({ open, onOpenChange, onSuccess }: ReceiptScannerProps) {
  const [step, setStep] = useState<ScanStep>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const handleImageSelect = async (file: File) => {
    try {
      setStep('processing');
      setErrorMessage('');
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageBase64 = reader.result as string;
        setSelectedImage(imageBase64);
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) {
            throw new Error("Authentication required. Please sign in again.");
          }

          const { data, error } = await supabase.functions.invoke('scan-receipt', {
            body: { imageBase64 },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });

          if (error) throw error;
          
          if (data.error) {
            throw new Error(data.error);
          }

          if (!data.items || data.items.length === 0) {
            throw new Error('No items found on receipt');
          }

          const items: ScannedItem[] = data.items.map((item: any) => ({
            ...item,
            brand: item.brand || '',
            selected: true
          }));

          setScannedItems(items);
          setStep('review');
          
          toast({
            title: "Receipt scanned successfully",
            description: `Found ${items.length} items`
          });
          
        } catch (err) {
          console.error('Scan error:', err);
          setErrorMessage(err instanceof Error ? err.message : 'Failed to scan receipt');
          setStep('error');
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image read error:', err);
      setErrorMessage('Failed to read image file');
      setStep('error');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      handleImageSelect(file);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedImage(null);
    setScannedItems([]);
    setErrorMessage('');
  };

  const handleToggleItem = (index: number) => {
    setScannedItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleUpdateItem = (index: number, field: keyof ScannedItem, value: any) => {
    setScannedItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddToFridge = async () => {
    const selectedItems = scannedItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to add",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to add items');
      }

      const itemsToInsert = selectedItems.map(item => ({
        user_id: user.id,
        name: item.name,
        brand: item.brand || null,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        expiry_date: item.expiryDate,
        price: item.price,
        status: 'active'
      }));

      const { error } = await supabase
        .from('fridge_items')
        .insert(itemsToInsert);

      if (error) throw error;

      // Update the shared product catalog with confirmed items
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          await supabase.functions.invoke('update-catalog', {
            body: { 
              items: selectedItems.map(item => ({
                name: item.name,
                brand: item.brand || null,
                category: item.category
              }))
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });
          console.log('Product catalog updated successfully');
        } catch (catalogError) {
          console.error('Failed to update catalog:', catalogError);
          // Don't fail the whole operation if catalog update fails
        }
      }

      toast({
        title: "Success!",
        description: `Added ${selectedItems.length} items to your fridge`
      });

      onOpenChange(false);
      onSuccess?.();
      handleReset();
      
    } catch (error) {
      console.error('Error adding items:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add items",
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Receipt
          </DialogTitle>
          <DialogDescription>
            Upload a photo of your receipt and AI will extract the items
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === 'upload' && (
            <div className="space-y-6 py-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 hover:border-primary/50 transition-colors">
                <Upload className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload Receipt Photo</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                  Take a clear photo of your receipt or upload an existing image
                </p>
                <div className="flex gap-4">
                  <label>
                    <Button variant="default" asChild>
                      <span>
                        <Camera className="mr-2 h-4 w-4" />
                        Take Photo
                      </span>
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </label>
                  <label>
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </span>
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Reading your receipt...</h3>
                <p className="text-sm text-muted-foreground">
                  AI is analyzing the image and extracting items
                </p>
              </div>
              {selectedImage && (
                <img 
                  src={selectedImage} 
                  alt="Receipt preview" 
                  className="max-w-sm max-h-64 object-contain rounded-lg border"
                />
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6 py-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Found {scannedItems.length} items. Review and edit before adding to your fridge.
                </AlertDescription>
              </Alert>

              {selectedImage && (
                <div className="flex justify-center">
                  <img 
                    src={selectedImage} 
                    alt="Receipt" 
                    className="max-w-xs max-h-48 object-contain rounded-lg border"
                  />
                </div>
              )}

              <div className="space-y-3">
                {scannedItems.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => handleToggleItem(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Item Name</label>
                              <Input
                                value={item.name}
                                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                                className="font-medium"
                                placeholder="Item name"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Brand (optional)</label>
                              <Input
                                value={item.brand || ''}
                                onChange={(e) => handleUpdateItem(index, 'brand', e.target.value)}
                                placeholder="Brand name"
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Quantity</label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                              min="0.1"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Unit</label>
                            <Input
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(index, 'unit', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Category</label>
                            <Select
                              value={item.category}
                              onValueChange={(value) => handleUpdateItem(index, 'category', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Dairy">Dairy</SelectItem>
                                <SelectItem value="Fruits">Fruits</SelectItem>
                                <SelectItem value="Vegetables">Vegetables</SelectItem>
                                <SelectItem value="Meat">Meat</SelectItem>
                                <SelectItem value="Beverages">Beverages</SelectItem>
                                <SelectItem value="Snacks">Snacks</SelectItem>
                                <SelectItem value="Bakery">Bakery</SelectItem>
                                <SelectItem value="Frozen">Frozen</SelectItem>
                                <SelectItem value="Pantry">Pantry</SelectItem>
                                <SelectItem value="Household">Household</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Price</label>
                            <Input
                              type="number"
                              value={item.price}
                              onChange={(e) => handleUpdateItem(index, 'price', Number(e.target.value))}
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant={item.daysLeft < 3 ? "destructive" : item.daysLeft < 7 ? "secondary" : "default"}>
                            Expires in {item.daysLeft} days
                          </Badge>
                          <span className="text-muted-foreground">({item.expiryDate})</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <AlertCircle className="h-16 w-16 text-destructive" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Scan Failed</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {errorMessage}
                </p>
              </div>
              {selectedImage && (
                <img 
                  src={selectedImage} 
                  alt="Failed receipt" 
                  className="max-w-sm max-h-64 object-contain rounded-lg border"
                />
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 pt-4 border-t">
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={handleReset}>
                <X className="mr-2 h-4 w-4" />
                Rescan
              </Button>
              <Button onClick={handleAddToFridge} disabled={isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Add {scannedItems.filter(i => i.selected).length} Items
                  </>
                )}
              </Button>
            </>
          )}
          {step === 'error' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleReset}>
                Try Again
              </Button>
            </>
          )}
          {(step === 'upload' || step === 'processing') && (
            <Button variant="outline" onClick={() => onOpenChange(false)} className="ml-auto">
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
