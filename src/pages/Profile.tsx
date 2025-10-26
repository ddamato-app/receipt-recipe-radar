import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, LogOut, Mail, Calendar, Users, Bell, Download, Settings as SettingsIcon, Package, ChefHat, DollarSign, TrendingUp, Receipt, Apple, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStoredReceipts } from '@/lib/receiptData';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { 
    user, 
    tier, 
    signOut, 
    itemCount, 
    recipeCountToday,
    devSetTier,
    devResetItemCount,
    devResetRecipeCount,
    devResetAllLimits,
    devClearAllData,
    devSimulateUsage,
  } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDevTools, setShowDevTools] = useState(
    import.meta.env.DEV || localStorage.getItem('showDevTools') === 'true'
  );
  const [stats, setStats] = useState({
    itemsThisMonth: 0,
    recipesGenerated: 0,
    moneySaved: 0,
  });
  const [pendingReceipts, setPendingReceipts] = useState(0);

  useEffect(() => {
    if (tier !== 'anonymous' && user) {
      fetchUserStats();
    }
    
    // Check for pending receipts
    const receipts = getStoredReceipts();
    setPendingReceipts(receipts.filter(r => r.status === 'ready').length);
  }, [tier, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        const newValue = !showDevTools;
        setShowDevTools(newValue);
        localStorage.setItem('showDevTools', String(newValue));
        toast({
          title: newValue ? 'Dev Tools Enabled' : 'Dev Tools Disabled',
          description: newValue ? 'Press Ctrl+Shift+D to hide' : 'Press Ctrl+Shift+D to show',
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDevTools, toast]);

  const fetchUserStats = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Fetch items created this month
      const { data: items } = await supabase
        .from('fridge_items')
        .select('id, price, status, completed_at')
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString());

      // Calculate stats
      const itemsThisMonth = items?.length || 0;
      const usedItems = items?.filter(item => item.status === 'used' && item.completed_at) || [];
      const moneySaved = usedItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

      setStats({
        itemsThisMonth,
        recipesGenerated: recipeCountToday, // We'd need to track this in DB for accurate count
        moneySaved,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully',
    });
  };

  const renderDevTools = () => {
    if (!showDevTools) return null;
    
    return (
      <Card className="p-6 shadow-lg border-2 border-warning">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          🔧 Developer Testing Tools
          <Badge variant="outline" className="ml-auto">DEV MODE</Badge>
        </h3>

        {/* Current State */}
        <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-1 text-sm">
          <p><strong>Current tier:</strong> {tier}</p>
          <p><strong>Items in fridge:</strong> {itemCount}</p>
          <p><strong>Recipes today:</strong> {recipeCountToday}</p>
          <p><strong>Last reset:</strong> {new Date().toDateString()}</p>
        </div>

        {/* Tier Switcher */}
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Switch Tier:</p>
            <div className="flex gap-2">
              <Button
                variant={tier === 'anonymous' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  devSetTier('anonymous');
                  toast({ title: 'Switched to Anonymous' });
                }}
              >
                Anonymous
              </Button>
              <Button
                variant={tier === 'free' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  devSetTier('free');
                  toast({ title: 'Switched to Free Account' });
                }}
              >
                Free Account
              </Button>
              <Button
                variant={tier === 'pro' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  devSetTier('pro');
                  toast({ title: 'Switched to Pro' });
                }}
              >
                Pro
              </Button>
            </div>
          </div>

          {/* Counter Resets */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Reset Counters:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  devResetItemCount();
                  toast({ title: 'Item count reset' });
                }}
              >
                Reset Item Count
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  devResetRecipeCount();
                  toast({ title: 'Recipe count reset' });
                }}
              >
                Reset Recipe Count
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  devResetAllLimits();
                  toast({ title: 'All limits reset' });
                }}
              >
                Reset All Limits
              </Button>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Data Management:</p>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Clear all localStorage data?')) {
                    devClearAllData();
                    toast({ title: 'All data cleared', variant: 'destructive' });
                  }
                }}
              >
                Clear All Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Load Sample Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  devSimulateUsage();
                  toast({ title: '30 days usage simulated' });
                }}
              >
                Simulate 30 Days Usage
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Press <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+Shift+D</kbd> to toggle dev tools
        </p>
      </Card>
    );
  };

  // Anonymous user view
  if (tier === 'anonymous') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Account</h1>
          <p className="text-muted-foreground">Sign in to unlock more features</p>
        </div>

        <Card className="p-8 text-center shadow-lg">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-foreground">Sign in to unlock more features</h2>
            
            {/* Current Limits */}
            <div className="space-y-3 text-left bg-muted/30 p-4 rounded-lg">
              <p className="font-semibold text-foreground mb-2">Your current limits:</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-foreground">📦</span>
                  <span className="text-muted-foreground">Items: <strong className="text-destructive">15 max</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground">🍳</span>
                  <span className="text-muted-foreground">Recipes: <strong className="text-destructive">3 per day</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-foreground">💾</span>
                  <span className="text-muted-foreground">Storage: <strong className="text-destructive">This device only</strong></span>
                </div>
              </div>
            </div>

            {/* Free Account Benefits */}
            <div className="space-y-2 text-left bg-gradient-to-r from-success/10 to-primary/10 p-4 rounded-lg">
              <p className="font-semibold text-foreground mb-2">With a free account:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>✓ Unlimited items in fridge</p>
                <p>✓ Unlimited recipe suggestions</p>
                <p>✓ Sync across all your devices</p>
                <p>✓ 3 months of history</p>
                <p>✓ Family sharing (up to 3 members)</p>
                <p>✓ Weekly email reports</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => setShowAuthModal(true)}
                className="w-full bg-gradient-to-r from-primary to-success text-white"
                size="lg"
              >
                Create Free Account
              </Button>
              <Button 
                onClick={() => setShowAuthModal(true)}
                variant="outline"
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </div>
        </Card>

        <AuthModal 
          open={showAuthModal} 
          onOpenChange={setShowAuthModal}
        />
        
        {renderDevTools()}
      </div>
    );
  }

  // Logged-in user view
  const isPro = tier === 'pro';
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently';

  // Get tier badge
  const getTierBadge = () => {
    if (isPro) {
      return (
        <Badge className="bg-gradient-to-r from-warning to-primary text-white text-base px-4 py-1">
          <Crown className="w-4 h-4 mr-2" />
          ⭐ Pro Member
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-success to-primary text-white text-base px-4 py-1">
        ✨ FreshTrack Member
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Account</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Tier Badge */}
      <div className="flex justify-center">
        {getTierBadge()}
      </div>

      {/* Stats Card */}
      <Card className="p-6 shadow-lg bg-gradient-to-br from-primary/5 to-secondary/5">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Your Impact
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Package className="w-4 h-4" />
              <span>Items tracked</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.itemsThisMonth}</p>
            <p className="text-xs text-muted-foreground">this month</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <ChefHat className="w-4 h-4" />
              <span>Recipes generated</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.recipesGenerated}</p>
            <p className="text-xs text-muted-foreground">today</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="w-4 h-4" />
              <span>Money saved</span>
            </div>
            <p className="text-2xl font-bold text-success">${stats.moneySaved.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">this month</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4" />
              <span>Member since</span>
            </div>
            <p className="text-lg font-bold text-foreground">{memberSince}</p>
          </div>
        </div>
      </Card>

      {/* Account Info Card */}
      <Card className="p-6 shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user?.email}</h2>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Member since {memberSince}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span>{user?.email}</span>
          </div>
        </div>

        {!isPro && (
          <>
            <Separator className="my-6" />
            <div className="bg-gradient-to-r from-warning/10 to-primary/10 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-warning" />
                Upgrade to Pro
              </h3>
              <div className="space-y-2 mb-3 text-sm">
                <p className="text-muted-foreground">Upgrade to Pro for:</p>
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">⭐ Receipt scanning <span className="text-muted-foreground">(save 10+ min/week)</span></p>
                  <p className="text-foreground">⭐ AI meal planner</p>
                  <p className="text-foreground">⭐ Advanced analytics</p>
                  <p className="text-foreground">⭐ Unlimited history</p>
                  <p className="text-foreground">⭐ Export data</p>
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-warning to-primary text-white">
                Start 7-Day Free Trial - $4.99/month after
              </Button>
            </div>
          </>
        )}

        {isPro && (
          <>
            <Separator className="my-6" />
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subscription</span>
                <Badge className="bg-success">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Renews</span>
                <span className="font-medium">Next month</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Manage Subscription
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Settings Section */}
      <Card className="p-6 shadow-lg">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Settings
        </h3>

        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            size="lg"
            onClick={() => navigate('/health')}
          >
            <Apple className="w-4 h-4 mr-2" />
            Health Score
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            size="lg"
            onClick={() => {
              const isEnabled = localStorage.getItem('shoppingAssistantEnabled') === 'true';
              if (isEnabled) {
                navigate('/shopping-mode');
              } else {
                navigate('/shopping-assistant-setup');
              }
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Shopping Assistant
            {localStorage.getItem('shoppingAssistantEnabled') !== 'true' && (
              <Badge variant="outline" className="ml-auto text-xs">Not enabled</Badge>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            size="lg"
            onClick={() => navigate('/receipt-inbox')}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Receipt Inbox
            {pendingReceipts > 0 && (
              <Badge className="ml-auto">{pendingReceipts} pending</Badge>
            )}
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" size="lg">
            <Bell className="w-4 h-4 mr-2" />
            Notification Preferences
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" size="lg">
            <Users className="w-4 h-4 mr-2" />
            Family Sharing {!isPro && <span className="text-xs text-muted-foreground ml-2">(up to 3)</span>}
          </Button>

          {isPro && (
            <Button variant="ghost" className="w-full justify-start" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Export Data (CSV)
            </Button>
          )}

          <Separator className="my-4" />

          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" 
            size="lg"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </Card>

      {renderDevTools()}
    </div>
  );
}
