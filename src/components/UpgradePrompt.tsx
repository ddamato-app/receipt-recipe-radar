import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, X, Star, Clock, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AuthModal } from './AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';

type UpgradePromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'item-limit' | 'recipe-limit' | 'pro-feature';
  featureName?: string;
};

const testimonials = [
  { text: "Receipt scanning saves me 15 minutes every week!", author: "Sarah M." },
  { text: "My family has cut food waste by 40% using FreshTrack", author: "David K." },
  { text: "The meal planner is a game-changer for busy parents", author: "Jennifer L." },
];

export function UpgradePrompt({ open, onOpenChange, type, featureName }: UpgradePromptProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { tier } = useAuth();

  useEffect(() => {
    if (open && type === 'pro-feature') {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [open, type]);

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
          description: 'See how a free account compares:',
          primaryButton: "Create Free Account - It's Free!",
          secondaryButton: 'Maybe Later',
          showComparison: true,
        };
      case 'recipe-limit':
        return {
          emoji: '🍳',
          title: "You've used your 3 free recipes today",
          description: 'See what you get with a free account:',
          primaryButton: "Create Free Account - It's Free!",
          secondaryButton: 'Try Tomorrow',
          showComparison: true,
        };
      case 'pro-feature':
        return {
          emoji: '✨',
          title: `${featureName || 'This'} is a Pro feature`,
          description: 'Join 500+ families saving an average of $847/year',
          features: [
            { icon: '📸', text: 'Receipt scanning', detail: 'Save 10+ min per shopping trip' },
            { icon: '🍽️', text: 'AI meal planner', detail: 'Never wonder what\'s for dinner' },
            { icon: '📊', text: 'Advanced analytics', detail: 'See exactly where your money goes' },
            { icon: '🔍', text: 'Barcode scanning', detail: 'Add items in 2 seconds' },
            { icon: '📈', text: 'Unlimited history', detail: 'Track trends over time' },
            { icon: '💾', text: 'Export data', detail: 'Your data, your way' },
          ],
          primaryButton: 'Start Free Trial',
          secondaryButton: 'Maybe Later',
          showPrice: true,
          showTestimonial: true,
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

          {/* Side-by-Side Comparison for Anonymous Users */}
          {content.showComparison && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Free Column */}
                <Card className="p-4 bg-muted/30">
                  <div className="text-center mb-3">
                    <p className="text-sm font-semibold text-muted-foreground">Free (Current)</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-destructive" />
                      <span className="text-muted-foreground">15 items max</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-destructive" />
                      <span className="text-muted-foreground">3 recipes/day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-destructive" />
                      <span className="text-muted-foreground">This device</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <X className="w-4 h-4 text-destructive" />
                      <span className="text-muted-foreground">Current month</span>
                    </div>
                  </div>
                </Card>

                {/* Free Account Column */}
                <Card className="p-4 bg-gradient-to-br from-success/20 to-primary/20 border-success">
                  <div className="text-center mb-3">
                    <p className="text-sm font-semibold text-foreground">Free Account</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="font-medium text-foreground">Unlimited</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="font-medium text-foreground">Unlimited</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="font-medium text-foreground">Sync everywhere</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="font-medium text-foreground">3-month history</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Pro Feature Grid */}
          {content.features && !content.showComparison && (
            <div className="space-y-4">
              <div className="space-y-3 py-4">
                {content.features.map((feature: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <span className="text-2xl">{feature.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{feature.text}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.detail}</p>
                    </div>
                    <Check className="w-5 h-5 text-success flex-shrink-0" />
                  </div>
                ))}
              </div>
              
              {content.showPrice && (
                <Card className="p-4 bg-gradient-to-r from-warning/10 to-primary/10 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Then $4.99/month • Cancel anytime
                  </p>
                </Card>
              )}

              {/* Rotating Testimonial */}
              {content.showTestimonial && (
                <Card className="p-4 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm italic text-foreground mb-2">
                        "{testimonials[currentTestimonial].text}"
                      </p>
                      <p className="text-xs text-muted-foreground">
                        - {testimonials[currentTestimonial].author}
                      </p>
                    </div>
                  </div>
                </Card>
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
