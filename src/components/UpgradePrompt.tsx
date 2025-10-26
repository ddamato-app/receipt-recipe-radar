import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, X } from 'lucide-react';
import { useState } from 'react';
import { AuthModal } from './AuthModal';
import { useAuth } from '@/contexts/AuthContext';

type UpgradePromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'item-limit' | 'recipe-limit' | 'pro-feature';
  featureName?: string;
};

export function UpgradePrompt({ open, onOpenChange, type, featureName }: UpgradePromptProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { tier } = useAuth();

  const handleUpgrade = () => {
    if (tier === 'anonymous') {
      setShowAuthModal(true);
      onOpenChange(false);
    } else {
      // Navigate to upgrade page or show Pro upgrade
      onOpenChange(false);
    }
  };

  const getContent = () => {
    switch (type) {
      case 'item-limit':
        return {
          emoji: '📦',
          title: "You've reached the free limit of 15 items",
          description: 'Create a free account to track unlimited items and sync across devices!',
          primaryButton: 'Create Free Account',
          secondaryButton: 'Maybe Later',
        };
      case 'recipe-limit':
        return {
          emoji: '🍳',
          title: "You've used your 3 free recipes today",
          description: 'Create a free account for unlimited recipe suggestions!',
          primaryButton: 'Create Free Account',
          secondaryButton: 'Try Tomorrow',
        };
      case 'pro-feature':
        return {
          emoji: '✨',
          title: `${featureName || 'This'} is a Pro feature`,
          description: 'Upgrade to Pro to unlock premium features',
          features: [
            '✓ Receipt scanning',
            '✓ 7-day meal planner',
            '✓ Advanced analytics',
            '✓ AI custom recipes',
            '✓ Unlimited history',
            '✓ CSV export',
          ],
          primaryButton: 'Start 7-Day Free Trial',
          secondaryButton: 'Learn More',
          showPrice: true,
        };
      default:
        return {
          emoji: '🎉',
          title: 'Upgrade Your Account',
          description: 'Get access to more features',
          primaryButton: 'Upgrade',
          secondaryButton: 'Cancel',
        };
    }
  };

  const content = getContent();

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="text-center">
              <div className="text-6xl mb-4">{content.emoji}</div>
              <DialogTitle className="text-xl">{content.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {content.description}
              </DialogDescription>
            </div>
          </DialogHeader>

          {content.features && (
            <div className="space-y-2 py-4 bg-muted/30 rounded-lg p-4">
              <p className="font-semibold text-foreground mb-2">Upgrade to unlock:</p>
              <div className="space-y-1">
                {content.features.map((feature, index) => (
                  <p key={index} className="text-sm text-muted-foreground">{feature}</p>
                ))}
              </div>
              {content.showPrice && (
                <p className="text-sm font-semibold text-foreground mt-3">
                  Only $4.99/month
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleUpgrade}
              className={type === 'pro-feature' ? 'bg-gradient-to-r from-warning to-primary text-white' : ''}
            >
              {type === 'pro-feature' && <Crown className="w-4 h-4 mr-2" />}
              {content.primaryButton}
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {content.secondaryButton}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        defaultTab="signup"
      />
    </>
  );
}
