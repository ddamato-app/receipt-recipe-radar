import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, LogOut, Mail, Calendar, Users, Bell, Download, Settings as SettingsIcon, Package, ChefHat, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function Profile() {
  const { user, tier, signOut, itemCount, recipeCountToday } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState({
    itemsThisMonth: 0,
    recipesGenerated: 0,
    moneySaved: 0,
  });

  useEffect(() => {
    if (tier !== 'anonymous' && user) {
      fetchUserStats();
    }
  }, [tier, user]);

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
    </div>
  );
}
