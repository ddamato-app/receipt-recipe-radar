import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Check, Shield, BellOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ShoppingAssistantSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requesting, setRequesting] = useState(false);

  const handleEnableSmartShopping = async () => {
    setRequesting(true);
    
    if ("geolocation" in navigator) {
      try {
        await navigator.geolocation.getCurrentPosition(
          (position) => {
            // Success - store permission
            localStorage.setItem('shoppingAssistantEnabled', 'true');
            localStorage.setItem('lastKnownLocation', JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }));
            
            toast({
              title: "Smart Shopping Enabled!",
              description: "You'll get helpful notifications when near stores",
            });
            
            navigate('/shopping-mode');
          },
          (error) => {
            toast({
              title: "Location Permission Denied",
              description: "You can still use shopping mode manually",
              variant: "destructive",
            });
            setRequesting(false);
          }
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to request location permission",
          variant: "destructive",
        });
        setRequesting(false);
      }
    } else {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      setRequesting(false);
    }
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
        <div className="text-6xl mb-4">📍</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Smart Shopping Assistant</h1>
        <p className="text-muted-foreground">Never forget what's in your fridge while shopping!</p>
      </div>

      <Card className="p-8 shadow-lg">
        <h2 className="text-xl font-bold text-foreground mb-4">How it works:</h2>
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Detect when you're near grocery stores</p>
              <p className="text-sm text-muted-foreground">We'll check if you're at Walmart, Costco, Metro, and more</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Get notifications asking if you're shopping</p>
              <p className="text-sm text-muted-foreground">Quick prompt to help you shop smarter</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">See what you have and what you need</p>
              <p className="text-sm text-muted-foreground">Avoid buying duplicates and save money</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Get meal-based shopping suggestions</p>
              <p className="text-sm text-muted-foreground">Complete recipes with just a few additions</p>
            </div>
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
              <span>Location only checked near stores</span>
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
              <span>Works only when you want it</span>
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
            {requesting ? "Requesting Permission..." : "Enable Smart Shopping"}
          </Button>
          <Button
            onClick={handleSetupLater}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Set Up Later
          </Button>
        </div>
      </Card>

      <Card className="p-4 bg-muted/50">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Don't want notifications? You can always access Shopping Mode manually from your profile or home page.
          </p>
        </div>
      </Card>
    </div>
  );
}
