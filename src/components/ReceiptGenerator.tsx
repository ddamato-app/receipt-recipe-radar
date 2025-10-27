import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Receipt, RefreshCw } from 'lucide-react';
import { generateReceipt, type StoreType, type ReceiptType, type GeneratedReceipt } from '@/lib/receiptGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

interface ReceiptGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptGenerator({ open, onOpenChange }: ReceiptGeneratorProps) {
  const [store, setStore] = useState<StoreType>('walmart');
  const [itemCount, setItemCount] = useState([15]);
  const [receiptType, setReceiptType] = useState<ReceiptType>('weekly');
  const [generatedReceipt, setGeneratedReceipt] = useState<GeneratedReceipt | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    const receipt = generateReceipt(store, itemCount[0], receiptType);
    setGeneratedReceipt(receipt);
  };

  const handleAddToFridge = async () => {
    if (!generatedReceipt) return;

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to add items to your fridge.',
          variant: 'destructive',
        });
        return;
      }

      const itemsToAdd = generatedReceipt.items.map(item => ({
        user_id: user.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        price: item.price,
        expiry_date: format(addDays(new Date(), item.expiryDays), 'yyyy-MM-dd'),
        status: 'active',
      }));

      const { error } = await supabase
        .from('fridge_items')
        .insert(itemsToAdd);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `${generatedReceipt.items.length} items added to your fridge!`,
      });

      onOpenChange(false);
      setGeneratedReceipt(null);
    } catch (error) {
      console.error('Error adding items:', error);
      toast({
        title: 'Error',
        description: 'Failed to add items to fridge. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setGeneratedReceipt(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Generate Sample Receipt
          </DialogTitle>
          <DialogDescription>
            Create a realistic grocery receipt for testing
          </DialogDescription>
        </DialogHeader>

        {!generatedReceipt ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Store</Label>
              <Select value={store} onValueChange={(value) => setStore(value as StoreType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walmart">Walmart</SelectItem>
                  <SelectItem value="costco">Costco</SelectItem>
                  <SelectItem value="metro">Metro</SelectItem>
                  <SelectItem value="iga">IGA</SelectItem>
                  <SelectItem value="wholeFoods">Whole Foods</SelectItem>
                  <SelectItem value="loblaws">Loblaws</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of items: {itemCount[0]}</Label>
              <Slider
                value={itemCount}
                onValueChange={setItemCount}
                min={5}
                max={30}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">5-30 items</p>
            </div>

            <div className="space-y-3">
              <Label>Receipt Type</Label>
              <RadioGroup value={receiptType} onValueChange={(value) => setReceiptType(value as ReceiptType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly" className="font-normal cursor-pointer">
                    Weekly Shopping (varied items)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quick" id="quick" />
                  <Label htmlFor="quick" className="font-normal cursor-pointer">
                    Quick Run (5-10 common items)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bigHaul" id="bigHaul" />
                  <Label htmlFor="bigHaul" className="font-normal cursor-pointer">
                    Big Haul (20-30 items, bulk buying)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="healthy" id="healthy" />
                  <Label htmlFor="healthy" className="font-normal cursor-pointer">
                    Healthy Focus (produce-heavy)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={handleGenerate} className="w-full">
              Generate Receipt
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Card>
              <CardContent className="pt-6 font-mono text-sm">
                <div className="text-center mb-4">
                  <p className="font-bold text-lg">{generatedReceipt.store}</p>
                  <p>{format(generatedReceipt.date, 'MMM dd, yyyy')}</p>
                  <p>{generatedReceipt.time}</p>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {generatedReceipt.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="flex-1">
                        {item.name} ({item.quantity} {item.unit})
                      </span>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${generatedReceipt.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (13%):</span>
                    <span>${generatedReceipt.tax.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>${generatedReceipt.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={handleGenerate}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
              <Button onClick={handleAddToFridge} disabled={isAdding}>
                {isAdding ? 'Adding...' : 'Add All to Fridge'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
