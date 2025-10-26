import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StoreDetectionBannerProps {
  storeName: string;
  onDismiss: () => void;
}

export const StoreDetectionBanner = ({ storeName, onDismiss }: StoreDetectionBannerProps) => {
  const navigate = useNavigate();

  const handleStartShopping = () => {
    localStorage.setItem('detectedStore', storeName);
    navigate('/shopping-mode');
  };

  return (
    <Card className="p-4 shadow-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground mb-1">
            Looks like you're near {storeName}! 🛒
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Start shopping mode to see what you need
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleStartShopping}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            >
              Start Shopping Mode
            </Button>
            <Button
              onClick={onDismiss}
              size="sm"
              variant="outline"
            >
              Not Shopping
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};
