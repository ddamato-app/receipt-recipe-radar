import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, Check } from "lucide-react";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('installPromptDismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-24 left-4 right-4 p-4 shadow-lg bg-gradient-to-r from-primary/10 to-success/10 border-primary/20 z-40 animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={handleDismiss}
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="flex items-start gap-3 pr-8">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-1">Install FreshTrack</p>
          <p className="text-sm text-muted-foreground mb-3">
            Quick access when shopping! Works offline.
          </p>
          <div className="space-y-1 mb-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              <Check className="w-3 h-3 text-success" />
              Launch from home screen
            </p>
            <p className="flex items-center gap-1">
              <Check className="w-3 h-3 text-success" />
              Works without internet
            </p>
            <p className="flex items-center gap-1">
              <Check className="w-3 h-3 text-success" />
              Faster than browser
            </p>
          </div>
          <Button
            onClick={handleInstall}
            size="sm"
            className="w-full bg-gradient-to-r from-primary to-success text-white"
          >
            Install Now
          </Button>
        </div>
      </div>
    </Card>
  );
};
