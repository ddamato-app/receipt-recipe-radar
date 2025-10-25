import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";
import { useState } from "react";

type FridgeItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: string;
  daysLeft: number;
};

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - will be replaced with real data later
  const items: FridgeItem[] = [
    { id: "1", name: "Milk", quantity: 1, unit: "liter", category: "Dairy", expiryDate: "2025-10-27", daysLeft: 2 },
    { id: "2", name: "Strawberries", quantity: 250, unit: "g", category: "Fruits", expiryDate: "2025-10-26", daysLeft: 1 },
    { id: "3", name: "Chicken Breast", quantity: 500, unit: "g", category: "Meat", expiryDate: "2025-10-28", daysLeft: 3 },
    { id: "4", name: "Carrots", quantity: 5, unit: "pcs", category: "Vegetables", expiryDate: "2025-11-05", daysLeft: 11 },
    { id: "5", name: "Yogurt", quantity: 4, unit: "pcs", category: "Dairy", expiryDate: "2025-11-01", daysLeft: 7 },
    { id: "6", name: "Tomatoes", quantity: 6, unit: "pcs", category: "Vegetables", expiryDate: "2025-10-29", daysLeft: 4 },
  ];

  const getStatusBadge = (daysLeft: number) => {
    if (daysLeft <= 0) return <Badge variant="destructive">Expired</Badge>;
    if (daysLeft <= 2) return <Badge variant="destructive">{daysLeft}d left</Badge>;
    if (daysLeft <= 5) return <Badge className="bg-warning text-white">{daysLeft}d left</Badge>;
    return <Badge className="bg-success text-white">{daysLeft}d left</Badge>;
  };

  const filterByCategory = (category: string) => {
    if (category === "all") return items;
    return items.filter(item => item.category === category);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">My Fridge</h1>
        <p className="text-muted-foreground">Track your groceries and expiration dates</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 shadow-sm"
        />
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="Dairy">Dairy</TabsTrigger>
          <TabsTrigger value="Fruits">Fruits</TabsTrigger>
          <TabsTrigger value="Vegetables">Veggies</TabsTrigger>
          <TabsTrigger value="Meat">Meat</TabsTrigger>
        </TabsList>

        {["all", "Dairy", "Fruits", "Vegetables", "Meat"].map((category) => (
          <TabsContent key={category} value={category} className="space-y-3">
            {filterByCategory(category).map((item) => (
              <Card key={item.id} className="p-4 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                  {getStatusBadge(item.daysLeft)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Quantity: <span className="font-medium text-foreground">{item.quantity} {item.unit}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Expires: <span className="font-medium text-foreground">{item.expiryDate}</span>
                  </span>
                </div>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
