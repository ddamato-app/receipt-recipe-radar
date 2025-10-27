import { Home, Package, PlusCircle, ChefHat, DollarSign, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { Button } from "@/components/ui/button";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Package, label: "Fridge", path: "/inventory" },
    { icon: PlusCircle, label: "Add", path: "/add" },
    { icon: ChefHat, label: "Recipes", path: "/recipes" },
    { icon: DollarSign, label: "Stats", path: "/spending" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-24">
      <header className="fixed top-0 left-0 right-0 h-14 sm:h-16 bg-card border-b border-border shadow-sm z-10 px-4 sm:px-6 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h1 className="text-lg sm:text-xl font-bold">FreshTrack</h1>
        </div>
        
        {user ? (
          <Link to="/profile">
            <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] h-10 w-10 p-0 rounded-full">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm sm:text-base font-semibold text-primary">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </Button>
          </Link>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAuthModal(true)}
            className="text-sm sm:text-base px-3 py-2 min-h-[44px]"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="hidden sm:inline">Sign In</span>
            <span className="sm:hidden">Sign In</span>
          </Button>
        )}
      </header>
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-2xl mt-14 sm:mt-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg pb-safe">
        <div className="container mx-auto px-2 sm:px-4 max-w-2xl">
          <div className="flex items-center justify-around py-2 sm:py-3">
            {navItems.map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-2 rounded-lg transition-all min-h-[48px] min-w-[48px]",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-6 h-6", isActive && "scale-110")} />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
      />
    </div>
  );
};
