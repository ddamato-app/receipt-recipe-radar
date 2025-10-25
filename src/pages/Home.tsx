import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Package, Calendar, TrendingUp, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-groceries.jpg";

export default function Home() {
  // Mock data - will be replaced with real data later
  const stats = {
    totalItems: 24,
    expiringSoon: 3,
    expired: 1,
  };

  const expiringItems = [
    { name: "Milk", daysLeft: 2, category: "Dairy" },
    { name: "Strawberries", daysLeft: 1, category: "Fruits" },
    { name: "Chicken Breast", daysLeft: 3, category: "Meat" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <img 
          src={heroImage} 
          alt="Fresh groceries" 
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
          <h1 className="text-3xl font-bold text-white mb-2">FreshTrack</h1>
          <p className="text-white/90 text-sm">Your smart fridge companion</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center shadow-md">
          <Package className="w-6 h-6 mx-auto mb-2 text-primary" />
          <div className="text-2xl font-bold text-foreground">{stats.totalItems}</div>
          <div className="text-xs text-muted-foreground">Items</div>
        </Card>
        <Card className="p-4 text-center shadow-md">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-warning" />
          <div className="text-2xl font-bold text-foreground">{stats.expiringSoon}</div>
          <div className="text-xs text-muted-foreground">Expiring Soon</div>
        </Card>
        <Card className="p-4 text-center shadow-md">
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-success" />
          <div className="text-2xl font-bold text-foreground">{stats.totalItems - stats.expired}</div>
          <div className="text-xs text-muted-foreground">Fresh</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/add">
          <Button className="w-full h-20 bg-gradient-to-br from-primary to-success text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex flex-col items-center gap-2">
              <Camera className="w-6 h-6" />
              <span className="text-sm font-medium">Scan Receipt</span>
            </div>
          </Button>
        </Link>
        <Link to="/recipes">
          <Button className="w-full h-20 bg-gradient-to-br from-secondary to-warning text-white shadow-md hover:shadow-lg transition-all">
            <div className="flex flex-col items-center gap-2">
              <Calendar className="w-6 h-6" />
              <span className="text-sm font-medium">Get Recipes</span>
            </div>
          </Button>
        </Link>
      </div>

      {/* Expiring Soon Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Expiring Soon</h2>
          <Link to="/inventory">
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </Link>
        </div>
        
        <div className="space-y-3">
          {expiringItems.map((item, index) => (
            <Card key={index} className="p-4 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
                <Badge 
                  variant={item.daysLeft <= 1 ? "destructive" : "secondary"}
                  className="font-semibold"
                >
                  {item.daysLeft}d left
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
