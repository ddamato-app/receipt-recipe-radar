import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Receipt, ReceiptItem, updateReceipt } from '@/lib/receiptData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateHealthScore } from '@/lib/healthScore';

interface ReceiptReviewModalProps {
  receipt: Receipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemsAdded: () => void;
}

export function ReceiptReviewModal({ receipt, open, onOpenChange, onItemsAdded }: ReceiptReviewModalProps) {
  const { user, tier } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Update items when receipt changes
  useState(() => {
    if (receipt) {
      setItems(receipt.items);
    }
  });

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const selectedItems = items.filter(i => i.selected);
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price, 0);

  const handleAddItems = async () => {
    if (!receipt) return;

    if (tier === 'anonymous') {
      toast({
        title: 'Account Required',
        description: 'Create a free account to add receipt items',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    try {
      // Calculate health impact
      const currentItems = await supabase
        .from('fridge_items')
        .select('*')
        .eq('user_id', user?.id);
      
      const currentScore = calculateHealthScore(currentItems.data || []);
      
      // Add selected items to fridge
      const itemsToInsert = selectedItems.map(item => {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + item.estimatedExpiration);
        
        return {
          user_id: user?.id,
          name: item.name,
          quantity: item.quantity,
          unit: 'pcs',
          category: item.category,
          expiry_date: expiryDate.toISOString().split('T')[0],
          price: item.price,
          status: 'active',
        };
      });

      const { error } = await supabase
        .from('fridge_items')
        .insert(itemsToInsert);

      if (error) throw error;

      // Calculate new score
      const allItems = [...(currentItems.data || []), ...itemsToInsert];
      const newScore = calculateHealthScore(allItems);
      const scoreDiff = newScore.totalScore - currentScore.totalScore;

      // Update receipt status
      updateReceipt(receipt.id, {
        status: 'added',
        processedAt: new Date(),
      });

      toast({
        title: '✅ Items Added!',
        description: `${selectedItems.length} items added to your fridge. Health score: ${scoreDiff >= 0 ? '+' : ''}${scoreDiff}`,
      });

      onItemsAdded();
      onOpenChange(false);
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

  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Receipt from {receipt.storeName}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {receipt.date.toLocaleDateString()} • Total: ${receipt.totalAmount.toFixed(2)}
          </p>
        </DialogHeader>

        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                checked={item.selected}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Category: {item.category} | Expires in: {item.estimatedExpiration} days
                    </p>
                  </div>
                  <p className="font-semibold">${item.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {items.length} items detected | {selectedItems.length} selected
            </p>
            <p className="font-bold">Total: ${selectedTotal.toFixed(2)}</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItems}
              disabled={selectedItems.length === 0 || isAdding}
            >
              {isAdding ? 'Adding...' : `Add ${selectedItems.length} Items`}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
