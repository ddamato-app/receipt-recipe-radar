import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Trash2, Plus, CheckCircle2, XCircle, X, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { CelebrationAnimation } from "@/components/CelebrationAnimation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FridgeItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string | null;
  created_at: string;
  price: number;
  status: string;
};

// Emoji mapping for common items
const getItemEmoji = (name: string, category: string): string => {
  const lowerName = name.toLowerCase();
  
  // Specific items
  if (lowerName.includes('milk')) return '🥛';
  if (lowerName.includes('strawberr')) return '🍓';
  if (lowerName.includes('chicken')) return '🍗';
  if (lowerName.includes('lettuce')) return '🥬';
  if (lowerName.includes('yogurt')) return '🥛';
  if (lowerName.includes('egg')) return '🥚';
  if (lowerName.includes('bread')) return '🍞';
  if (lowerName.includes('cheese')) return '🧀';
  if (lowerName.includes('butter')) return '🧈';
  if (lowerName.includes('apple')) return '🍎';
  if (lowerName.includes('banana')) return '🍌';
  if (lowerName.includes('orange')) return '🍊';
  if (lowerName.includes('tomato')) return '🍅';
  if (lowerName.includes('carrot')) return '🥕';
  if (lowerName.includes('broccoli')) return '🥦';
  if (lowerName.includes('beef') || lowerName.includes('steak')) return '🥩';
  if (lowerName.includes('fish') || lowerName.includes('salmon')) return '🐟';
  if (lowerName.includes('bacon')) return '🥓';
  if (lowerName.includes('rice')) return '🍚';
  if (lowerName.includes('pasta')) return '🍝';
  
  // Category fallbacks
  switch (category.toLowerCase()) {
    case 'dairy': return '🥛';
    case 'fruits': return '🍎';
    case 'vegetables': return '🥬';
    case 'meat': return '🍗';
    case 'bakery': return '🍞';
    case 'beverages': return '🥤';
    case 'snacks': return '🍿';
    default: return '🥫';
  }
};

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<FridgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FridgeItem | null>(null);
  const [selectedAction, setSelectedAction] = useState<'used' | 'wasted' | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [swipingItemId, setSwipingItemId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showActionButtons, setShowActionButtons] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { tier, itemCount, decrementItemCount } = useAuth();

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('fridge-swipe-tutorial');
    if (!hasSeenTutorial && !loading && items.length > 0) {
      setShowTutorial(true);
    }
  }, [loading, items]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('fridge_items')
        .select('*')
        .eq('status', 'active')
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('fridge-swipe-tutorial', 'seen');
  };

  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipingItemId(itemId);
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingItemId) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Only swipe horizontally if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      isSwiping.current = true;
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = (item: FridgeItem) => {
    if (!isSwiping.current || !swipingItemId) {
      setSwipingItemId(null);
      setSwipeOffset(0);
      return;
    }

    const threshold = 100;
    if (swipeOffset > threshold) {
      // Swipe right - mark as used
      handleMarkItem(item, 'used');
    } else if (swipeOffset < -threshold) {
      // Swipe left - mark as wasted
      handleMarkItem(item, 'wasted');
    }
    
    setSwipingItemId(null);
    setSwipeOffset(0);
    isSwiping.current = false;
  };

  const handleCardClick = (item: FridgeItem) => {
    if (!isSwiping.current) {
      setSelectedItem(item);
      setShowDetailDialog(true);
    }
  };

  const handleMarkItem = (item: FridgeItem, action: 'used' | 'wasted') => {
    setSelectedItem(item);
    setSelectedAction(action);
    setShowActionDialog(true);
    setShowDetailDialog(false);
  };

  const confirmMarkItem = async () => {
    if (!selectedItem || !selectedAction) return;

    setActioningId(selectedItem.id);
    try {
      const { error } = await supabase
        .from('fridge_items')
        .update({ 
          status: selectedAction,
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== selectedItem.id));
      
      const emoji = selectedAction === 'used' ? '✅' : '🗑️';
      const price = selectedItem.price || 0;
      const priceText = price > 0 ? ` ($${price.toFixed(2)})` : '';
      
      // Show celebration for used items
      if (selectedAction === 'used') {
        setCelebrationMessage(`You saved ${priceText || 'this item'} from waste!`);
        setShowCelebration(true);
      }
      
      toast({
        title: selectedAction === 'used' 
          ? `${emoji} Item marked as used!` 
          : `${emoji} Item marked as wasted`,
        description: selectedAction === 'used' 
          ? `Great job! ${priceText} added to money saved` 
          : `${priceText} added to money wasted`,
        className: selectedAction === 'used' ? 'border-success' : 'border-destructive',
      });
    } catch (error: any) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    } finally {
      setActioningId(null);
      setShowActionDialog(false);
      setSelectedItem(null);
      setSelectedAction(null);
      setShowActionButtons(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('fridge_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      
      // Decrement item count for anonymous users
      if (tier === 'anonymous') {
        decrementItemCount();
      }
      
      toast({
        title: "Item deleted",
        description: "Item removed from your fridge",
      });
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getDaysLeft = (expiryDate: string | null): number => {
    if (!expiryDate) return 999;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (expiryDate: string | null) => {
    const daysLeft = getDaysLeft(expiryDate);
    if (daysLeft === 999) return <Badge variant="secondary" className="text-xs">No expiry</Badge>;
    if (daysLeft <= 0) return <Badge variant="destructive" className="text-xs font-semibold">Expired</Badge>;
    if (daysLeft <= 2) return <Badge variant="destructive" className="text-xs font-semibold">{daysLeft}d</Badge>;
    if (daysLeft <= 5) return <Badge className="bg-warning text-white text-xs font-semibold">{daysLeft}d</Badge>;
    return <Badge className="bg-success text-white text-xs font-semibold">{daysLeft}d</Badge>;
  };

  const filterByCategory = (category: string) => {
    let filtered = items;
    if (category !== "all") {
      filtered = items.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const itemLimit = 15;
  const isNearLimit = tier === 'anonymous' && itemCount >= 12;
  const isAtLimit = tier === 'anonymous' && itemCount >= itemLimit;

  // Empty state when no items at all
  if (!loading && items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Fridge</h1>
          <p className="text-muted-foreground">Track your groceries and expiration dates</p>
        </div>

        <Card className="p-8 text-center shadow-lg">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-5xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-foreground">Welcome to FreshTrack!</h2>
            <p className="text-foreground leading-relaxed">
              Let's add your first items to get started.
            </p>
            
            <div className="text-left space-y-2 bg-muted/30 p-4 rounded-lg">
              <p className="font-semibold text-foreground mb-2">Tap the + button below to:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>✓ Scan a receipt (coming soon)</p>
                <p>✓ Add items manually</p>
                <p>✓ Quick-add common items</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground italic">
              Start with 5-10 items and we'll help you reduce waste!
            </p>

            <Button 
              onClick={() => navigate('/add')}
              className="w-full bg-gradient-to-r from-primary to-success text-white shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Get Started
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">My Fridge</h1>
        <p className="text-muted-foreground">
          {tier === 'anonymous' ? `${itemCount}/${itemLimit} Items` : `${items.length} Items`}
        </p>
      </div>

      {/* Near Limit Banner */}
      {(isNearLimit || isAtLimit) && (
        <Card className={`p-4 shadow-lg ${isAtLimit ? 'border-destructive bg-destructive/10' : 'border-warning bg-warning/10'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isAtLimit ? 'text-destructive' : 'text-warning'}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {isAtLimit 
                  ? `You're using ${itemCount} of ${itemLimit} free item slots.`
                  : `You're using ${itemCount} of ${itemLimit} free item slots.`
                }
              </p>
              <Button 
                variant="link" 
                className="h-auto p-0 text-primary font-semibold text-sm mt-1"
                onClick={() => navigate('/profile')}
              >
                Upgrade to track unlimited items →
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 shadow-sm"
        />
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Dairy">Dairy</TabsTrigger>
          <TabsTrigger value="Fruits">Fruits</TabsTrigger>
          <TabsTrigger value="Vegetables">Veggies</TabsTrigger>
          <TabsTrigger value="Meat">Meat</TabsTrigger>
        </TabsList>

        {["all", "Dairy", "Fruits", "Vegetables", "Meat"].map((category) => (
          <TabsContent key={category} value={category} className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </Card>
                ))}
              </div>
            ) : filterByCategory(category).length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No items found in this category</p>
              </Card>
            ) : (
              filterByCategory(category).map((item) => {
                const isSwipingThis = swipingItemId === item.id;
                const swipeProgress = Math.min(Math.abs(swipeOffset) / 100, 1);
                const showUsedIndicator = isSwipingThis && swipeOffset > 20;
                const showWastedIndicator = isSwipingThis && swipeOffset < -20;
                
                return (
                  <div 
                    key={item.id} 
                    className="relative overflow-hidden rounded-lg"
                  >
                    {/* Swipe Background Indicators */}
                    {showUsedIndicator && (
                      <div 
                        className="absolute inset-0 bg-success/20 flex items-center justify-start pl-6 rounded-lg"
                        style={{ opacity: swipeProgress }}
                      >
                        <CheckCircle2 className="w-8 h-8 text-success animate-scale-in" />
                      </div>
                    )}
                    {showWastedIndicator && (
                      <div 
                        className="absolute inset-0 bg-destructive/20 flex items-center justify-end pr-6 rounded-lg"
                        style={{ opacity: swipeProgress }}
                      >
                        <XCircle className="w-8 h-8 text-destructive animate-scale-in" />
                      </div>
                    )}

                     {/* Swipeable Card */}
                    <Card 
                      className="p-3 shadow-md hover:shadow-lg transition-all relative border-l-4"
                      style={{
                        transform: isSwipingThis ? `translateX(${swipeOffset}px)` : 'translateX(0)',
                        transition: isSwipingThis ? 'none' : 'transform 0.3s ease-out',
                        borderLeftColor: 
                          getDaysLeft(item.expiry_date) <= 0 ? 'hsl(var(--destructive))' :
                          getDaysLeft(item.expiry_date) <= 2 ? 'hsl(var(--destructive))' :
                          getDaysLeft(item.expiry_date) <= 5 ? 'hsl(var(--warning))' :
                          'hsl(var(--success))'
                      }}
                      onTouchStart={(e) => handleTouchStart(e, item.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() => handleTouchEnd(item)}
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => handleCardClick(item)}
                      >
                        {/* Item Emoji */}
                        <div className="text-4xl flex-shrink-0">
                          {getItemEmoji(item.name, item.category)}
                        </div>
                        
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-foreground text-base leading-tight truncate">
                              {item.name}
                            </h3>
                            {getStatusBadge(item.expiry_date)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="font-medium">
                              {item.quantity} {item.unit}
                            </span>
                            <span>•</span>
                            <span>{item.category}</span>
                            {item.price > 0 && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-foreground">
                                  ${item.price.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons - Always visible on desktop/tablet */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkItem(item, 'used');
                          }}
                          disabled={actioningId === item.id}
                          className="flex-1 bg-success hover:bg-success/90 text-white h-9 animate-fade-in"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Used
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkItem(item, 'wasted');
                          }}
                          disabled={actioningId === item.id}
                          className="flex-1 h-9 animate-fade-in"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Wasted
                        </Button>
                      </div>
                    </Card>
                  </div>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Item Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>
              {selectedItem?.category} • {selectedItem?.quantity} {selectedItem?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium">{selectedItem?.expiry_date || 'N/A'}</span>
            </div>
            {selectedItem && selectedItem.price > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-semibold text-foreground">${selectedItem.price.toFixed(2)}</span>
              </div>
            )}
            {selectedItem && getStatusBadge(selectedItem.expiry_date)}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => selectedItem && handleMarkItem(selectedItem, 'used')}
              disabled={actioningId === selectedItem?.id}
              className="flex-1 bg-success hover:bg-success/90 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Used
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedItem && handleMarkItem(selectedItem, 'wasted')}
              disabled={actioningId === selectedItem?.id}
              className="flex-1"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Mark as Wasted
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedItem && handleDelete(selectedItem.id)}
            disabled={deletingId === selectedItem?.id}
            className="w-full text-muted-foreground"
          >
            {deletingId === selectedItem?.id ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Item
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAction === 'used' ? 'Mark as Used?' : 'Mark as Wasted?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAction === 'used' 
                ? `Great! Marking "${selectedItem?.name}" as used will add ${selectedItem?.price ? `$${selectedItem.price.toFixed(2)}` : 'this item'} to your money saved.`
                : `Marking "${selectedItem?.name}" as wasted will add ${selectedItem?.price ? `$${selectedItem.price.toFixed(2)}` : 'this item'} to your money wasted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmMarkItem}
              className={selectedAction === 'used' ? 'bg-success hover:bg-success/90' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 animate-fade-in">
          <Card className="max-w-sm p-6 shadow-2xl animate-scale-in relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={closeTutorial}
              className="absolute top-2 right-2 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">👉</div>
              <h3 className="text-xl font-bold text-foreground">Swipe to Track Items</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-left">
                    <strong className="text-foreground">Swipe right</strong> when you use items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <p className="text-left">
                    <strong className="text-foreground">Swipe left</strong> if items go bad
                  </p>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs">Or tap any item to see details and options</p>
                </div>
              </div>
              <Button 
                onClick={closeTutorial}
                className="w-full bg-primary"
              >
                Got it!
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      <CelebrationAnimation
        show={showCelebration}
        message={celebrationMessage}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
}
