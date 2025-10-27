import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Camera, Upload, X, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { parseReceiptText, type ParsedReceiptItem, type ParsedReceipt } from '@/lib/receiptParser';
import Tesseract from 'tesseract.js';
import { addDays, format } from 'date-fns';

interface ReceiptScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ScanStep = 'upload' | 'processing' | 'review' | 'error';

export function ReceiptScanner({ open, onOpenChange, onSuccess }: ReceiptScannerProps) {
  const [step, setStep] = useState<ScanStep>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processProgress, setProcessProgress] = useState(0);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(null);
  const [editedItems, setEditedItems] = useState<ParsedReceiptItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 10MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setStep('processing');
      
      try {
        // Process with Tesseract
        const result = await Tesseract.recognize(
          imageUrl,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text') {
                setProcessProgress(Math.round(m.progress * 100));
              }
            },
          }
        );

        const ocrText = result.data.text;
        
        if (!ocrText || ocrText.trim().length < 10) {
          throw new Error('Could not extract text from image');
        }

        // Parse the OCR text
        const parsed = parseReceiptText(ocrText);
        
        if (parsed.items.length === 0) {
          setErrorMessage('No items found in this receipt. Try taking a clearer photo or using a different receipt.');
          setStep('error');
          return;
        }

        setParsedReceipt(parsed);
        setEditedItems(parsed.items);
        setStep('review');
        
      } catch (error) {
        console.error('OCR Error:', error);
        setErrorMessage('We couldn\'t read your receipt clearly. Please try again with better lighting or a clearer image.');
        setStep('error');
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

  const handleReset = () => {
    setStep('upload');
    setSelectedImage(null);
    setProcessProgress(0);
    setParsedReceipt(null);
    setEditedItems([]);
    setErrorMessage('');
  };

  const handleToggleItem = (itemId: string) => {
    setEditedItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleUpdateItem = (itemId: string, field: keyof ParsedReceiptItem, value: any) => {
    setEditedItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setEditedItems(items => items.filter(item => item.id !== itemId));
  };

  const handleAddToFridge = async () => {
    const selectedItems = editedItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to add',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to add items',
          variant: 'destructive',
        });
        return;
      }

      const itemsToInsert = selectedItems.map(item => ({
        user_id: user.id,
        name: item.name,
        quantity: item.quantity,
        unit: 'pcs',
        category: item.category,
        price: item.price,
        expiry_date: format(addDays(new Date(), item.expiryDays), 'yyyy-MM-dd'),
        status: 'active',
      }));

      const { error } = await supabase
        .from('fridge_items')
        .insert(itemsToInsert);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `${selectedItems.length} items added to your fridge`,
      });

      onOpenChange(false);
      handleReset();
      onSuccess?.();
      
    } catch (error) {
      console.error('Error adding items:', error);
      toast({
        title: 'Error',
        description: 'Failed to add items. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const selectedCount = editedItems.filter(item => item.selected).length;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) handleReset();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scan Receipt</DialogTitle>
          <DialogDescription>
            Upload a photo of your grocery receipt to automatically add items
          </DialogDescription>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-4 py-6">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Take a photo or upload an image of your receipt
              </p>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/heic"
                onChange={handleFileInput}
                className="hidden"
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload">
                <Button asChild>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-4">
                Max file size: 10MB • Formats: JPG, PNG, HEIC
              </p>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="space-y-4 py-8">
            {selectedImage && (
              <div className="rounded-lg overflow-hidden mb-4">
                <img 
                  src={selectedImage} 
                  alt="Receipt" 
                  className="w-full max-h-48 object-contain bg-muted"
                />
              </div>
            )}
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="text-lg font-medium">Reading your receipt... 📄</p>
                <p className="text-sm text-muted-foreground">Processing: {processProgress}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && parsedReceipt && (
          <div className="space-y-4">
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{parsedReceipt.store}</p>
                  <p className="text-sm text-muted-foreground">{parsedReceipt.date}</p>
                </div>
                <Badge variant="outline" className="text-lg">
                  {editedItems.length} items
                </Badge>
              </div>
            </Card>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {editedItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={() => handleToggleItem(item.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Input
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Price</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Category</label>
                          <Select
                            value={item.category}
                            onValueChange={(value) => handleUpdateItem(item.id, 'category', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Dairy">Dairy</SelectItem>
                              <SelectItem value="Meat">Meat</SelectItem>
                              <SelectItem value="Fruits">Fruits</SelectItem>
                              <SelectItem value="Vegetables">Vegetables</SelectItem>
                              <SelectItem value="Bakery">Bakery</SelectItem>
                              <SelectItem value="Beverages">Beverages</SelectItem>
                              <SelectItem value="Snacks">Snacks</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Expires</label>
                          <Select
                            value={item.expiryDays.toString()}
                            onValueChange={(value) => handleUpdateItem(item.id, 'expiryDays', parseInt(value))}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 day</SelectItem>
                              <SelectItem value="3">3 days</SelectItem>
                              <SelectItem value="5">5 days</SelectItem>
                              <SelectItem value="7">1 week</SelectItem>
                              <SelectItem value="14">2 weeks</SelectItem>
                              <SelectItem value="30">1 month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Rescan
              </Button>
              <Button 
                onClick={handleAddToFridge} 
                disabled={isAdding || selectedCount === 0}
                className="flex-1"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Add {selectedCount} Items
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <div className="space-y-4 py-6">
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <div>
                <p className="text-lg font-medium mb-2">😕 Couldn't read receipt</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {errorMessage}
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg text-left max-w-md mx-auto">
                <p className="text-sm font-medium mb-2">Try:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Taking a clearer photo</li>
                  <li>Better lighting</li>
                  <li>Flattening the receipt</li>
                  <li>Uploading a different format</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
