import { Home, Package, PlusCircle, ChefHat } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Package, label: "Fridge", path: "/inventory" },
    { icon: PlusCircle, label: "Add", path: "/add" },
    { icon: ChefHat, label: "Recipes", path: "/recipes" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container mx-auto px-4 py-6 max-w-2xl">
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
