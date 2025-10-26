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
    <div className="min-h-screen bg-background pb-20">
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border shadow-sm z-10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">FreshTrack</h1>
        </div>
        
        {user ? (
          <Link to="/profile">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
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
            className="text-sm"
          >
            <User className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        )}
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-2xl mt-14">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center justify-around py-3">
            {navItems.map(({ icon: Icon, label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all",
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
