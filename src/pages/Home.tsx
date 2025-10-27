import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ShoppingCart, ChefHat, TrendingUp, X, Loader2, Crown, Sparkles, Heart, Target, Camera, Package, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { initializeAnonymousSampleData, clearAnonymousSampleData, getAnonymousItems } from "@/lib/sampleData";
import { calculateConsumptionScore } from "@/lib/healthScore";
import { InstallPrompt } from "@/components/InstallPrompt";
import { StoreDetectionBanner } from "@/components/StoreDetectionBanner";
import { checkNearbyStores, shouldCheckLocation, setLastLocationCheck } from "@/lib/locationService";
import { showShoppingReminderNotification, shouldShowShoppingReminder, isNotificationEnabled } from "@/lib/notificationService";
import { getGreeting, getTimeBasedEmoji, getContextualMessage, getStatusMessage, getMotivationalMessage, getHealthScoreMessage } from "@/lib/greetingHelper";
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
  const [healthScore, setHealthScore] = useState(0);
  const [consumedThisWeek, setConsumedThisWeek] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasSampleData, setHasSampleData] = useState(false);
  const [showSampleBanner, setShowSampleBanner] = useState(false);
  const [clearingSampleData, setClearingSampleData] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [detectedStore, setDetectedStore] = useState<string | null>(null);
  const [showStoreBanner, setShowStoreBanner] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tier, user } = useAuth();

  const handleProFeatureClick = () => {
    if (tier !== 'pro') {
      setShowUpgradePrompt(true);
    } else {
      navigate('/add');
    }
  };

  useEffect(() => {
    if (tier === 'anonymous') {
      initializeAnonymousSampleData();
      const dismissed = localStorage.getItem('sampleDataDismissed');
      setShowSampleBanner(!dismissed);
    }
    fetchData();
    checkLocationAndNotify();
  }, [tier]);

  const checkLocationAndNotify = async () => {
    const isEnabled = localStorage.getItem('shoppingAssistantEnabled') === 'true';
    if (!isEnabled) return;

    if (!shouldCheckLocation()) return;

    try {
      const result = await checkNearbyStores();
      setLastLocationCheck();

      if (result.isNearStore && result.storeName) {
        const dismissedKey = `storeBanner_${result.storeName}_dismissed`;
        const lastDismissed = localStorage.getItem(dismissedKey);
        
        if (lastDismissed) {
          const fourHours = 4 * 60 * 60 * 1000;
          if (Date.now() - parseInt(lastDismissed, 10) < fourHours) {
            return;
          }
        }

        setDetectedStore(result.storeName);
        setShowStoreBanner(true);
      }

      if (shouldShowShoppingReminder() && isNotificationEnabled()) {
        const savedList = localStorage.getItem('savedShoppingList');
        if (savedList) {
          const items = JSON.parse(savedList);
          if (items.length > 0) {
            await showShoppingReminderNotification(items.length);
          }
        }
      }
    } catch (error) {
      console.error('Location check failed:', error);
    }
  };

  const handleDismissStoreBanner = () => {
    if (detectedStore) {
      const dismissedKey = `storeBanner_${detectedStore}_dismissed`;
      localStorage.setItem(dismissedKey, Date.now().toString());
    }
    setShowStoreBanner(false);
  };

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
      
      if (!user || tier === 'anonymous') {
        const anonymousItems = getAnonymousItems();
        processAnonymousItems(anonymousItems);
        setLoading(false);
        return;
      }

      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: items, error } = await supabase
        .from('fridge_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const { data: consumedItems, error: consumedError } = await supabase
        .from('fridge_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'used')
        .gte('completed_at', startOfWeek.toISOString());

      if (consumedError) throw consumedError;

      const score = calculateConsumptionScore(consumedItems || []);
      setHealthScore(score.totalScore);
      setConsumedThisWeek(consumedItems?.length || 0);

      if (!items || items.length === 0) {
        // Start with empty fridge for new users
        setStats({
          totalItems: 0,
          expiringSoon: 0,
          expired: 0,
        });
        setExpiringItems([]);
        setMoneySaved(0);
        setMoneyWasted(0);
        setHasSampleData(false);
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

    setExpiringItems(
      expiringSoonItems
        .slice(0, 3)
        .map(item => ({
          name: item.name,
          daysLeft: getDaysLeft(item.expiry_date),
          category: item.category,
        }))
    );

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

  const processAnonymousItems = (items: any[]) => {
    const today = new Date();
    
    const activeItems = items.filter((item: any) => !item.status || item.status === 'active');
    const expiringSoonItems = activeItems.filter((item: any) => {
      if (!item.expiry_date) return false;
      const expiry = new Date(item.expiry_date);
      const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft <= 5;
    });
    
    const expiredItems = activeItems.filter((item: any) => {
      if (!item.expiry_date) return false;
      const expiry = new Date(item.expiry_date);
      return expiry < today;
    });

    setStats({
      totalItems: activeItems.length,
      expiringSoon: expiringSoonItems.length,
      expired: expiredItems.length,
    });

    setExpiringItems(
      expiringSoonItems.slice(0, 3).map((item: any) => {
        const expiry = new Date(item.expiry_date);
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          name: item.name,
          daysLeft,
          category: item.category,
        };
      })
    );

    setMoneySaved(0);
    setMoneyWasted(0);

    const hasSamples = items.some((item: any) => item.isSample);
    setHasSampleData(hasSamples);
  };

  const handleClearSampleData = () => {
    clearAnonymousSampleData();
    setShowSampleBanner(false);
    toast({
      title: "Sample data cleared",
      description: "Ready to add your own items!",
    });
    fetchData();
  };

  const handleKeepSampleData = () => {
    setShowSampleBanner(false);
    localStorage.setItem('sampleDataDismissed', 'true');
    toast({
      title: "Great!",
      description: "Sample data kept. Add more items to get started.",
    });
  };

  const clearSampleData = async () => {
    setClearingSampleData(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all sample items
      const { error } = await supabase
        .from('fridge_items')
        .delete()
        .eq('user_id', user.id)
        .eq('is_sample', true);

      if (error) throw error;

      // Immediately update UI state
      setHasSampleData(false);
      setStats({
        totalItems: 0,
        expiringSoon: 0,
        expired: 0,
      });
      setExpiringItems([]);
      setMoneySaved(0);
      setMoneyWasted(0);
      
      toast({
        title: "Sample data cleared",
        description: "Ready to add your own items!",
      });
      
      // Refresh from database
      await fetchData();
    } catch (error: any) {
      console.error('Error clearing sample data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear sample data",
        variant: "destructive",
      });
    } finally {
      setClearingSampleData(false);
    }
  };

  const clearAllItems = async () => {
    setClearingSampleData(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete ALL items for this user
      const { error } = await supabase
        .from('fridge_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Immediately update UI state
      setHasSampleData(false);
      setStats({
        totalItems: 0,
        expiringSoon: 0,
        expired: 0,
      });
      setExpiringItems([]);
      setMoneySaved(0);
      setMoneyWasted(0);
      
      toast({
        title: "All items cleared",
        description: "Your fridge is now empty",
      });
      
      // Refresh from database
      await fetchData();
    } catch (error: any) {
      console.error('Error clearing all items:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear items",
        variant: "destructive",
      });
    } finally {
      setClearingSampleData(false);
    }
  };

  const efficiency = moneySaved + moneyWasted > 0 
    ? Math.round((moneySaved / (moneySaved + moneyWasted)) * 100) 
    : 0;

  const healthInfo = getHealthScoreMessage(healthScore, consumedThisWeek);
  const statusMessage = getStatusMessage(stats.totalItems, stats.expiringSoon, stats.expired);
  const motivationalMsg = getMotivationalMessage(efficiency, moneySaved, moneyWasted);
  const usedItemsCount = 0; // Will be calculated from actual data
  const wastedItemsCount = 2; // Will be calculated from actual data

  const getCategoryEmoji = (category: string): string => {
    const emojis: Record<string, string> = {
      'Dairy': '🥛',
      'Meat': '🍗',
      'Vegetables': '🥬',
      'Fruits': '🍎',
      'Grains': '🌾',
      'Beverages': '🥤',
    };
    return emojis[category] || '📦';
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-4">
      {/* Store Detection Banner */}
      {showStoreBanner && detectedStore && (
        <StoreDetectionBanner 
          storeName={detectedStore} 
          onDismiss={handleDismissStoreBanner}
        />
      )}

      {/* Sample Data Banners */}
      {tier === 'anonymous' && showSampleBanner && hasSampleData && (
        <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-green-50 shadow-md border-blue-200 animate-fade-in overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 w-full">
              <p className="font-semibold text-sm sm:text-base text-foreground mb-1">
                🎉 Sample data loaded - try the app!
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                This is what FreshTrack looks like in action
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                onClick={handleClearSampleData} 
                size="sm" 
                variant="outline"
                className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2 min-h-[44px]"
              >
                Clear Sample Data
              </Button>
              <Button 
                onClick={handleKeepSampleData} 
                size="sm" 
                className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2 min-h-[44px] bg-primary"
              >
                Add My Own Items
              </Button>
            </div>
          </div>
        </Card>
      )}

      {tier !== 'anonymous' && hasSampleData && (
        <Card className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-green-50 shadow-md border-blue-200 animate-fade-in overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 w-full">
              <p className="font-semibold text-sm sm:text-base text-foreground mb-1">
                🎉 Sample data loaded - try the app!
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Clear it when you're ready to add your own items
              </p>
            </div>
            <Button
              onClick={clearSampleData}
              disabled={clearingSampleData}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2 min-h-[44px] whitespace-nowrap"
            >
              {clearingSampleData ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  <span>Clear Sample Data</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
      
      {tier !== 'anonymous' && !hasSampleData && stats.totalItems > 0 && (
        <Card className="p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-red-50 shadow-md border-orange-200 animate-fade-in overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 w-full">
              <p className="font-semibold text-sm sm:text-base text-foreground mb-1">
                🗑️ Clear all items from your fridge
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Remove all {stats.totalItems} items and start fresh
              </p>
            </div>
            <Button
              onClick={clearAllItems}
              disabled={clearingSampleData}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto text-xs sm:text-sm px-3 py-2 min-h-[44px] whitespace-nowrap border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {clearingSampleData ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Clearing...</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  <span>Clear All Items</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Warm Greeting Header */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
        <img 
          src={heroImage} 
          alt="Fresh groceries" 
          className="w-full h-44 sm:h-56 lg:h-64 object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6">
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-white mb-1 drop-shadow-lg">
              {getGreeting()}! {getTimeBasedEmoji()}
            </h1>
            <p className="text-white/90 text-sm sm:text-base mb-1 drop-shadow-md">
              {stats.expiringSoon > 0 ? `Your fridge has ${stats.expiringSoon} ${stats.expiringSoon === 1 ? 'item' : 'items'} expiring soon` : "Your fridge is looking good"}
            </p>
            <p className="text-white/80 text-xs sm:text-sm drop-shadow-md">
              {getContextualMessage(stats.expiringSoon)}
            </p>
          </div>
        </div>
      </div>

      {/* Your Fridge at a Glance */}
      <Card className="p-4 sm:p-6 shadow-lg bg-gradient-to-br from-green-50/50 to-blue-50/50 border-green-200/50 animate-scale-in overflow-hidden">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Your Fridge at a Glance</h2>
        
        <div className="flex items-center justify-around py-3 sm:py-4">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">🥬</div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{loading ? "-" : stats.totalItems}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Items</div>
          </div>
          
          <Separator orientation="vertical" className="h-12 sm:h-16" />
          
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">⏰</div>
            <div className="text-2xl sm:text-3xl font-bold text-warning">{loading ? "-" : stats.expiringSoon}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Expiring</div>
          </div>
          
          <Separator orientation="vertical" className="h-12 sm:h-16" />
          
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">✨</div>
            <div className="text-2xl sm:text-3xl font-bold text-success">{loading ? "-" : stats.totalItems - stats.expired}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Fresh</div>
          </div>
        </div>
        
        <Separator className="my-3 sm:my-4" />
        
        <p className="text-center text-sm sm:text-base font-medium text-foreground px-2">
          {statusMessage}
        </p>
      </Card>

      {/* Health Score Journey */}
      {tier !== 'anonymous' && (
        <Card 
          className="p-6 shadow-lg bg-gradient-to-br from-green-500/5 to-emerald-500/10 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 duration-300 border-green-200/50 animate-fade-in"
          onClick={() => navigate('/health')}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              🥗 Your Healthy Eating Journey
            </h2>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
          
          {consumedThisWeek === 0 ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-3">🌱</div>
              <p className="text-lg font-semibold text-foreground mb-2">Just getting started!</p>
              <p className="text-sm text-muted-foreground mb-4">
                Track what you eat to see your health score
              </p>
              <Button onClick={() => navigate('/inventory')} size="sm">
                Track Your Items
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted/30"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - healthScore / 100)}`}
                    className={`transition-all duration-1000 ${healthScore >= 75 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-orange-500'}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">{healthScore}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{healthInfo.emoji}</span>
                  <p className="text-lg font-semibold text-foreground">{healthInfo.title}</p>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Based on {consumedThisWeek} {consumedThisWeek === 1 ? 'item' : 'items'} consumed this week
                </p>
                <p className="text-sm text-primary font-medium">
                  {healthInfo.message}
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* This Month's Impact */}
      <Card className="p-6 shadow-lg bg-gradient-to-br from-amber-50/50 to-green-50/50 border-amber-200/50 animate-fade-in">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          💰 This Month's Impact
        </h2>
        
        <div className="grid grid-cols-2 gap-6 mb-4">
          <div className="text-center p-4 bg-green-100/50 rounded-xl">
            <p className="text-sm text-muted-foreground mb-2">Money Saved</p>
            <p className="text-3xl font-bold text-green-600">${loading ? "-" : moneySaved.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{usedItemsCount} items used</p>
          </div>
          
          <div className="text-center p-4 bg-red-100/50 rounded-xl">
            <p className="text-sm text-muted-foreground mb-2">Money Wasted</p>
            <p className="text-3xl font-bold text-red-600">${loading ? "-" : moneyWasted.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">{wastedItemsCount} items thrown out</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl mb-4">
          <p className="text-sm text-center font-medium text-foreground mb-2">
            {motivationalMsg}
          </p>
          {moneySaved + moneyWasted === 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Mark items as used to track savings
            </p>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Your efficiency:</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{efficiency}%</span>
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Goal: 80%</span>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(efficiency, 100)}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Primary Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-scale-in" style={{ animationDelay: '100ms' }}>
        <Button 
          onClick={handleProFeatureClick}
          className="h-28 sm:h-32 min-h-[112px] bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative overflow-hidden"
        >
          {tier !== 'pro' && (
            <Badge className="absolute top-2 right-2 bg-yellow-500 text-white text-xs border-0">
              <Crown className="w-3 h-3 mr-1" />
              Pro
            </Badge>
          )}
          <div className="flex flex-col items-center gap-2 sm:gap-3 px-2">
            <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
            <div className="text-center">
              <p className="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1">Add Items</p>
              <p className="text-xs opacity-90 line-clamp-1">Scan receipt or add manually</p>
            </div>
          </div>
        </Button>
        
        <Link to="/recipes" className="block">
          <Button className="w-full h-28 sm:h-32 min-h-[112px] bg-gradient-to-br from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
            <div className="flex flex-col items-center gap-2 sm:gap-3 px-2">
              <ChefHat className="w-7 h-7 sm:w-8 sm:h-8" />
              <div className="text-center">
                <p className="text-sm sm:text-base font-semibold mb-0.5 sm:mb-1">Find Recipes</p>
                <p className="text-xs opacity-90 line-clamp-1">Use what you have tonight</p>
              </div>
            </div>
          </Button>
        </Link>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Button
          onClick={() => {
            const isEnabled = localStorage.getItem('shoppingAssistantEnabled') === 'true';
            if (isEnabled) {
              navigate('/shopping-mode');
            } else {
              navigate('/shopping-assistant-setup');
            }
          }}
          variant="outline"
          className="h-20 sm:h-24 min-h-[80px] bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 overflow-hidden"
        >
          <div className="flex flex-col items-center gap-1.5 sm:gap-2 px-1">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            <span className="text-xs sm:text-sm font-medium text-foreground text-center line-clamp-2">Shopping Mode</span>
          </div>
        </Button>
        
        <Link to="/spending">
          <Button variant="outline" className="w-full h-20 sm:h-24 min-h-[80px] bg-gradient-to-br from-blue-50 to-gray-50 hover:from-blue-100 hover:to-gray-100 border-blue-200 overflow-hidden">
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 px-1">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium text-foreground text-center line-clamp-2">My Stats</span>
            </div>
          </Button>
        </Link>
      </div>

      {/* Expiring Items Section */}
      <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-foreground">⏰ Items Needing Love</h2>
          <Link to="/inventory">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        
        {stats.expiringSoon > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            Use these soon so they don't go to waste!
          </p>
        )}
        
        {loading ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </Card>
        ) : expiringItems.length === 0 ? (
          <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md">
            <div className="text-6xl mb-3">✨</div>
            <p className="text-xl font-semibold text-foreground mb-2">All Clear!</p>
            <p className="text-muted-foreground mb-4">
              No items expiring soon. Your fridge is well-managed! 🎉
            </p>
            <Button onClick={() => navigate('/inventory')} variant="outline">
              Show All Items
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {expiringItems.map((item, index) => (
              <Card 
                key={index} 
                className={`p-4 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 duration-200 ${item.daysLeft <= 1 ? 'border-red-300 bg-red-50/50 animate-pulse-soft' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-3xl">{getCategoryEmoji(item.category)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={item.daysLeft <= 1 ? "destructive" : "secondary"}
                      className="font-semibold text-sm px-3 py-1"
                    >
                      {item.daysLeft}d left
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => navigate(`/recipes?ingredient=${encodeURIComponent(item.name)}`)}
                      className="text-primary hover:text-primary/80"
                    >
                      Add to recipe →
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Modals */}
      <UpgradePrompt 
        open={showUpgradePrompt}
        onOpenChange={setShowUpgradePrompt}
        type="pro-feature"
        featureName="Receipt Scanning"
      />

      <InstallPrompt />
    </div>
  );
}
