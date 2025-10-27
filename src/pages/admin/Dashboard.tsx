import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Package, ChefHat, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalItems: 0,
    moneySaved: 0,
    recipesGenerated: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch total items
      const { count: itemCount } = await supabase
        .from("fridge_items")
        .select("*", { count: "exact", head: true });

      // Fetch money saved (sum of completed items)
      const { data: completedItems } = await supabase
        .from("fridge_items")
        .select("price")
        .eq("status", "consumed");

      const moneySaved = completedItems?.reduce((sum, item) => sum + Number(item.price || 0), 0) || 0;

      // Fetch recent users
      const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setStats({
        totalUsers: userCount || 0,
        totalItems: itemCount || 0,
        moneySaved,
        recipesGenerated: Math.floor(Math.random() * 10000), // Mock data
      });

      setRecentUsers(users || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      trend: "+12%",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Items Tracked",
      value: stats.totalItems.toLocaleString(),
      trend: "+156 this week",
      icon: Package,
      color: "text-green-500",
    },
    {
      title: "Money Saved",
      value: `$${stats.moneySaved.toFixed(2)}`,
      trend: "+$1,234 this week",
      icon: DollarSign,
      color: "text-emerald-500",
    },
    {
      title: "Recipes Generated",
      value: stats.recipesGenerated.toLocaleString(),
      trend: "+89 today",
      icon: ChefHat,
      color: "text-orange-500",
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Signups</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Signup Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
