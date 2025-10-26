import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Trash2, Plus, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
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

type FridgeItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string | null;
  created_at: string;
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
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleMarkItem = (item: FridgeItem, action: 'used' | 'wasted') => {
    setSelectedItem(item);
    setSelectedAction(action);
    setShowActionDialog(true);
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
      toast({
        title: selectedAction === 'used' ? "Item marked as used!" : "Item marked as wasted",
        description: selectedAction === 'used' 
          ? "Great job reducing waste!" 
          : "Item removed from inventory",
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
    if (daysLeft === 999) return <Badge variant="secondary">No expiry</Badge>;
    if (daysLeft <= 0) return <Badge variant="destructive">Expired</Badge>;
    if (daysLeft <= 2) return <Badge variant="destructive">{daysLeft}d left</Badge>;
    if (daysLeft <= 5) return <Badge className="bg-warning text-white">{daysLeft}d left</Badge>;
    return <Badge className="bg-success text-white">{daysLeft}d left</Badge>;
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
        <p className="text-muted-foreground">Track your groceries and expiration dates</p>
      </div>

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
              filterByCategory(category).map((item) => (
                <Card key={item.id} className="p-4 shadow-md hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.expiry_date)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">
                      Quantity: <span className="font-medium text-foreground">{item.quantity} {item.unit}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Expires: <span className="font-medium text-foreground">{item.expiry_date || 'N/A'}</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkItem(item, 'used')}
                      disabled={actioningId === item.id}
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Used
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleMarkItem(item, 'wasted')}
                      disabled={actioningId === item.id}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Wasted
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="px-2 text-muted-foreground hover:text-destructive"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Action Confirmation Dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAction === 'used' ? 'Mark as Used?' : 'Mark as Wasted?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAction === 'used' 
                ? `Great! Marking "${selectedItem?.name}" as used will count towards your money saved.`
                : `Marking "${selectedItem?.name}" as wasted will count towards your money wasted.`}
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
    </div>
  );
}
