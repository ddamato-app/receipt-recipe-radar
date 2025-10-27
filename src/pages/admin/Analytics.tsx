import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

// Mock data generators
const generateUserGrowthData = () => {
  const data = [];
  const now = Date.now();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: Math.floor(Math.random() * 20) + 5,
    });
  }
  return data;
};

const generateRecipePopularityData = () => {
  return [
    { name: "Chicken Stir Fry", count: 356 },
    { name: "Caesar Salad", count: 432 },
    { name: "Spaghetti Carbonara", count: 389 },
    { name: "Veggie Omelette", count: 287 },
    { name: "Grilled Salmon", count: 245 },
    { name: "Beef Tacos", count: 223 },
    { name: "Pancakes", count: 198 },
    { name: "Smoothie Bowl", count: 176 },
    { name: "Chicken Curry", count: 154 },
    { name: "Greek Salad", count: 142 },
  ];
};

const generateMoneySavedData = () => {
  const data = [];
  const now = Date.now();
  let cumulative = 0;
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    cumulative += Math.floor(Math.random() * 50) + 20;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      saved: cumulative,
    });
  }
  return data;
};

const generateUserEngagementData = () => {
  return [
    { name: "Active (Last 7 days)", value: 342, color: "#10b981" },
    { name: "Inactive (7-30 days)", value: 128, color: "#f59e0b" },
    { name: "Dormant (30+ days)", value: 67, color: "#ef4444" },
  ];
};

const generateTopUsersData = () => {
  return [
    { email: "user1@example.com", items: 487, joinDate: "2024-01-15" },
    { email: "user2@example.com", items: 423, joinDate: "2024-02-03" },
    { email: "user3@example.com", items: 389, joinDate: "2024-01-28" },
    { email: "user4@example.com", items: 356, joinDate: "2024-03-12" },
    { email: "user5@example.com", items: 334, joinDate: "2024-02-19" },
    { email: "user6@example.com", items: 312, joinDate: "2024-03-05" },
    { email: "user7@example.com", items: 298, joinDate: "2024-01-22" },
    { email: "user8@example.com", items: 276, joinDate: "2024-02-28" },
    { email: "user9@example.com", items: 254, joinDate: "2024-03-15" },
    { email: "user10@example.com", items: 231, joinDate: "2024-02-10" },
  ];
};

const generatePopularIngredientsData = () => {
  return [
    { ingredient: "Chicken Breast", count: 1247 },
    { ingredient: "Eggs", count: 1189 },
    { ingredient: "Milk", count: 1056 },
    { ingredient: "Tomatoes", count: 987 },
    { ingredient: "Lettuce", count: 934 },
    { ingredient: "Cheese", count: 876 },
    { ingredient: "Onions", count: 823 },
    { ingredient: "Garlic", count: 789 },
    { ingredient: "Potatoes", count: 756 },
    { ingredient: "Carrots", count: 712 },
  ];
};

export default function AdminAnalytics() {
  const userGrowthData = generateUserGrowthData();
  const recipePopularityData = generateRecipePopularityData();
  const moneySavedData = generateMoneySavedData();
  const userEngagementData = generateUserEngagementData();
  const topUsersData = generateTopUsersData();
  const popularIngredientsData = generatePopularIngredientsData();

  const totalNewUsers = userGrowthData.reduce((sum, day) => sum + day.users, 0);
  const totalMoneySaved = moneySavedData[moneySavedData.length - 1].saved;
  const totalActiveUsers = userEngagementData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users (30d)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNewUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Money Saved</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMoneySaved.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((userEngagementData[0].value / totalActiveUsers) * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Daily new user signups over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="New Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recipe Popularity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Recipe Popularity</CardTitle>
            <CardDescription>Top 10 most-generated recipes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recipePopularityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  name="Generated Count"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Money Saved Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Money Saved</CardTitle>
            <CardDescription>Cumulative money saved over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={moneySavedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="saved" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Money Saved ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Engagement Chart */}
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>User activity distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userEngagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {userEngagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Users by Items Tracked</CardTitle>
            <CardDescription>Users with the most items in their inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Join Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsersData.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell className="text-right font-semibold">{user.items}</TableCell>
                    <TableCell>{new Date(user.joinDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Popular Ingredients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Ingredients</CardTitle>
            <CardDescription>Most frequently added to fridges</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Times Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularIngredientsData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.ingredient}</TableCell>
                    <TableCell className="text-right font-semibold">{item.count.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
