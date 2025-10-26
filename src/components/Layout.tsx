import { Home, Package, PlusCircle, ChefHat, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out successfully" });
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Package, label: "Fridge", path: "/inventory" },
    { icon: PlusCircle, label: "Add", path: "/add" },
    { icon: ChefHat, label: "Recipes", path: "/recipes" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="fixed top-0 left-0 right-0 h-14 bg-card border-b border-border shadow-sm z-10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">FreshTrack</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
        </Button>
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
    </div>
  );
};
