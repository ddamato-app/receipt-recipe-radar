import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Package, Calendar, TrendingUp, Camera, DollarSign, Info, X, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import heroImage from "@/assets/hero-groceries.jpg";

export default function Home() {
  const [stats, setStats] = useState({
    totalItems: 0,
    expiringSoon: 0,
    expired: 0,
  });
  const [expiringItems, setExpiringItems] = useState<Array<{ name: string; daysLeft: number; category: string }>>([]);
  const [moneySaved, setMoneySaved] = useState(0);
  const [moneyWasted, setMoneyWasted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasSampleData, setHasSampleData] = useState(false);
  const [clearingSampleData, setClearingSampleData] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const getDaysLeft = (expiryDate: string | null): number => {
    if (!expiryDate) return 999;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Fetch all items
      const { data: items, error } = await supabase
        .from('fridge_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Check if user has any items
      if (!items || items.length === 0) {
        // Insert sample data
        await insertSampleData(user.id);
        // Refetch after inserting sample data
        const { data: newItems } = await supabase
          .from('fridge_items')
          .select('*')
          .eq('user_id', user.id);
        
        if (newItems) {
          setHasSampleData(true);
          processItems(newItems, startOfMonth);
        }
      } else {
        const hasSamples = items.some(item => item.is_sample);
        setHasSampleData(hasSamples);
        processItems(items, startOfMonth);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const insertSampleData = async (userId: string) => {
    const today = new Date();
    const sampleItems = [
      {
        user_id: userId,
        name: 'Milk',
        quantity: 1,
        unit: 'liter',
        category: 'Dairy',
        expiry_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: 3.99,
        is_sample: true,
        status: 'active'
      },
      {
        user_id: userId,
        name: 'Strawberries',
        quantity: 1,
        unit: 'pcs',
        category: 'Fruits',
        expiry_date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: 5.49,
        is_sample: true,
        status: 'active'
      },
      {
        user_id: userId,
        name: 'Chicken Breast',
        quantity: 500,
        unit: 'g',
        category: 'Meat',
        expiry_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: 8.99,
        is_sample: true,
        status: 'active'
      },
      {
        user_id: userId,
        name: 'Lettuce',
        quantity: 1,
        unit: 'pcs',
        category: 'Vegetables',
        expiry_date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: 2.49,
        is_sample: true,
        status: 'active'
      },
      {
        user_id: userId,
        name: 'Yogurt',
        quantity: 4,
        unit: 'pcs',
        category: 'Dairy',
        expiry_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: 4.99,
        is_sample: true,
        status: 'active'
      },
    ];

    await supabase.from('fridge_items').insert(sampleItems);
  };

  const processItems = (items: any[], startOfMonth: Date) => {
    // Calculate stats
    const activeItems = items.filter(item => item.status === 'active');
    const expiringSoonItems = activeItems.filter(item => {
      const days = getDaysLeft(item.expiry_date);
      return days > 0 && days <= 5;
    });
    const expiredItems = activeItems.filter(item => getDaysLeft(item.expiry_date) <= 0);

    setStats({
      totalItems: activeItems.length,
      expiringSoon: expiringSoonItems.length,
      expired: expiredItems.length,
    });

    // Set expiring items for display
    setExpiringItems(
      expiringSoonItems
        .slice(0, 3)
        .map(item => ({
          name: item.name,
          daysLeft: getDaysLeft(item.expiry_date),
          category: item.category,
        }))
    );

    // Calculate money saved and wasted for current month
    const usedItems = items.filter(
      item => item.status === 'used' && 
      item.completed_at && 
      new Date(item.completed_at) >= startOfMonth
    );
    
    const wastedItems = items.filter(
      item => item.status === 'wasted' && 
      item.completed_at && 
      new Date(item.completed_at) >= startOfMonth
    );

    const saved = usedItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    const wasted = wastedItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

    setMoneySaved(saved);
    setMoneyWasted(wasted);
  };

  const clearSampleData = async () => {
    setClearingSampleData(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('fridge_items')
        .delete()
        .eq('user_id', user.id)
        .eq('is_sample', true);

      if (error) throw error;

      setHasSampleData(false);
      toast({
        title: "Sample data cleared",
        description: "Ready to add your own items!",
      });
      
      // Refresh the page data
      fetchData();
    } catch (error: any) {
      console.error('Error clearing sample data:', error);
      toast({
        title: "Error",
        description: "Failed to clear sample data",
        variant: "destructive",
      });
    } finally {
      setClearingSampleData(false);
    }
  };

  const efficiency = moneySaved + moneyWasted > 0 
    ? Math.round((moneySaved / (moneySaved + moneyWasted)) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Sample Data Banner */}
      {hasSampleData && (
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 shadow-lg border-primary/20 animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold text-foreground mb-1">
                🎉 Sample data loaded - try the app!
              </p>
              <p className="text-sm text-muted-foreground">
                Clear it when you're ready to add your own items
              </p>
            </div>
            <Button
              onClick={clearSampleData}
              disabled={clearingSampleData}
              size="sm"
              variant="outline"
              className="flex-shrink-0"
            >
              {clearingSampleData ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Clear Sample Data
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={heroImage} 
          alt="Fresh groceries" 
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
          <h1 className="text-3xl font-bold text-white mb-2">FreshTrack</h1>
          <p className="text-white/90 text-sm">Your smart fridge companion</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center shadow-md">
          <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold text-foreground">{loading ? "-" : stats.totalItems}</div>
          <div className="text-xs text-muted-foreground">Items</div>
        </Card>
        <Card className="p-4 text-center shadow-md">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-warning" />
          <div className="text-2xl font-bold text-foreground">{loading ? "-" : stats.expiringSoon}</div>
          <div className="text-xs text-muted-foreground">Expiring Soon</div>
        </Card>
        <Card className="p-4 text-center shadow-md">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-success" />
          <div className="text-2xl font-bold text-foreground">{loading ? "-" : stats.totalItems - stats.expired}</div>
          <div className="text-xs text-muted-foreground">Fresh</div>
        </Card>
      </div>

      {/* Money Saved Card */}
      <Card className="p-5 shadow-lg bg-gradient-to-br from-success/10 to-primary/10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-2xl">💰</div>
            <h2 className="text-lg font-bold text-foreground">This Month</h2>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  <strong>Saved:</strong> Items marked as "used" before expiration<br/>
                  <strong>Wasted:</strong> Items marked as "thrown out"<br/>
                  <strong>Efficiency:</strong> Saved ÷ (Saved + Wasted) × 100%
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Saved</p>
            <div className="flex items-baseline gap-1">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-xl font-bold text-foreground">
                {loading ? "-" : moneySaved.toFixed(2)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Wasted</p>
            <div className="flex items-baseline gap-1">
              <DollarSign className="w-4 h-4 text-destructive" />
              <span className="text-xl font-bold text-foreground">
                {loading ? "-" : moneyWasted.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground">Efficiency</p>
            <span className="text-sm font-bold text-foreground">
              {loading ? "-" : efficiency}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-success to-primary transition-all duration-300"
              style={{ width: `${efficiency}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/add">
          <Button className="w-full h-20 bg-gradient-to-br from-primary to-success text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">📸</span>
              <span className="text-sm font-medium">Scan Receipt</span>
            </div>
          </Button>
        </Link>
        <Link to="/recipes">
          <Button className="w-full h-20 bg-gradient-to-br from-secondary to-warning text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">🍳</span>
              <span className="text-sm font-medium text-center leading-tight">Find Recipes Using These Items</span>
            </div>
          </Button>
        </Link>
        <Link to="/spending" className="col-span-2">
          <Button className="w-full h-20 bg-gradient-to-br from-accent to-primary text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex flex-col items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="text-sm font-medium">View My Stats</span>
            </div>
          </Button>
        </Link>
      </div>

      {/* Expiring Soon Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Expiring Soon</h2>
          <Link to="/inventory">
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <Card className="p-4 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </Card>
        ) : expiringItems.length === 0 ? (
          <Card className="p-8 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-success opacity-50" />
            <p className="text-muted-foreground">All items are fresh!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No items expiring in the next 5 days
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {expiringItems.map((item, index) => (
              <Card key={index} className="p-4 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  <Badge 
                    variant={item.daysLeft <= 1 ? "destructive" : "secondary"}
                    className="font-semibold"
                  >
                    {item.daysLeft}d left
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
