import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type CategorySpending = {
  category: string;
  total: number;
  itemCount: number;
  percentage: number;
};

export default function Spending() {
  const { toast } = useToast();
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [totalSpending, setTotalSpending] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpendingData();
  }, []);

  const fetchSpendingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('fridge_items')
        .select('category, price')
        .eq('user_id', user.id);

      if (error) throw error;

      // Calculate spending by category
      const categoryMap = new Map<string, { total: number; count: number }>();
      let total = 0;

      data?.forEach(item => {
        const price = Number(item.price) || 0;
        total += price;
        
        const existing = categoryMap.get(item.category) || { total: 0, count: 0 };
        categoryMap.set(item.category, {
          total: existing.total + price,
          count: existing.count + 1,
        });
      });

      setTotalSpending(total);

      const categories: CategorySpending[] = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          total: data.total,
          itemCount: data.count,
          percentage: total > 0 ? (data.total / total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      setCategoryData(categories);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Spending Tracker</h1>
        <p className="text-muted-foreground">Track your grocery expenses by category</p>
      </div>

      {/* Total Spending Card */}
      <Card className="p-6 shadow-lg bg-gradient-to-br from-primary/10 to-success/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Spending</p>
            <div className="flex items-baseline gap-2">
              <DollarSign className="w-8 h-8 text-primary" />
              <span className="text-4xl font-bold text-foreground">
                {totalSpending.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {categoryData.reduce((acc, cat) => acc + cat.itemCount, 0)} items
            </p>
          </div>
          <TrendingUp className="w-12 h-12 text-success opacity-50" />
        </div>
      </Card>

      {/* Category Breakdown */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Spending by Category</h2>
        
        {categoryData.length === 0 ? (
          <Card className="p-8 text-center shadow-md">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No spending data yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add items with prices to see your spending breakdown
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {categoryData.map((category, index) => (
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
        )}
      </div>
    </div>
  );
}