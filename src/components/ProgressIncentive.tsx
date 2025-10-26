import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

type ProgressIncentiveProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: '10-items' | '2-recipes';
  onCreateAccount: () => void;
};

export function ProgressIncentive({ open, onOpenChange, type, onCreateAccount }: ProgressIncentiveProps) {
  const content = type === '10-items' ? {
    emoji: '🎉',
    title: "You're getting the hang of this!",
    message: "You've tracked 10 items. Create a free account to track unlimited items and never lose your data.",
    primaryButton: 'Create Free Account',
  } : {
    emoji: '🍳',
    title: "Loving the recipes?",
    message: "With a free account, you get unlimited recipe suggestions every day!",
    primaryButton: 'Create Free Account',
  };

  const handleCreateAccount = () => {
    onOpenChange(false);
    onCreateAccount();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="text-center">
            <div className="text-6xl mb-4">{content.emoji}</div>
            <DialogTitle className="text-xl">{content.title}</DialogTitle>
            <DialogDescription className="mt-2">
              {content.message}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          <Button 
            onClick={handleCreateAccount}
            className="w-full bg-gradient-to-r from-primary to-success text-white"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {content.primaryButton}
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
