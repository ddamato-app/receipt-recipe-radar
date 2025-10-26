import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Crown, LogOut, Mail, Calendar, Users, Bell, Download, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { AuthModal } from '@/components/AuthModal';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, tier, signOut } = useAuth();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);

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
            
            <div className="space-y-2 text-left bg-muted/30 p-4 rounded-lg">
              <p className="font-semibold text-foreground">Free Account includes:</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>✓ Unlimited items in fridge</p>
                <p>✓ Sync across all your devices</p>
                <p>✓ Unlimited recipe suggestions</p>
                <p>✓ Family sharing (up to 3 members)</p>
                <p>✓ 3 months of history</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Account</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

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
              <div className="flex items-center gap-2 mt-1">
                {isPro ? (
                  <Badge className="bg-gradient-to-r from-warning to-primary text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Pro Member
                  </Badge>
                ) : (
                  <Badge variant="secondary">Free Account</Badge>
                )}
              </div>
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
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4 text-warning" />
                Upgrade to Pro
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Unlock premium features for just $4.99/month
              </p>
              <Button className="w-full bg-gradient-to-r from-warning to-primary text-white">
                Start 7-Day Free Trial
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
