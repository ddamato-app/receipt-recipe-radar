import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Check, Shield, BellOff, Download, Smartphone, Zap, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { requestNotificationPermission, isNotificationSupported } from "@/lib/notificationService";
import { requestLocationPermission, isLocationAvailable } from "@/lib/locationService";

export default function ShoppingAssistantSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requesting, setRequesting] = useState(false);
  const [step, setStep] = useState(1);

  const handleEnableSmartShopping = async () => {
    setRequesting(true);

    // Step 1: Request location permission
    if (isLocationAvailable()) {
      const locationGranted = await requestLocationPermission();
      
      if (!locationGranted) {
        toast({
          title: "Location Permission Needed",
          description: "Enable location to detect stores. You can still use manual mode.",
          variant: "destructive",
        });
        setRequesting(false);
        setStep(2); // Skip to notifications
        return;
      }

      toast({
        title: "Location Enabled!",
        description: "We'll detect when you're near stores",
      });
    }

    setStep(2);
    setRequesting(false);
  };

  const handleEnableNotifications = async () => {
    setRequesting(true);

    // Step 2: Request notification permission
    if (isNotificationSupported()) {
      const notificationGranted = await requestNotificationPermission();
      
      if (!notificationGranted) {
        toast({
          title: "Notifications Optional",
          description: "You can still use all shopping features",
        });
      } else {
        toast({
          title: "Notifications Enabled!",
          description: "You'll get helpful shopping reminders",
        });
      }
    }

    // Mark as enabled
    localStorage.setItem('shoppingAssistantEnabled', 'true');
    
    setStep(3);
    setRequesting(false);
  };

  const handleComplete = () => {
    navigate('/shopping-mode');
  };

  const handleSetupLater = () => {
    toast({
      title: "No problem!",
      description: "You can enable this anytime from your Profile settings",
    });
    navigate('/');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="text-6xl mb-4">📱</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Smart Shopping Assistant</h1>
        <p className="text-muted-foreground">Never forget what's in your fridge while shopping!</p>
      </div>

      {step === 1 && (
        <Card className="p-8 shadow-lg">
          <h2 className="text-xl font-bold text-foreground mb-4">📱 How It Works (PWA Version):</h2>
          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Open FreshTrack when you arrive at the store</p>
                <p className="text-sm text-muted-foreground">We'll detect you're shopping and help you</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Location detection when app is open</p>
                <p className="text-sm text-muted-foreground">We'll show a banner if you're near a grocery store</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Or tap "Shopping Mode" anytime to start</p>
                <p className="text-sm text-muted-foreground">Quick manual access from home screen</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Install to home screen for quick access</p>
                <p className="text-sm text-muted-foreground">Works offline and launches instantly</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-600" />
              PWA Benefits:
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Works on all phones (iPhone & Android)</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Offline support for shopping lists</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Fast, responsive interface</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>No app store download needed</span>
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-primary/10 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Your privacy matters:
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Location only checked when app is open</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Never tracked or shared</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Easy to disable anytime</span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <span>Battery efficient</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleEnableSmartShopping}
              disabled={requesting}
              className="w-full bg-gradient-to-r from-primary to-success text-white"
              size="lg"
            >
              {requesting ? "Setting Up..." : "Enable Location Detection"}
            </Button>
            <Button
              onClick={handleSetupLater}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Skip - Use Manual Mode
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-8 shadow-lg">
          <h2 className="text-xl font-bold text-foreground mb-4">🔔 Enable Notifications</h2>
          <p className="text-muted-foreground mb-6">
            Get helpful reminders when you have shopping lists waiting
          </p>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Shopping list reminders</p>
                <p className="text-sm text-muted-foreground">If you haven't shopped in 5+ days</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Smart, not spammy</p>
                <p className="text-sm text-muted-foreground">Maximum 2 notifications per day</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleEnableNotifications}
              disabled={requesting}
              className="w-full bg-gradient-to-r from-primary to-success text-white"
              size="lg"
            >
              {requesting ? "Enabling..." : "Enable Notifications"}
            </Button>
            <Button
              onClick={() => {
                localStorage.setItem('shoppingAssistantEnabled', 'true');
                setStep(3);
              }}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Skip Notifications
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">You're All Set!</h2>
          <p className="text-muted-foreground mb-6">
            Your Shopping Assistant is ready to help you shop smarter
          </p>

          <div className="bg-muted/30 p-4 rounded-lg mb-6 text-left">
            <p className="font-semibold text-foreground mb-2">What's Next:</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Open the app when you arrive at stores</p>
              <p>• Or tap "Shopping Mode" anytime from home</p>
              <p>• Install to home screen for quick access</p>
              <p>• Get smart meal suggestions based on your fridge</p>
            </div>
          </div>

          <Button
            onClick={handleComplete}
            className="w-full bg-gradient-to-r from-primary to-success text-white"
            size="lg"
          >
            Start Shopping Mode
          </Button>
        </Card>
      )}

      <Card className="p-4 bg-muted/50">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">PWA Limitations:</p>
            <p>• Store detection only works when app is open</p>
            <p>• No automatic background notifications</p>
            <p>• Manual mode always available</p>
            <p className="mt-2">
              <strong>Want automatic detection?</strong> Native app coming soon!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
