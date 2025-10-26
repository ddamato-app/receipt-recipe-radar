import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Apple, Target, Package, ChefHat, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  calculateConsumptionScore, 
  compareBuyingVsEating,
  generateSmartRecommendations,
  getScoreColor,
  getScoreLabel,
  CategoryBreakdown
} from '@/lib/healthScore';

type WeeklyPattern = {
  week: string;
  breakdown: CategoryBreakdown;
  totalItems: number;
};

export default function Health() {
  const { toast } = useToast();
  const { tier } = useAuth();
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(0);
  const [consumptionBreakdown, setConsumptionBreakdown] = useState<CategoryBreakdown>({
    vegetables: 0,
    fruits: 0,
    protein: 0,
    grains: 0,
    dairy: 0,
    processed: 0,
    other: 0,
  });
  const [weeklyPatterns, setWeeklyPatterns] = useState<WeeklyPattern[]>([]);
  const [buyingVsEating, setBuyingVsEating] = useState<any[]>([]);
  const [smartRecommendations, setSmartRecommendations] = useState<string[]>([]);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get current month data
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      // Fetch consumed items (marked as "used")
      const { data: consumedItems, error: consumedError } = await supabase
        .from('fridge_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'used')
        .gte('completed_at', startOfMonth.toISOString())
        .order('completed_at', { ascending: false });

      if (consumedError) throw consumedError;

      // Fetch current fridge items
      const { data: fridgeItems, error: fridgeError } = await supabase
        .from('fridge_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (fridgeError) throw fridgeError;

      // Calculate consumption-based health score
      const score = calculateConsumptionScore(consumedItems || []);
      setHealthScore(score.totalScore);
      setConsumptionBreakdown(score.breakdown);

      // Calculate weekly patterns (last 4 weeks)
      const patterns = calculateWeeklyPatterns(consumedItems || []);
      setWeeklyPatterns(patterns);

      // Compare buying vs eating
      const comparison = compareBuyingVsEating(fridgeItems || [], consumedItems || []);
      setBuyingVsEating(comparison);

      // Generate smart recommendations
      const recs = generateSmartRecommendations(fridgeItems || [], consumedItems || []);
      setSmartRecommendations(recs);

    } catch (error: any) {
      console.error('Error fetching health data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load health data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyPatterns = (items: any[]): WeeklyPattern[] => {
    const weeks: WeeklyPattern[] = [];
    const now = new Date();

    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const weekItems = items.filter(item => {
        const completedAt = new Date(item.completed_at);
        return completedAt >= weekStart && completedAt < weekEnd;
      });

      if (weekItems.length > 0) {
        const score = calculateConsumptionScore(weekItems);
        weeks.push({
          week: i === 0 ? 'This Week' : `${i} Week${i > 1 ? 's' : ''} Ago`,
          breakdown: score.breakdown,
          totalItems: weekItems.length,
        });
      }
    }

    return weeks;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vegetables: 'bg-green-500',
      fruits: 'bg-red-400',
      protein: 'bg-orange-500',
      grains: 'bg-yellow-500',
      dairy: 'bg-blue-400',
      processed: 'bg-gray-500',
      other: 'bg-gray-400',
    };
    return colors[category.toLowerCase()] || 'bg-gray-400';
  };

  if (tier === 'anonymous') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Health Score</h1>
          <p className="text-muted-foreground">Track your nutrition and eating patterns</p>
        </div>

        <Card className="p-12 text-center shadow-lg">
          <Apple className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Create an Account</h2>
          <p className="text-muted-foreground">
            Sign up to track your eating patterns and see your personalized health score
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Health Score</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Health Score</h1>
        <p className="text-muted-foreground">Based on what you're actually eating</p>
      </div>

      {/* Health Score Card */}
      <Card className="p-6 shadow-lg bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Overall Score</h2>
          <Badge className={getScoreColor(healthScore)}>
            {getScoreLabel(healthScore)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - healthScore / 100)}`}
                className={healthScore >= 75 ? 'text-success' : healthScore >= 50 ? 'text-warning' : 'text-destructive'}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-foreground">{healthScore}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Based on {weeklyPatterns[0]?.totalItems || 0} items consumed this week
        </p>
      </Card>

      {/* This Week's Consumption */}
      {weeklyPatterns.length > 0 && (
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <ChefHat className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">This Week You Ate</h2>
          </div>
          
          <div className="space-y-3">
            {Object.entries(weeklyPatterns[0].breakdown)
              .filter(([_, value]) => value > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([category, percentage]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{category}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Buying vs Eating Comparison */}
      {buyingVsEating.length > 0 && (
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Buying vs Eating</h2>
          </div>
          
          <div className="space-y-4">
            {buyingVsEating.map(({ category, bought, consumed, gap }) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category}</span>
                  {Math.abs(gap) > 10 && (
                    <Badge variant={gap > 0 ? 'destructive' : 'secondary'} className="text-xs">
                      {gap > 0 ? `${gap}% unused` : `${Math.abs(gap)}% more eaten`}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-muted-foreground">Bought</span>
                    <span className="font-semibold">{bought}%</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-success/10">
                    <span className="text-muted-foreground">Consumed</span>
                    <span className="font-semibold text-success">{consumed}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Smart Recommendations */}
      <Card className="p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Personalized Recommendations</h2>
        </div>
        
        <div className="space-y-3">
          {smartRecommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{rec}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Trend */}
      {weeklyPatterns.length > 1 && (
        <Card className="p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Weekly Consumption Trend</h2>
          </div>
          
          <div className="space-y-4">
            {weeklyPatterns.map((week, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{week.week}</span>
                  <span className="text-xs text-muted-foreground">{week.totalItems} items</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                  {Object.entries(week.breakdown)
                    .filter(([_, value]) => value > 0)
                    .map(([category, percentage]) => (
                      <div
                        key={category}
                        className={getCategoryColor(category)}
                        style={{ width: `${percentage}%` }}
                        title={`${category}: ${percentage}%`}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
