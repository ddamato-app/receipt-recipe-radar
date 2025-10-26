import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Package, TrendingDown, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type CategorySpending = {
  category: string;
  total: number;
  itemCount: number;
  percentage: number;
};

type SpendingSection = {
  saved: CategorySpending[];
  wasted: CategorySpending[];
  totalSaved: number;
  totalWasted: number;
};

export default function Spending() {
  const { toast } = useToast();
  const [spendingData, setSpendingData] = useState<SpendingSection>({
    saved: [],
    wasted: [],
    totalSaved: 0,
    totalWasted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpendingData();
  }, []);

  const calculateCategoryBreakdown = (items: any[], total: number): CategorySpending[] => {
    const categoryMap = new Map<string, { total: number; count: number }>();

    items.forEach(item => {
      const price = Number(item.price) || 0;
      const existing = categoryMap.get(item.category) || { total: 0, count: 0 };
      categoryMap.set(item.category, {
        total: existing.total + price,
        count: existing.count + 1,
      });
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        itemCount: data.count,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const fetchSpendingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current month date range
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      const { data, error } = await supabase
        .from('fridge_items')
        .select('category, price, status, completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', startOfMonth.toISOString())
        .in('status', ['used', 'wasted']);

      if (error) throw error;

      // Separate used and wasted items
      const usedItems = data?.filter(item => item.status === 'used') || [];
      const wastedItems = data?.filter(item => item.status === 'wasted') || [];

      // Calculate totals
      const totalSaved = usedItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
      const totalWasted = wastedItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

      setSpendingData({
        saved: calculateCategoryBreakdown(usedItems, totalSaved),
        wasted: calculateCategoryBreakdown(wastedItems, totalWasted),
        totalSaved,
        totalWasted,
      });
    } catch (error: any) {
      console.error('Error fetching spending data:', error);
      toast({
        title: "Error",
        description: "Failed to load spending data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      'bg-primary',
      'bg-secondary',
      'bg-success',
      'bg-warning',
      'bg-destructive',
      'bg-accent',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Spending Tracker</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderCategorySection = (categories: CategorySpending[], total: number, type: 'saved' | 'wasted') => {
    if (categories.length === 0) {
      return (
        <Card className="p-8 text-center shadow-md">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No {type} items yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            {type === 'saved' 
              ? 'Mark items as "used" to track savings'
              : 'Items marked as "thrown out" will appear here'}
          </p>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {categories.map((category, index) => (
          <Card key={category.category} className="p-4 shadow-md hover:shadow-lg transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${getCategoryColor(index)} bg-opacity-20 flex items-center justify-center`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{category.category}</h3>
                    <p className="text-xs text-muted-foreground">
                      {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-foreground">
                    ${category.total.toFixed(2)}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${getCategoryColor(index)} transition-all duration-300`}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Spending Tracker</h1>
        <p className="text-muted-foreground">Track money saved vs wasted this month</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 shadow-lg bg-gradient-to-br from-success/10 to-success/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-foreground">Money Saved</h3>
          </div>
          <div className="flex items-baseline gap-1">
            <DollarSign className="w-6 h-6 text-success" />
            <span className="text-3xl font-bold text-foreground">
              {spendingData.totalSaved.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {spendingData.saved.reduce((acc, cat) => acc + cat.itemCount, 0)} items used
          </p>
        </Card>

        <Card className="p-4 shadow-lg bg-gradient-to-br from-destructive/10 to-destructive/20">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold text-foreground">Money Wasted</h3>
          </div>
          <div className="flex items-baseline gap-1">
            <DollarSign className="w-6 h-6 text-destructive" />
            <span className="text-3xl font-bold text-foreground">
              {spendingData.totalWasted.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {spendingData.wasted.reduce((acc, cat) => acc + cat.itemCount, 0)} items thrown out
          </p>
        </Card>
      </div>

      {/* Money Saved Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-6 h-6 text-success" />
          <h2 className="text-xl font-bold text-foreground">Money Saved by Category</h2>
        </div>
        {renderCategorySection(spendingData.saved, spendingData.totalSaved, 'saved')}
      </div>

      {/* Money Wasted Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-6 h-6 text-destructive" />
          <h2 className="text-xl font-bold text-foreground">Money Wasted by Category</h2>
        </div>
        {renderCategorySection(spendingData.wasted, spendingData.totalWasted, 'wasted')}
      </div>
    </div>
  );
}